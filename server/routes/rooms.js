import express from 'express';
import { roomsRepo } from '../repositories/roomsRepo.js';
import { authMiddleware, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authMiddleware);
router.use(tenantIsolation);

// Get all rooms for the hotel
router.get('/', async (req,res)=>{
  try { 
    const rooms = await roomsRepo.getAll(req.user.hotelId); 
    res.json(rooms);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get rooms by floor
router.get('/by-floor/:floorId', async (req,res)=>{
  try {
    const rooms = await roomsRepo.getByFloor(req.params.floorId, req.user.hotelId);
    res.json(rooms);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get rooms by status
router.get('/by-status/:status', async (req,res)=>{
  try {
    const rooms = await roomsRepo.getByStatus(req.params.status, req.user.hotelId);
    res.json(rooms);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get available rooms
router.get('/available', async (req,res)=>{
  try {
    const { checkInDate, checkOutDate } = req.query;
    const rooms = await roomsRepo.getAvailable(req.user.hotelId, checkInDate, checkOutDate);
    res.json(rooms);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get rooms needing housekeeping
router.get('/needs-housekeeping', async (req,res)=>{
  try {
    const rooms = await roomsRepo.getNeedingHousekeeping(req.user.hotelId);
    res.json(rooms);
  }
  catch (e){ res.status(500).json({message:e.message}); }
});

// Get specific room
router.get('/:id', async (req,res)=>{
  try { 
    const r = await roomsRepo.getById(req.params.id, req.user.hotelId); 
    if(!r) return res.status(404).json({message:'Room not found'}); 
    res.json(r);
  } 
  catch (e){ res.status(500).json({message:e.message}); }
});

// Create new room
router.post('/', async (req,res)=>{
  try { 
    const roomData = { ...req.body, hotelId: req.user.hotelId };
    const saved = await roomsRepo.create(roomData); 
    res.status(201).json(saved);
  } 
  catch (e){ 
    console.error('[ROOMS] Create room error:', e.message);
    res.status(400).json({message: e.message || 'Failed to create room'}); 
  }
});

// Create multiple rooms
router.post('/bulk', async (req,res)=>{
  try {
    const { rooms } = req.body;
    if (!Array.isArray(rooms)) {
      return res.status(400).json({message: 'rooms must be an array'});
    }
    const created = await roomsRepo.createMultiple(rooms, req.user.hotelId);
    res.status(201).json(created);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Update room
router.put('/:id', async (req,res)=>{
  try { 
    const room = await roomsRepo.update(req.params.id, req.body, req.user.hotelId); 
    if(!room) return res.status(404).json({message:'Room not found'}); 
    res.json(room);
  } 
  catch (e){ res.status(400).json({message:e.message}); }
});

// Update room status
router.post('/:id/status', async (req,res)=>{
  try { 
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({message: 'Status is required'});
    }
    const room = await roomsRepo.setStatus(req.params.id, status, req.user.hotelId); 
    if(!room) return res.status(404).json({message:'Room not found'}); 
    res.json(room);
  } 
  catch (e){ res.status(400).json({message:e.message}); }
});

// Update room status (PATCH method for REST compliance)
router.patch('/:id/status', async (req,res)=>{
  try { 
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({message: 'Status is required'});
    }
    const room = await roomsRepo.setStatus(req.params.id, status, req.user.hotelId); 
    if(!room) return res.status(404).json({message:'Room not found'}); 
    res.json(room);
  } 
  catch (e){ res.status(400).json({message:e.message}); }
});

// Bulk status update
router.post('/bulk-status', async (req,res)=>{
  try {
    const { roomIds, status } = req.body;
    if (!Array.isArray(roomIds) || !status) {
      return res.status(400).json({message: 'roomIds (array) and status are required'});
    }
    const updated = await roomsRepo.updateBulkStatus(roomIds, status, req.user.hotelId);
    res.json({ updated: updated.length, rooms: updated });
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Block room
router.post('/:id/block', async (req,res)=>{
  try {
    const { blockedUntil, reason } = req.body;
    if (!blockedUntil) {
      return res.status(400).json({message: 'blockedUntil date is required'});
    }
    const room = await roomsRepo.blockRoom(req.params.id, blockedUntil, reason || 'Blocked', req.user.hotelId);
    if(!room) return res.status(404).json({message:'Room not found'});
    res.json(room);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// Unblock room
router.post('/:id/unblock', async (req,res)=>{
  try {
    const room = await roomsRepo.unblockRoom(req.params.id, req.user.hotelId);
    if(!room) return res.status(404).json({message:'Room not found'});
    res.json(room);
  }
  catch (e){ res.status(400).json({message:e.message}); }
});

// REMOVED: GET /:id/history endpoint
// Industry standard: Query bookings table for checkout history (no separate room.history)
// Follows pattern used by Opera PMS, Maestro, Cloudbeds, Hotelogix, Airbnb
// Use: GET /api/bookings?roomId=X&status=CheckedOut instead

// Delete room
router.delete('/:id', async (req,res)=>{
  try { 
    const room = await roomsRepo.remove(req.params.id, req.user.hotelId); 
    if(!room) return res.status(404).json({message:'Room not found'}); 
    res.json({message:'Room deleted', room});
  } 
  catch (e){ res.status(500).json({message:e.message}); }
});

export default router;
