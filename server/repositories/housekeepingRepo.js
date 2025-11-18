import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { HousekeepingTask, TASK_STATUS, TASK_PRIORITY, TASK_TYPE } from '../models/HousekeepingTask.js';

const FILE = 'housekeeping.json';

function readAll(){ return readJSON(FILE, []);} 
function saveAll(d){ writeJSON(FILE, d);} 

export const housekeepingRepo = {
  async getAll(hotelId, filters = {}) {
    const tasks = readAll();
    let filtered = hotelId ? tasks.filter(t => t.hotelId === hotelId) : tasks;
    
    if (filters.status) filtered = filtered.filter(t => t.status === filters.status);
    if (filters.roomId) filtered = filtered.filter(t => t.roomId === filters.roomId);
    if (filters.roomNumber) filtered = filtered.filter(t => t.roomNumber === filters.roomNumber);
    if (filters.assignedTo) filtered = filtered.filter(t => t.assignedTo === filters.assignedTo);
    if (filters.type) filtered = filtered.filter(t => t.type === filters.type);
    
    return filtered.sort((a, b) => {
      const aModel = new HousekeepingTask(a);
      const bModel = new HousekeepingTask(b);
      const scoreDiff = bModel.calculatePriorityScore() - aModel.calculatePriorityScore();
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  },

  async list(query={}){
    const hotelId = query.hotelId || null;
    return this.getAll(hotelId, query);
  },

  async getById(id, hotelId = null) {
    const tasks = readAll();
    const task = tasks.find(t => t._id === id);
    if (task && hotelId && task.hotelId !== hotelId) return null;
    return task;
  },

  async getPending(hotelId) {
    return this.getAll(hotelId, { status: TASK_STATUS.PENDING });
  },

  async getInProgress(hotelId) {
    return this.getAll(hotelId, { status: TASK_STATUS.IN_PROGRESS });
  },

  async create(data){
    const tasks = readAll();
    const now = new Date().toISOString();
    
    // **INDUSTRY STANDARD**: Check for duplicate pending/in-progress tasks
    // Opera PMS, Cloudbeds, Mews: One active task per room per type
    const taskType = data.type || TASK_TYPE.CLEANING;
    const roomIdentifier = data.roomId || data.roomNumber;
    
    if (roomIdentifier && taskType) {
      const existingTask = tasks.find(t => 
        (t.roomId === data.roomId || t.roomNumber === data.roomNumber) &&
        t.type === taskType &&
        (t.status === TASK_STATUS.PENDING || t.status === TASK_STATUS.IN_PROGRESS)
      );
      
      if (existingTask) {
        console.log(`[HOUSEKEEPING] Duplicate prevented: ${taskType} task already exists for room ${data.roomNumber || data.roomId} (Status: ${existingTask.status})`);
        
        // Update priority if new request is higher priority
        if (data.priority && data.priority === TASK_PRIORITY.HIGH && existingTask.priority !== TASK_PRIORITY.HIGH) {
          existingTask.priority = TASK_PRIORITY.HIGH;
          existingTask.updatedAt = now;
          if (data.nextArrivalTime) existingTask.nextArrivalTime = data.nextArrivalTime;
          if (data.description) existingTask.description = data.description;
          saveAll(tasks);
          console.log(`[HOUSEKEEPING] Updated existing task to HIGH priority`);
        }
        
        return existingTask; // Return existing task instead of creating duplicate
      }
    }
    
    const task = {
      _id: uuidv4(),
      hotelId: data.hotelId || null,
      roomId: data.roomId || '',
      roomNumber: data.roomNumber || '',
      type: taskType,
      status: data.status || TASK_STATUS.PENDING,
      priority: data.priority || TASK_PRIORITY.MEDIUM,
      assignedTo: data.assignedTo || null,
      assignedToName: data.assignedToName || '',
      description: data.description || data.task || '',
      notes: data.notes || '',
      reportedIssues: data.reportedIssues || [],
      checklist: data.checklist || [],
      estimatedDuration: Number(data.estimatedDuration || 30),
      actualDuration: data.actualDuration || null,
      startTime: data.startTime || null,
      completedTime: data.completedTime || null,
      verifiedBy: data.verifiedBy || null,
      verifiedTime: data.verifiedTime || null,
      nextArrivalTime: data.nextArrivalTime || null,
      bookingId: data.bookingId || null,
      // Legacy field
      task: data.task || '',
      dueDate: data.dueDate || '',
      createdAt: now,
      updatedAt: now,
    };

    if (task.hotelId) {
      const taskModel = new HousekeepingTask(task);
      const errors = taskModel.validate();
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
    }

    tasks.push(task);
    saveAll(tasks);
    console.log(`[HOUSEKEEPING] Created new ${taskType} task for room ${task.roomNumber || task.roomId}`);
    
    return task;
  },

  async createFromCheckout(roomId, roomNumber, hotelId, bookingId = null, nextArrivalTime = null) {
    const priority = nextArrivalTime ? TASK_PRIORITY.HIGH : TASK_PRIORITY.MEDIUM;
    const description = nextArrivalTime 
      ? `Priority cleaning - Next arrival at ${new Date(nextArrivalTime).toLocaleTimeString()}`
      : 'Post-checkout cleaning';
    
    return this.create({
      hotelId,
      roomId,
      roomNumber,
      type: TASK_TYPE.CLEANING,
      priority,
      description,
      bookingId,
      nextArrivalTime
    });
  },

  async createFromRoomStatus(roomId, roomNumber, hotelId, taskType = 'CLEANING', description = '') {
    // Check if there's already a pending/in-progress task for this room
    const existing = await this.getAll(hotelId, { roomId });
    const activeTasks = existing.filter(t => 
      t.status === TASK_STATUS.PENDING || t.status === TASK_STATUS.IN_PROGRESS
    );
    
    // Don't create duplicate tasks
    if (activeTasks.length > 0) {
      return activeTasks[0];
    }
    
    return this.create({
      hotelId,
      roomId,
      roomNumber,
      type: taskType,
      priority: TASK_PRIORITY.MEDIUM,
      description: description || 'Room needs attention',
      status: TASK_STATUS.PENDING
    });
  },

  async update(id, data, hotelId = null){
    const tasks = readAll();
    const idx = tasks.findIndex(t=>t._id===id);
    if (idx===-1) return null;
    
    if (hotelId && tasks[idx].hotelId && tasks[idx].hotelId !== hotelId) return null;

    tasks[idx] = { ...tasks[idx], ...data, hotelId: tasks[idx].hotelId, _id: tasks[idx]._id, updatedAt: new Date().toISOString() };
    saveAll(tasks);
    return tasks[idx];
  },

  async start(id, assignedTo = null, hotelId = null) {
    const task = await this.getById(id, hotelId);
    if (!task) return null;

    const updated = await this.update(id, {
      status: TASK_STATUS.IN_PROGRESS,
      startTime: new Date().toISOString(),
      assignedTo: assignedTo || task.assignedTo
    }, hotelId);

    // Update room housekeeping status to IN_PROGRESS
    if (updated && task.roomId) {
      try {
        const { roomsRepo } = await import('./roomsRepo.js');
        const { HOUSEKEEPING_STATUS } = await import('../models/Room.js');
        await roomsRepo.update(task.roomId, { housekeepingStatus: HOUSEKEEPING_STATUS.IN_PROGRESS }, hotelId);
        console.log(`[HOUSEKEEPING] Room ${task.roomNumber} status → IN_PROGRESS`);
      } catch (err) {
        console.error('[HOUSEKEEPING] Failed to update room status:', err.message);
      }
    }

    return updated;
  },

  async complete(id, notes = '', reportedIssues = [], hotelId = null) {
    const task = await this.getById(id, hotelId);
    if (!task) return null;

    const now = new Date().toISOString();
    const actualDuration = task.startTime 
      ? Math.round((new Date(now) - new Date(task.startTime)) / 60000)
      : null;

    const updated = await this.update(id, {
      status: TASK_STATUS.COMPLETED,
      completedTime: now,
      actualDuration,
      notes: notes || task.notes,
      reportedIssues: reportedIssues.length > 0 ? reportedIssues : task.reportedIssues
    }, hotelId);
    
    // **INDUSTRY STANDARD AUTO-SYNC** (Opera PMS, Maestro, Cloudbeds, Mews)
    // Update room housekeeping status based on completed task AND remaining pending tasks
    if (updated && (task.roomId || task.roomNumber)) {
      const { roomsRepo } = await import('./roomsRepo.js');
      const { HOUSEKEEPING_STATUS } = await import('../models/Room.js');
      
      // Get room by ID or number
      let room = null;
      if (task.roomId) {
        room = await roomsRepo.getById(task.roomId, hotelId);
      } else if (task.roomNumber) {
        const allRooms = await roomsRepo.list({});
        room = allRooms.find(r => r.number === task.roomNumber);
      }
      
      if (room) {
        // Get ALL pending/in-progress tasks for this room (CRITICAL: Check by both roomId AND roomNumber)
        const allTasks = readAll();
        const roomTasks = allTasks.filter(t => 
          (t.roomId === room._id || t.roomNumber === room.number) &&
          t._id !== id && // Exclude the task we just completed
          (t.status === TASK_STATUS.PENDING || t.status === TASK_STATUS.IN_PROGRESS)
        );
        
        const pendingCleaning = roomTasks.filter(t => t.type === TASK_TYPE.CLEANING);
        const pendingMaintenance = roomTasks.filter(t => t.type === TASK_TYPE.MAINTENANCE);
        const pendingInspection = roomTasks.filter(t => t.type === TASK_TYPE.INSPECTION);
        
        let newHousekeepingStatus = null;
        
        // **INDUSTRY STANDARD PRIORITY LOGIC** (Opera PMS, Maestro)
        // Priority: MAINTENANCE > DIRTY > INSPECTED > CLEAN
        
        if (task.type === TASK_TYPE.CLEANING) {
          // CLEANING task completed
          if (pendingMaintenance.length > 0) {
            // Has pending maintenance → MAINTENANCE (highest priority)
            newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
            console.log(`[HOUSEKEEPING] Room ${room.number}: CLEANING done but ${pendingMaintenance.length} MAINTENANCE pending → MAINTENANCE`);
          } else if (pendingCleaning.length > 0) {
            // Has MORE cleaning tasks → Stay DIRTY
            newHousekeepingStatus = HOUSEKEEPING_STATUS.DIRTY;
            console.log(`[HOUSEKEEPING] Room ${room.number}: CLEANING done but ${pendingCleaning.length} more CLEANING pending → DIRTY`);
          } else {
            // No pending tasks → CLEAN
            newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
            console.log(`[HOUSEKEEPING] Room ${room.number}: CLEANING done, no pending tasks → CLEAN`);
          }
        } 
        else if (task.type === TASK_TYPE.MAINTENANCE) {
          // MAINTENANCE task completed
          if (reportedIssues && reportedIssues.length > 0) {
            // Maintenance found NEW issues → Stay MAINTENANCE (create follow-up task)
            newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
            console.log(`[HOUSEKEEPING] Room ${room.number}: MAINTENANCE done but found ${reportedIssues.length} issues → MAINTENANCE`);
          } else if (pendingMaintenance.length > 0) {
            // Other maintenance tasks pending → Stay MAINTENANCE
            newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
            console.log(`[HOUSEKEEPING] Room ${room.number}: MAINTENANCE done but ${pendingMaintenance.length} more MAINTENANCE pending → MAINTENANCE`);
          } else if (pendingCleaning.length > 0) {
            // Cleaning needed → DIRTY
            newHousekeepingStatus = HOUSEKEEPING_STATUS.DIRTY;
            console.log(`[HOUSEKEEPING] Room ${room.number}: MAINTENANCE done but ${pendingCleaning.length} CLEANING pending → DIRTY`);
          } else {
            // All tasks done → CLEAN
            newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
            console.log(`[HOUSEKEEPING] Room ${room.number}: MAINTENANCE done, no pending tasks → CLEAN`);
          }
        }
        else if (task.type === TASK_TYPE.INSPECTION) {
          // INSPECTION task completed
          if (reportedIssues && reportedIssues.length > 0) {
            // Inspection FAILED → Create maintenance task + MAINTENANCE status
            newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
            console.log(`[HOUSEKEEPING] Room ${room.number}: INSPECTION failed with ${reportedIssues.length} issues → MAINTENANCE`);
            
            // Auto-create maintenance task for issues found
            const maintenanceTask = {
              _id: uuidv4(),
              hotelId: room.hotelId || hotelId,
              roomId: room._id,
              roomNumber: room.number,
              type: TASK_TYPE.MAINTENANCE,
              status: TASK_STATUS.PENDING,
              priority: TASK_PRIORITY.HIGH,
              description: `Issues found during inspection: ${reportedIssues.join(', ')}`,
              reportedIssues: reportedIssues,
              notes: `Auto-created from inspection task ${id}`,
              createdAt: now,
              updatedAt: now
            };
            allTasks.push(maintenanceTask);
            saveAll(allTasks);
            console.log(`[HOUSEKEEPING] Auto-created MAINTENANCE task ${maintenanceTask._id} for inspection issues`);
          } else if (pendingMaintenance.length > 0 || pendingCleaning.length > 0) {
            // Has pending tasks → Don't override to INSPECTED
            newHousekeepingStatus = pendingMaintenance.length > 0 ? HOUSEKEEPING_STATUS.MAINTENANCE : HOUSEKEEPING_STATUS.DIRTY;
            console.log(`[HOUSEKEEPING] Room ${room.number}: INSPECTION passed but pending tasks exist → ${newHousekeepingStatus}`);
          } else {
            // Inspection PASSED, no pending tasks → INSPECTED (VIP-ready)
            newHousekeepingStatus = HOUSEKEEPING_STATUS.INSPECTED;
            console.log(`[HOUSEKEEPING] Room ${room.number}: INSPECTION passed → INSPECTED`);
          }
        }
        else if (task.type === TASK_TYPE.DEEP_CLEANING) {
          // DEEP_CLEANING completed
          if (pendingMaintenance.length > 0) {
            newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
            console.log(`[HOUSEKEEPING] Room ${room.number}: DEEP_CLEANING done but MAINTENANCE pending → MAINTENANCE`);
          } else {
            // Deep cleaning → Very clean, ready for INSPECTION or use
            newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
            console.log(`[HOUSEKEEPING] Room ${room.number}: DEEP_CLEANING done → CLEAN`);
          }
        }
        
        // Update room housekeeping status
        if (newHousekeepingStatus) {
          await roomsRepo.update(room._id, { 
            housekeepingStatus: newHousekeepingStatus,
            updatedAt: now
          }, hotelId);
        }
      }
    }
    
    return updated;
  },

  async verify(id, verifiedBy, hotelId = null) {
    return this.update(id, {
      status: TASK_STATUS.VERIFIED,
      verifiedBy,
      verifiedTime: new Date().toISOString()
    }, hotelId);
  },

  async assign(id, assignedTo, assignedToName, hotelId = null) {
    return this.update(id, { assignedTo, assignedToName }, hotelId);
  },

  async remove(id, hotelId = null){
    const tasks = readAll();
    const idx = tasks.findIndex(t=>t._id===id);
    if (idx===-1) return null;
    
    if (hotelId && tasks[idx].hotelId && tasks[idx].hotelId !== hotelId) return null;

    const [removed] = tasks.splice(idx,1);
    saveAll(tasks);
    return removed;
  },

  async getStats(hotelId) {
    const tasks = await this.getAll(hotelId);
    
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
      inProgress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
      completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
      verified: tasks.filter(t => t.status === TASK_STATUS.VERIFIED).length,
      highPriority: tasks.filter(t => t.priority === TASK_PRIORITY.HIGH || t.priority === TASK_PRIORITY.URGENT).length
    };
  }
};
