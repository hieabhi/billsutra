import express from 'express';
import { ratePlansRepo } from '../repositories/ratePlansRepo.js';
import { authMiddleware, tenantIsolation, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authMiddleware);
router.use(tenantIsolation);

// Get all rate plans for the hotel
router.get('/', async (req,res)=>{
  try { 
    const plans = await ratePlansRepo.getAll(req.user.hotelId);
    res.json(plans);
  } catch(e){ res.status(500).json({message:e.message}); }
});

// Get active rate plans (optionally for a specific date)
router.get('/active', async (req,res)=>{
  try {
    const { date } = req.query;
    const plans = await ratePlansRepo.getActive(req.user.hotelId, date);
    res.json(plans);
  } catch(e){ res.status(500).json({message:e.message}); }
});

// Get applicable rate plans for a booking
router.post('/applicable', async (req,res)=>{
  try {
    const { roomTypeId, checkInDate, nights } = req.body;
    if (!roomTypeId || !checkInDate || !nights) {
      return res.status(400).json({message: 'roomTypeId, checkInDate, and nights are required'});
    }
    const plans = await ratePlansRepo.getApplicablePlans(
      req.user.hotelId,
      roomTypeId,
      checkInDate,
      nights
    );
    res.json(plans);
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Calculate best rate for a booking
router.post('/calculate-rate', async (req,res)=>{
  try {
    const { roomTypeId, baseRate, checkInDate, nights } = req.body;
    if (!roomTypeId || !baseRate || !checkInDate || !nights) {
      return res.status(400).json({message: 'roomTypeId, baseRate, checkInDate, and nights are required'});
    }
    const rateInfo = await ratePlansRepo.calculateBestRate(
      req.user.hotelId,
      roomTypeId,
      baseRate,
      checkInDate,
      nights
    );
    res.json(rateInfo);
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Get specific rate plan
router.get('/:id', async (req,res)=>{
  try {
    const plan = await ratePlansRepo.getById(req.params.id, req.user.hotelId);
    if (!plan) return res.status(404).json({message:'Rate plan not found'});
    res.json(plan);
  } catch(e){ res.status(500).json({message:e.message}); }
});

// Create rate plan (requires admin role)
router.post('/', requireRole('hotelAdmin', 'accounts'), async (req,res)=>{
  try {
    const planData = { ...req.body, hotelId: req.user.hotelId };
    const plan = await ratePlansRepo.create(planData);
    res.status(201).json(plan);
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Update rate plan (requires admin role)
router.put('/:id', requireRole('hotelAdmin', 'accounts'), async (req,res)=>{
  try {
    const plan = await ratePlansRepo.update(req.params.id, req.body, req.user.hotelId);
    if (!plan) return res.status(404).json({message:'Rate plan not found'});
    res.json(plan);
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Delete rate plan (requires admin role)
router.delete('/:id', requireRole('hotelAdmin', 'accounts'), async (req,res)=>{
  try {
    const plan = await ratePlansRepo.remove(req.params.id, req.user.hotelId);
    if (!plan) return res.status(404).json({message:'Rate plan not found'});
    res.json({message:'Rate plan deleted', plan});
  } catch(e){ res.status(500).json({message:e.message}); }
});

// Legacy endpoints for backward compatibility
router.get('/legacy/:roomTypeName', async (req,res)=>{
  try { const p = await ratePlansRepo.getByRoomType(req.params.roomTypeName); res.json(p); } catch(e){ res.status(500).json({message:e.message}); }
});

router.put('/legacy/:roomTypeName', async (req,res)=>{
  try { const p = await ratePlansRepo.setOverrides(req.params.roomTypeName, req.body.overrides||{}); res.json(p); } catch(e){ res.status(400).json({message:e.message}); }
});

router.delete('/legacy/:roomTypeName/:date', async (req,res)=>{
  try { const p = await ratePlansRepo.clearOverride(req.params.roomTypeName, req.params.date); if(!p) return res.status(404).json({message:'Plan not found'}); res.json(p); } catch(e){ res.status(400).json({message:e.message}); }
});

export default router;
