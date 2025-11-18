import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { Hotel } from '../models/Hotel.js';

const FILE = 'hotels.json';

function readAll() { return readJSON(FILE, []); }
function saveAll(data) { writeJSON(FILE, data); }

export const hotelsRepo = {
  async getAll() {
    return readAll();
  },

  async getById(id) {
    const hotels = readAll();
    return hotels.find(h => h._id === id);
  },

  async getByCode(code) {
    const hotels = readAll();
    return hotels.find(h => h.code === code);
  },

  async create(hotelData) {
    const hotels = readAll();
    
    // Check for duplicate code
    if (hotels.some(h => h.code === hotelData.code)) {
      throw new Error('Hotel code already exists');
    }

    const now = new Date().toISOString();
    const hotel = {
      _id: uuidv4(),
      name: hotelData.name,
      code: hotelData.code,
      email: hotelData.email || '',
      phone: hotelData.phone || '',
      address: hotelData.address || '',
      city: hotelData.city || '',
      state: hotelData.state || '',
      country: hotelData.country || 'India',
      pincode: hotelData.pincode || '',
      gstNumber: hotelData.gstNumber || '',
      status: hotelData.status || 'active',
      subscription: hotelData.subscription || {
        plan: 'trial',
        startDate: now,
        endDate: null,
        active: true
      },
      settings: hotelData.settings || {
        checkInTime: '14:00',
        checkOutTime: '11:00',
        currency: 'INR',
        timezone: 'Asia/Kolkata'
      },
      createdAt: now,
      updatedAt: now
    };

    // Validate using model
    const hotelModel = new Hotel(hotel);
    const errors = hotelModel.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    hotels.push(hotel);
    saveAll(hotels);
    return hotel;
  },

  async update(id, updates) {
    const hotels = readAll();
    const index = hotels.findIndex(h => h._id === id);
    
    if (index === -1) {
      throw new Error('Hotel not found');
    }

    const now = new Date().toISOString();
    hotels[index] = { ...hotels[index], ...updates, _id: id, updatedAt: now };
    saveAll(hotels);
    return hotels[index];
  },

  async delete(id) {
    const hotels = readAll();
    const filtered = hotels.filter(h => h._id !== id);
    
    if (hotels.length === filtered.length) {
      throw new Error('Hotel not found');
    }

    saveAll(filtered);
    return true;
  },

  async getActive() {
    const hotels = readAll();
    return hotels.filter(h => h.status === 'active');
  }
};
