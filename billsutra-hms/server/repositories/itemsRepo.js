import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Item from '../models/Item.js';
import { readJSON, writeJSON } from '../utils/fileStore.js';

const FILE_NAME = 'items.json';

function isMongoConnected() {
  // Be strict: require an active DB handle to avoid buffered ops/timeouts
  return mongoose.connection?.readyState === 1 && !!mongoose.connection?.db;
}

// File-store helpers
function readAll() {
  return readJSON(FILE_NAME, []);
}

function saveAll(items) {
  writeJSON(FILE_NAME, items);
}

export const itemsRepo = {
  async list(query = {}) {
    if (isMongoConnected()) {
      const mongoQuery = {};
      if (query.category) mongoQuery.category = query.category;
      if (typeof query.isActive === 'boolean') mongoQuery.isActive = query.isActive;
      return await Item.find(mongoQuery).sort({ name: 1 });
    }

    // file store
    let items = readAll();
    console.log('[DEBUG] ItemsRepo - Total items in file:', items.length);
    console.log('[DEBUG] ItemsRepo - Query:', JSON.stringify(query));
    if (query.category) items = items.filter(i => i.category === query.category);
    if (typeof query.isActive === 'boolean') items = items.filter(i => !!i.isActive === query.isActive);
    console.log('[DEBUG] ItemsRepo - Items after filtering:', items.length);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id) {
    if (isMongoConnected()) {
      return await Item.findById(id);
    }
    const items = readAll();
    return items.find(i => i._id === id);
  },

  async create(data) {
    if (isMongoConnected()) {
      const doc = new Item(data);
      return await doc.save();
    }
    const items = readAll();
    const now = new Date().toISOString();
    const item = {
      _id: uuidv4(),
      name: data.name,
      category: data.category || 'Food',
      hsn: data.hsn || '',
      rate: Number(data.rate),
      cgst: Number(data.cgst ?? 2.5),
      sgst: Number(data.sgst ?? 2.5),
      igst: Number(data.igst ?? 0),
      description: data.description || '',
      isActive: data.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    saveAll(items);
    return item;
  },

  async update(id, data) {
    if (isMongoConnected()) {
      return await Item.findByIdAndUpdate(id, data, { new: true });
    }
    const items = readAll();
    const idx = items.findIndex(i => i._id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    items[idx] = { ...items[idx], ...data, rate: Number(data.rate ?? items[idx].rate), updatedAt: now };
    saveAll(items);
    return items[idx];
  },

  async remove(id) {
    if (isMongoConnected()) {
      return await Item.findByIdAndDelete(id);
    }
    const items = readAll();
    const idx = items.findIndex(i => i._id === id);
    if (idx === -1) return null;
    const [removed] = items.splice(idx, 1);
    saveAll(items);
    return removed;
  }
};
