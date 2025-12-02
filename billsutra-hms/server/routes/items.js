import express from 'express';
import { itemsRepo } from '../repositories/itemsRepo.js';

const router = express.Router();

// DEBUG endpoint
router.get('/debug', async (req, res) => {
  const { readJSON } = await import('../utils/fileStore.js');
  const items = readJSON('items.json', []);
  res.json({ count: items.length, items });
});

// Get all items
router.get('/', async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const query = {};
    if (category) {
      query.category = category;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    console.log('[DEBUG] Items query:', query);
    const items = await itemsRepo.list(query);
    console.log('[DEBUG] Items found:', items.length);
    res.json(items);
  } catch (error) {
    console.error('[ERROR] Items list:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
  const item = await itemsRepo.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create item
router.post('/', async (req, res) => {
  try {
  const savedItem = await itemsRepo.create(req.body);
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  try {
    const item = await itemsRepo.update(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
  const item = await itemsRepo.remove(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
