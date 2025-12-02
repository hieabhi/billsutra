import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  hotelName: {
    type: String,
    required: true,
    default: 'Hotel Name'
  },
  address: String,
  phone: String,
  email: String,
  gstNumber: String,
  logo: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branch: String
  },
  terms: String,
  invoicePrefix: {
    type: String,
    default: 'INV'
  },
  nextBillNumber: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('Settings', settingsSchema);
