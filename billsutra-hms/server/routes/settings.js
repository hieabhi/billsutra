import express from 'express';
import { settingsRepo } from '../repositories/settingsRepo.js';

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
    res.json(savedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
