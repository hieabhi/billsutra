import express from 'express';
import { settingsRepo } from '../repositories/settingsRepo.js';
import { authenticate } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await settingsRepo.get();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update settings
router.put('/', authenticate, async (req, res) => {
  try {
    const savedSettings = await settingsRepo.update(req.body);
    
    // If hotel name changed, update tenant table in Supabase
    if (req.body.hotelName && req.user?.tenantId) {
      await supabase
        .from('tenants')
        .update({ name: req.body.hotelName })
        .eq('id', req.user.tenantId);
    }
    
    res.json(savedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
