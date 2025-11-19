import express from 'express';
import { bookingsRepo } from '../repositories/bookingsRepo.js';
import { validateBookingInput } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', async (req,res)=>{
  try { 
    const { status, date, roomId } = req.query; 
    const list = await bookingsRepo.list({ status, date, roomId, hotelId: req.user?.hotelId }); 
    res.json(list);
  } 
  catch (e){ res.status(500).json({message:e.message}); }
});

router.get('/:id', async (req,res)=>{
  try { const b = await bookingsRepo.getById(req.params.id); if(!b) return res.status(404).json({message:'Booking not found'}); res.json(b);} 
  catch (e){ res.status(500).json({message:e.message}); }
});

router.post('/', validateBookingInput, async (req,res)=>{
  try { const saved = await bookingsRepo.create(req.body); res.status(201).json(saved);} 
  catch (e){ res.status(400).json({message:e.message}); }
});

router.put('/:id', async (req,res)=>{
  try { const b = await bookingsRepo.update(req.params.id, req.body); if(!b) return res.status(404).json({message:'Booking not found'}); res.json(b);} 
  catch (e){ res.status(400).json({message:e.message}); }
});

router.post('/:id/check-in', async (req,res)=>{
  try { const b = await bookingsRepo.checkIn(req.params.id); if(!b) return res.status(404).json({message:'Booking not found'}); res.json(b);} 
  catch (e){ res.status(400).json({message:e.message}); }
});

router.post('/:id/check-out', async (req,res)=>{
  console.log(`[ROUTE] Checkout called for booking ID: ${req.params.id}`);
  try { 
    const b = await bookingsRepo.checkOut(req.params.id); 
    console.log(`[ROUTE] Checkout completed. Room: ${b.roomNumber}, Status: ${b.status}`);
    if(!b) return res.status(404).json({message:'Booking not found'}); 
    res.json(b);
  } 
  catch (e){ 
    console.error(`[ROUTE ERROR] Checkout failed:`, e.message);
    res.status(400).json({message:e.message}); 
  }
});

// Folio: add line (Enhanced with category, tax calculation)
router.post('/:id/folio/lines', async (req,res)=>{
  try {
    console.log('[DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.description || req.body.quantity === undefined || req.body.rate === undefined) {
      return res.status(400).json({ message: 'Missing required fields: description, quantity, and rate are required' });
    }
    
    const b = await bookingsRepo.getById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Booking not found' });
    
    console.log('[DEBUG] Found booking:', b.reservationNumber);
    
    // Enhanced line item with full tax breakdown
    const quantity = Number(req.body.quantity || 1);
    const rate = Number(req.body.rate || req.body.amount || 0);
    const baseAmount = quantity * rate;
    const taxRate = Number(req.body.taxRate || 0);
    
    console.log('[DEBUG] Calculations - quantity:', quantity, 'rate:', rate, 'baseAmount:', baseAmount, 'taxRate:', taxRate);
    
    // Calculate GST (CGST + SGST for same state, IGST for different state)
    const isSameState = true; // TODO: Check hotel state vs customer state
    let cgst = 0, sgst = 0, igst = 0;
    
    if (isSameState) {
      cgst = (baseAmount * taxRate) / 200; // Half of tax rate
      sgst = (baseAmount * taxRate) / 200; // Half of tax rate
    } else {
      igst = (baseAmount * taxRate) / 100;
    }
    
    const totalAmount = baseAmount + cgst + sgst + igst;
    
    console.log('[DEBUG] Tax calculations - cgst:', cgst, 'sgst:', sgst, 'totalAmount:', totalAmount);
    
    const line = {
      _id: (Math.random().toString(36).slice(2)),
      date: new Date().toISOString(),
      category: req.body.category || 'MISC', // ROOM, FOOD_BEVERAGE, LAUNDRY, TRANSPORT, MINIBAR, SPA, MISC
      description: req.body.description,
      itemId: req.body.itemId || null,
      quantity: quantity,
      rate: rate,
      amount: baseAmount,
      taxRate: taxRate,
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      postedBy: req.user?.id || 'system',
      remarks: req.body.remarks || ''
    };
    
    console.log('[DEBUG] Line created:', JSON.stringify(line, null, 2));
    
    b.folio = b.folio || { lines: [], payments: [], total: b.amount, balance: b.amount };
    b.folio.lines.push(line);
    
    // Recalculate folio totals
    const roomCharges = Number(b.amount || 0);
    const additionalCharges = b.folio.lines.reduce((sum, l) => sum + Number(l.totalAmount || 0), 0);
    b.folio.total = roomCharges + additionalCharges;
    
    const totalPaid = b.folio.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const advancePaid = Number(b.advancePayment || 0);
    b.folio.balance = b.folio.total - totalPaid - advancePaid; // Allow negative balance (credit)
    
    console.log('[DEBUG] Folio totals - total:', b.folio.total, 'balance:', b.folio.balance);
    console.log('[DEBUG] Calling bookingsRepo.update...');
    
    const saved = await bookingsRepo.update(req.params.id, b);
    
    console.log('[DEBUG] Update complete, sending response');
    res.status(201).json({ line, booking: saved });
  } catch(e){ 
    console.error('[ERROR] Add folio line - Full error:', e);
    console.error('[ERROR] Stack:', e.stack);
    res.status(400).json({ message: e.message }); 
  }
});

// Folio: add payment (Enhanced with better tracking)
router.post('/:id/payments', async (req,res)=>{
  try {
    const b = await bookingsRepo.getById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Booking not found' });
    
    const payment = {
      _id: (Math.random().toString(36).slice(2)),
      date: new Date().toISOString(),
      method: req.body.method || 'Cash', // Cash, Card, UPI, BankTransfer, Cheque, CompanyAccount
      amount: Number(req.body.amount || 0),
      reference: req.body.reference || '', // Transaction ID, Cheque No, etc.
      remarks: req.body.remarks || '',
      collectedBy: req.user?.id || 'system'
    };
    
    b.folio = b.folio || { lines: [], payments: [], total: b.amount, balance: b.amount };
    b.folio.payments.push(payment);
    
    // Recalculate balance including advance
    const totalPaid = b.folio.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const advancePaid = Number(b.advancePayment || 0);
    b.folio.balance = (b.folio.total || b.amount) - totalPaid - advancePaid; // Allow negative balance (credit)
    
    const saved = await bookingsRepo.update(req.params.id, b);
    res.status(201).json({ payment, booking: saved });
  } catch(e){ res.status(400).json({ message: e.message }); }
});

router.delete('/:id', async (req,res)=>{
  try { const b = await bookingsRepo.remove(req.params.id); if(!b) return res.status(404).json({message:'Booking not found'}); res.json({message:'Booking deleted'});} 
  catch (e){ res.status(500).json({message:e.message}); }
});

export default router;
