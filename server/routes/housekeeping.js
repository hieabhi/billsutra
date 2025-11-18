import express from 'express';
import { housekeepingRepo } from '../repositories/housekeepingRepo.js';
import { roomsRepo } from '../repositories/roomsRepo.js';
import { authMiddleware, tenantIsolation, requireRole } from '../middleware/auth.js';
import { HOUSEKEEPING_STATUS } from '../models/Room.js';
import { syncHousekeepingStatus } from '../utils/dualStatusSync.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authMiddleware);
router.use(tenantIsolation);

// Get all tasks with optional filtering
router.get('/', async (req,res)=>{
  try { 
    const filters = {
      status: req.query.status,
      roomId: req.query.roomId,
      roomNumber: req.query.roomNumber,
      assignedTo: req.query.assignedTo,
      type: req.query.type
    };
    const tasks = await housekeepingRepo.getAll(req.user.hotelId, filters);
    res.json(tasks);
  } 
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get pending tasks
router.get('/pending', async (req,res)=>{
  try {
    const tasks = await housekeepingRepo.getPending(req.user.hotelId);
    res.json(tasks);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get in-progress tasks
router.get('/in-progress', async (req,res)=>{
  try {
    const tasks = await housekeepingRepo.getInProgress(req.user.hotelId);
    res.json(tasks);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get tasks for specific user
router.get('/my-tasks', async (req,res)=>{
  try {
    const tasks = await housekeepingRepo.getByAssignee(req.user.userId, req.user.hotelId);
    res.json(tasks);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get statistics
router.get('/stats', async (req,res)=>{
  try {
    const stats = await housekeepingRepo.getStats(req.user.hotelId);
    res.json(stats);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Sync dirty rooms with housekeeping tasks
router.post('/sync-dirty-rooms', requireRole('hotelAdmin', 'frontDesk', 'housekeeping'), async (req,res)=>{
  try {
    const { roomsRepo } = await import('../repositories/roomsRepo.js');
    const { HOUSEKEEPING_STATUS } = await import('../models/Room.js');
    
    // Get all rooms with DIRTY housekeeping status
    const allRooms = await roomsRepo.getAll(req.user.hotelId);
    const dirtyRooms = allRooms.filter(r => r.housekeepingStatus === HOUSEKEEPING_STATUS.DIRTY);
    
    // Create tasks for dirty rooms without existing tasks
    const tasksCreated = [];
    for (const room of dirtyRooms) {
      const existingTasks = await housekeepingRepo.getAll(req.user.hotelId, { roomId: room._id });
      const hasActiveTask = existingTasks.some(t => 
        t.status === 'PENDING' || t.status === 'IN_PROGRESS'
      );
      
      if (!hasActiveTask) {
        const task = await housekeepingRepo.createFromRoomStatus(
          room._id,
          room.number,
          req.user.hotelId,
          'CLEANING',
          'Room marked as dirty - needs cleaning'
        );
        tasksCreated.push(task);
      }
    }
    
    res.json({ 
      message: `Synced ${dirtyRooms.length} dirty rooms`,
      tasksCreated: tasksCreated.length,
      tasks: tasksCreated
    });
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get specific task
router.get('/:id', async (req,res)=>{
  try {
    const task = await housekeepingRepo.getById(req.params.id, req.user.hotelId);
    if (!task) return res.status(404).json({message:'Task not found'});
    res.json(task);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Create task (frontDesk and housekeeping roles)
router.post('/', requireRole('hotelAdmin', 'frontDesk', 'housekeeping'), async (req,res)=>{
  try { 
    const taskData = { ...req.body, hotelId: req.user.hotelId };
    const saved = await housekeepingRepo.create(taskData);
    
    // **INDUSTRY STANDARD**: Immediate sync (Opera PMS, Maestro, Cloudbeds)
    try {
      const syncResult = await syncHousekeepingStatus();
      console.log('[HOUSEKEEPING] Immediate sync completed:', syncResult);
    } catch (syncError) {
      console.error('[HOUSEKEEPING] Sync failed:', syncError.message);
      // Don't fail the request if sync fails - task is already created
    }
    
    res.status(201).json(saved);
  } 
  catch (e){ 
    console.error('[HOUSEKEEPING] Create task error:', e);
    res.status(400).json({message:e.message}); 
  }
});

// Start task
router.post('/:id/start', async (req,res)=>{
  try {
    const task = await housekeepingRepo.start(req.params.id, req.user.userId, req.user.hotelId);
    if (!task) return res.status(404).json({message:'Task not found'});
    res.json(task);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Complete task
router.post('/:id/complete', async (req,res)=>{
  try {
    const { notes, reportedIssues } = req.body;
    const task = await housekeepingRepo.complete(
      req.params.id, 
      notes || '',
      reportedIssues || [],
      req.user.hotelId
    );
    if (!task) return res.status(404).json({message:'Task not found'});
    
    // **INDUSTRY STANDARD**: Immediate sync after completion (Opera PMS, Maestro)
    try {
      const syncResult = await syncHousekeepingStatus();
      console.log('[HOUSEKEEPING] Completion sync done:', syncResult);
    } catch (syncError) {
      console.error('[HOUSEKEEPING] Completion sync failed:', syncError.message);
    }
    
    res.json(task);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Verify task (requires supervisor role)
router.post('/:id/verify', requireRole('hotelAdmin', 'frontDesk'), async (req,res)=>{
  try {
    const task = await housekeepingRepo.verify(req.params.id, req.user.userId, req.user.hotelId);
    if (!task) return res.status(404).json({message:'Task not found'});
    res.json(task);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Reject task (requires supervisor role)
router.post('/:id/reject', requireRole('hotelAdmin', 'frontDesk'), async (req,res)=>{
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({message: 'Rejection reason is required'});
    }
    const task = await housekeepingRepo.reject(req.params.id, reason, req.user.hotelId);
    if (!task) return res.status(404).json({message:'Task not found'});
    res.json(task);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Assign task
router.post('/:id/assign', requireRole('hotelAdmin', 'frontDesk', 'housekeeping'), async (req,res)=>{
  try {
    const { assignedTo, assignedToName } = req.body;
    if (!assignedTo) {
      return res.status(400).json({message: 'assignedTo is required'});
    }
    const task = await housekeepingRepo.assign(
      req.params.id,
      assignedTo,
      assignedToName || '',
      req.user.hotelId
    );
    if (!task) return res.status(404).json({message:'Task not found'});
    res.json(task);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Update task
router.put('/:id', async (req,res)=>{
  try { 
    const t = await housekeepingRepo.update(req.params.id, req.body, req.user.hotelId); 
    if(!t) return res.status(404).json({message:'Task not found'}); 
    res.json(t);
  } 
  catch (e){ res.status(400).json({message:e.message}); }
});

// Delete task
router.delete('/:id', requireRole('hotelAdmin', 'frontDesk'), async (req,res)=>{
  try { 
    const t = await housekeepingRepo.remove(req.params.id, req.user.hotelId); 
    if(!t) return res.status(404).json({message:'Task not found'}); 
    res.json({message:'Task deleted', task: t});
  } 
  catch (e){ res.status(500).json({message:e.message}); }
});

export default router;
