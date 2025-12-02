import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import { readJSON, writeJSON } from '../utils/fileStore.js';

const FILE_SETTINGS = 'settings.json';

function isMongoConnected() {
  return mongoose.connection?.readyState === 1;
}

const defaultSettings = {
  hotelName: 'Hotel Name',
  address: '',
  phone: '',
  email: '',
  gstNumber: '',
  logo: '',
  bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branch: '' },
  terms: '',
  invoicePrefix: 'INV',
  nextBillNumber: 1,
};

export const settingsRepo = {
  async get() {
    if (isMongoConnected()) {
      let s = await Settings.findOne();
      if (!s) {
        s = await Settings.create(defaultSettings);
      }
      return s;
    }
    const s = readJSON(FILE_SETTINGS, defaultSettings);
    // Ensure required defaults
    return { ...defaultSettings, ...s };
  },

  async update(data) {
    if (isMongoConnected()) {
      let s = await Settings.findOne();
      if (!s) s = new Settings(defaultSettings);
      Object.assign(s, data);
      return await s.save();
    }
    const current = readJSON(FILE_SETTINGS, defaultSettings);
    const next = { ...current, ...data };
    writeJSON(FILE_SETTINGS, next);
    return next;
  }
};
