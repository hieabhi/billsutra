import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Food', 'Beverage', 'Room Service', 'Accommodation', 'Other'],
    default: 'Food'
  },
  hsn: String,
  rate: {
    type: Number,
    required: true
  },
  cgst: {
    type: Number,
    default: 2.5
  },
  sgst: {
    type: Number,
    default: 2.5
  },
  igst: {
    type: Number,
    default: 0
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Item', itemSchema);
