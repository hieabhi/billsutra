import express from 'express';
import { billsRepo } from '../repositories/billsRepo.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const bills = await billsRepo.list({ startDate, endDate, status, hotelId: req.user?.hotelId });
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
    const billData = { ...req.body, hotelId: req.user?.hotelId };
    const savedBill = await billsRepo.create(billData);
    res.status(201).json(savedBill);
  } catch (error) {
    console.error('[CREATE BILL ERROR]:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Update bill
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body, hotelId: req.user?.hotelId };
    const bill = await billsRepo.update(req.params.id, updates);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    console.error('[UPDATE BILL ERROR]:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Delete bill
router.delete('/:id', async (req, res) => {
  try {
    const bill = await billsRepo.remove(req.params.id, req.user?.hotelId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('[DELETE BILL ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
