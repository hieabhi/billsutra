import express from 'express';
import { roomTypesRepo } from '../repositories/roomTypesRepo.js';
import { authMiddleware, tenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authMiddleware);
router.use(tenantIsolation);

// Get all room types for the hotel
router.get('/', async (req,res)=>{
  try { 
    const types = await roomTypesRepo.getAll(req.user.hotelId);
    res.json(types);
  } catch(e){ res.status(500).json({message:e.message}); }
});

// Get specific room type
router.get('/:id', async (req,res)=>{
  try {
    const type = await roomTypesRepo.getById(req.params.id, req.user.hotelId);
    if (!type) return res.status(404).json({message:'Room type not found'});
    res.json(type);
  } catch(e){ res.status(500).json({message:e.message}); }
});

// Calculate GST for a given amount
router.post('/calculate-gst', async (req,res)=>{
  try {
    const { amount, typeId } = req.body;
    if (!amount || amount < 0) {
      return res.status(400).json({message: 'Valid amount is required'});
    }
    const gst = await roomTypesRepo.calculateGST(amount, typeId, req.user.hotelId);
    res.json(gst);
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Create room type
router.post('/', async (req,res)=>{
  try { 
    const typeData = { ...req.body, hotelId: req.user.hotelId };
    const t = await roomTypesRepo.create(typeData); 
    res.status(201).json(t); 
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Create multiple room types
router.post('/bulk', async (req,res)=>{
  try {
    const { types } = req.body;
    if (!Array.isArray(types)) {
      return res.status(400).json({message: 'types must be an array'});
    }
    const created = await roomTypesRepo.createMultiple(types, req.user.hotelId);
    res.status(201).json(created);
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Update room type
router.put('/:id', async (req,res)=>{
  try { 
    const t = await roomTypesRepo.update(req.params.id, req.body, req.user.hotelId); 
    if(!t) return res.status(404).json({message:'Room type not found'}); 
    res.json(t); 
  } catch(e){ res.status(400).json({message:e.message}); }
});

// Delete room type
router.delete('/:id', async (req,res)=>{
  try { 
    const t = await roomTypesRepo.remove(req.params.id, req.user.hotelId); 
    if(!t) return res.status(404).json({message:'Room type not found'}); 
    res.json({message:'Room type deleted', type: t}); 
  } catch(e){ res.status(500).json({message:e.message}); }
});

export default router;
