import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: String,
  email: String,
  address: String,
  gstNumber: String,
  type: {
    type: String,
    enum: ['Regular', 'Walk-in', 'Corporate'],
    default: 'Walk-in'
  }
}, {
  timestamps: true
});

export default mongoose.model('Customer', customerSchema);
