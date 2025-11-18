import express from 'express';
import { settingsRepo } from '../repositories/settingsRepo.js';
import supabase from '../config/supabase.js';
import admin from '../config/firebase-admin.js';

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
router.put('/', async (req, res) => {
  try {
    const savedSettings = await settingsRepo.update(req.body);
    
    // If hotel name changed and user is authenticated, update tenant table in Supabase
    if (req.body.hotelName) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          const decodedToken = await admin.auth().verifyIdToken(token);
          
          // Get user's tenant ID
          const { data: user } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('firebase_uid', decodedToken.uid)
            .single();
          
          if (user?.tenant_id) {
            await supabase
              .from('tenants')
              .update({ name: req.body.hotelName })
              .eq('id', user.tenant_id);
          }
        } catch (authError) {
          console.log('Auth not available, skipping tenant update:', authError.message);
        }
      }
    }
    
    res.json(savedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
