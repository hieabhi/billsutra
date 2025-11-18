import express from 'express';
import { billsRepo } from '../repositories/billsRepo.js';

const router = express.Router();

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const bills = await billsRepo.list({ startDate, endDate, status });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats (place before :id route to avoid conflicts)
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await billsRepo.dashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single bill
router.get('/:id', async (req, res) => {
  try {
    const bill = await billsRepo.getById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new bill
router.post('/', async (req, res) => {
  try {
    const savedBill = await billsRepo.create(req.body);
    res.status(201).json(savedBill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update bill
router.put('/:id', async (req, res) => {
  try {
    const bill = await billsRepo.update(req.params.id, req.body);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete bill
router.delete('/:id', async (req, res) => {
  try {
    const bill = await billsRepo.remove(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
