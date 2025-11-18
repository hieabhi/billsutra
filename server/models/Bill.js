import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  customer: {
    name: { type: String, required: true },
    phone: String,
    email: String,
    address: String,
    gstNumber: String
  },
  items: [{
    name: { type: String, required: true },
    hsn: String,
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    cgst: { type: Number, default: 2.5 },
    sgst: { type: Number, default: 2.5 },
    igst: { type: Number, default: 0 },
    amount: Number,
    taxAmount: Number,
    totalAmount: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  cgstTotal: Number,
  sgstTotal: Number,
  igstTotal: Number,
  totalTax: Number,
  grandTotal: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Other'],
    default: 'Cash'
  },
  notes: String,
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Cancelled'],
    default: 'Paid'
  }
}, {
  timestamps: true
});

export default mongoose.model('Bill', billSchema);
