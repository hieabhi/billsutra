/**
 * DUAL STATUS SYNCHRONIZATION SYSTEM
 * Industry Standard (Opera PMS, Maestro, Cloudbeds, Mews)
 * 
 * Rooms have TWO independent statuses:
 * 1. OCCUPANCY STATUS - Who is in the room (AVAILABLE, RESERVED, OCCUPIED, etc.)
 * 2. HOUSEKEEPING STATUS - Cleanliness state (CLEAN, DIRTY, INSPECTED, etc.)
 * 
 * Example: Room can be "RESERVED + DIRTY" (booked for tomorrow but needs cleaning)
 */

import { readJSON, writeJSON } from './fileStore.js';
import { ROOM_STATUS, HOUSEKEEPING_STATUS } from '../models/Room.js';
import { TASK_TYPE } from '../models/HousekeepingTask.js';

/**
 * Sync housekeeping status based on pending/active cleaning tasks
 */
export async function syncHousekeepingStatus() {
  const rooms = readJSON('rooms.json', []);
  const housekeeping = readJSON('housekeeping.json', []);
  const bookings = readJSON('bookings.json', []);
  
  const fixes = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const room of rooms) {
    let newHousekeepingStatus = room.housekeepingStatus || HOUSEKEEPING_STATUS.CLEAN;
    const oldHousekeepingStatus = newHousekeepingStatus;

    // Check for pending/active tasks by type
    const activeTasks = housekeeping.filter(task => 
      task.roomNumber === room.number && 
      (task.status === 'PENDING' || task.status === 'IN_PROGRESS')
    );

    // CRITICAL FIX: Also check if ALL tasks are completed
    const allTasksForRoom = housekeeping.filter(task => task.roomNumber === room.number);
    const allTasksCompleted = allTasksForRoom.length > 0 && 
      allTasksForRoom.every(task => task.status === 'COMPLETED');

    // Categorize tasks
    const maintenanceTasks = activeTasks.filter(t => t.type === TASK_TYPE.MAINTENANCE);
    const cleaningTasks = activeTasks.filter(t => 
      t.type === TASK_TYPE.CLEANING || 
      t.type === TASK_TYPE.DEEP_CLEAN || 
      t.type === TASK_TYPE.TURNDOWN || 
      t.type === TASK_TYPE.LAUNDRY
    );
    const inspectionTasks = activeTasks.filter(t => t.type === TASK_TYPE.INSPECTION);

    // **INDUSTRY STANDARD PRIORITY** (Opera PMS, Maestro, Cloudbeds):
    // MAINTENANCE > DIRTY (needs cleaning) > INSPECTED > CLEAN
    if (maintenanceTasks.length > 0) {
      newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
    } else if (cleaningTasks.length > 0) {
      newHousekeepingStatus = HOUSEKEEPING_STATUS.DIRTY;
    } else if (inspectionTasks.length > 0) {
      newHousekeepingStatus = HOUSEKEEPING_STATUS.INSPECTED;
    } else {
      // No active tasks - determine if CLEAN or DIRTY based on checkout status
      
      // FIX: If all existing tasks are completed, room should be CLEAN
      if (allTasksCompleted) {
        newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
      } else {
        // Check for completed checkout today (room becomes dirty after checkout)
        const todayCheckouts = bookings.filter(booking =>
          booking.roomNumber === room.number &&
          booking.status === 'CheckedOut' &&
          booking.checkOutDate === today
        );

        if (todayCheckouts.length > 0) {
          const cleaningCompleted = housekeeping.some(task =>
            task.roomNumber === room.number &&
            task.status === 'COMPLETED' &&
            (task.type === TASK_TYPE.CLEANING || task.type === TASK_TYPE.DEEP_CLEAN) &&
            task.completedTime &&
            task.completedTime.startsWith(today)
          );

          newHousekeepingStatus = cleaningCompleted 
            ? HOUSEKEEPING_STATUS.CLEAN 
            : HOUSEKEEPING_STATUS.DIRTY;
        } else {
          newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
        }
      }
    }

    // Update if changed
    if (newHousekeepingStatus !== oldHousekeepingStatus) {
      room.housekeepingStatus = newHousekeepingStatus;
      room.updatedAt = new Date().toISOString();
      
      let reason = 'Status synchronized';
      if (maintenanceTasks.length > 0) {
        reason = 'Maintenance task pending';
      } else if (cleaningTasks.length > 0) {
        reason = 'Cleaning task pending';
      } else if (inspectionTasks.length > 0) {
        reason = 'Inspection task pending';
      }
      
      fixes.push({
        room: room.number,
        from: oldHousekeepingStatus || 'NONE',
        to: newHousekeepingStatus,
        reason: reason
      });
    }
  }

  if (fixes.length > 0) {
    writeJSON('rooms.json', rooms);
  }

  return fixes;
}

/**
 * Sync occupancy status based on bookings
 */
export async function syncOccupancyStatus() {
  const rooms = readJSON('rooms.json', []);
  const bookings = readJSON('bookings.json', []);
  
  const fixes = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const room of rooms) {
    let newOccupancyStatus = ROOM_STATUS.AVAILABLE;
    const oldOccupancyStatus = room.status;

    // Skip OUT_OF_SERVICE and BLOCKED rooms
    if (oldOccupancyStatus === ROOM_STATUS.OUT_OF_SERVICE || 
        oldOccupancyStatus === ROOM_STATUS.BLOCKED) {
      continue;
    }

    // Find active booking for this room
    const activeBooking = bookings.find(booking =>
      booking.roomNumber === room.number &&
      booking.status === 'CheckedIn'
    );

    // Find future reservations
    const futureReservation = bookings.find(booking =>
      booking.roomNumber === room.number &&
      booking.status === 'Reserved' &&
      booking.checkInDate >= today
    );

    if (activeBooking) {
      newOccupancyStatus = ROOM_STATUS.OCCUPIED;
    } else if (futureReservation) {
      newOccupancyStatus = ROOM_STATUS.RESERVED;
    } else {
      newOccupancyStatus = ROOM_STATUS.AVAILABLE;
    }

    // Update if changed
    if (newOccupancyStatus !== oldOccupancyStatus) {
      room.status = newOccupancyStatus;
      room.updatedAt = new Date().toISOString();
      
      fixes.push({
        room: room.number,
        from: oldOccupancyStatus,
        to: newOccupancyStatus,
        reason: activeBooking 
          ? `Checked-in booking found` 
          : futureReservation
            ? `Future reservation exists`
            : `No active bookings`
      });
    }
  }

  if (fixes.length > 0) {
    writeJSON('rooms.json', rooms);
  }

  return fixes;
}

/**
 * Initialize housekeepingStatus for rooms that don't have it
 */
export async function initializeHousekeepingStatus() {
  const rooms = readJSON('rooms.json', []);
  let initialized = 0;

  for (const room of rooms) {
    if (!room.housekeepingStatus) {
      // Map old DIRTY/CLEAN status to housekeepingStatus
      if (room.status === 'DIRTY') {
        room.housekeepingStatus = HOUSEKEEPING_STATUS.DIRTY;
        room.status = ROOM_STATUS.AVAILABLE; // Reset occupancy status
      } else if (room.status === 'CLEAN') {
        room.housekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
        room.status = ROOM_STATUS.AVAILABLE; // Reset occupancy status
      } else if (room.status === 'MAINTENANCE') {
        room.housekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
        room.status = ROOM_STATUS.AVAILABLE; // Reset occupancy status
      } else {
        room.housekeepingStatus = HOUSEKEEPING_STATUS.CLEAN; // Default to clean
      }
      
      room.updatedAt = new Date().toISOString();
      initialized++;
    }
  }

  if (initialized > 0) {
    writeJSON('rooms.json', rooms);
  }

  return initialized;
}

/**
 * Auto-create cleaning tasks for dirty rooms (Opera PMS style)
 */
async function autoCreateCleaningTasks() {
  const { readJSON, writeJSON } = await import('./fileStore.js');
  const rooms = readJSON('rooms.json', []);
  const housekeeping = readJSON('housekeeping.json', []);
  
  const tasksCreated = [];
  
  for (const room of rooms) {
    if (room.housekeepingStatus === HOUSEKEEPING_STATUS.DIRTY) {
      // Check if room already has an active cleaning task
      const hasActiveTask = housekeeping.some(task =>
        task.roomId === room._id &&
        (task.status === 'PENDING' || task.status === 'IN_PROGRESS') &&
        task.type === 'CLEANING'
      );
      
      if (!hasActiveTask) {
        // Auto-create cleaning task
        const task = {
          _id: `task-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          hotelId: room.hotelId,
          roomId: room._id,
          roomNumber: room.number,
          type: 'CLEANING',
          status: 'PENDING',
          priority: 'MEDIUM',
          assignedTo: null,
          assignedToName: '',
          description: 'Auto-generated cleaning task for dirty room',
          notes: '',
          reportedIssues: [],
          checklist: [],
          estimatedDuration: 30,
          actualDuration: 0,
          startTime: null,
          completedTime: null,
          verifiedBy: null,
          verifiedTime: null,
          nextArrivalTime: null,
          bookingId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        housekeeping.push(task);
        tasksCreated.push({ room: room.number, taskId: task._id });
      }
    }
  }
  
  if (tasksCreated.length > 0) {
    writeJSON('housekeeping.json', housekeeping);
  }
  
  return tasksCreated;
}

/**
 * Complete dual-status sync (runs on server startup and periodically)
 */
export async function runDualStatusSync() {
  console.log('\n🔄 DUAL STATUS SYNC - Industry Standard (Opera PMS, Maestro, Cloudbeds, Mews)');
  
  // Step 1: Initialize housekeeping status for rooms that don't have it
  const initialized = await initializeHousekeepingStatus();
  if (initialized > 0) {
    console.log(`   ✓ Initialized housekeepingStatus for ${initialized} rooms`);
  }

  // Step 2: Sync occupancy status (AVAILABLE, RESERVED, OCCUPIED)
  const occupancyFixes = await syncOccupancyStatus();
  if (occupancyFixes.length > 0) {
    console.log(`\n   📋 OCCUPANCY STATUS FIXES (${occupancyFixes.length}):`);
    occupancyFixes.forEach(fix => {
      console.log(`      Room ${fix.room}: ${fix.from} → ${fix.to} (${fix.reason})`);
    });
  }

  // Step 3: Sync housekeeping status (CLEAN, DIRTY, MAINTENANCE)
  const housekeepingFixes = await syncHousekeepingStatus();
  if (housekeepingFixes.length > 0) {
    console.log(`\n   🧹 HOUSEKEEPING STATUS FIXES (${housekeepingFixes.length}):`);
    housekeepingFixes.forEach(fix => {
      console.log(`      Room ${fix.room}: ${fix.from} → ${fix.to} (${fix.reason})`);
    });
  }
  
  // Step 4: Auto-create cleaning tasks for dirty rooms (Opera PMS style)
  const tasksCreated = await autoCreateCleaningTasks();
  if (tasksCreated.length > 0) {
    console.log(`\n   🔧 AUTO-CREATED CLEANING TASKS (${tasksCreated.length}):`);
    tasksCreated.forEach(t => {
      console.log(`      Room ${t.room}: Cleaning task auto-created`);
    });
  }

  const totalFixes = occupancyFixes.length + housekeepingFixes.length;
  
  if (totalFixes === 0 && initialized === 0 && tasksCreated.length === 0) {
    console.log('   ✓ All statuses synchronized, no tasks needed');
  }

  console.log('   ✓ Dual-status sync completed\n');

  return {
    initialized,
    occupancyFixes,
    housekeepingFixes,
    tasksCreated,
    totalFixes
  };
}

/**
 * Start periodic dual-status sync (every 5 minutes)
 */
export function startPeriodicDualStatusSync(intervalMinutes = 5) {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  setInterval(async () => {
    console.log(`\n⏰ Periodic dual-status sync (every ${intervalMinutes} mins)...`);
    await runDualStatusSync();
  }, intervalMs);

  console.log(`🔁 Periodic dual-status sync enabled (every ${intervalMinutes} minutes)\n`);
}
