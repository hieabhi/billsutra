import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Customer from '../models/Customer.js';
import { readJSON, writeJSON } from '../utils/fileStore.js';

const FILE = 'customers.json';

function isMongoConnected(){
  return mongoose.connection?.readyState === 1 && !!mongoose.connection?.db;
}

function readAll(){ return readJSON(FILE, []);} 
function saveAll(d){ writeJSON(FILE, d);} 

export const customersRepo = {
  async list(){
    if (isMongoConnected()) {
      return await Customer.find().sort({ createdAt: -1 });
    }
    return readAll().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getById(id){
    if (isMongoConnected()) return await Customer.findById(id);
    return readAll().find(c=>c._id===id);
  },
  async create(data){
    if (isMongoConnected()) {
      const c = new Customer(data); return await c.save();
    }
    const list = readAll();
    const now = new Date().toISOString();
    const c = {
      _id: uuidv4(),
      name: String(data.name||'').trim(),
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      gstNumber: data.gstNumber || '',
      type: data.type || 'Walk-in',
      createdAt: now,
      updatedAt: now
    };
    list.push(c); saveAll(list); return c;
  },
  async update(id, data){
    if (isMongoConnected()) return await Customer.findByIdAndUpdate(id, data, { new: true });
    const list = readAll();
    const idx = list.findIndex(c=>c._id===id); if (idx===-1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    saveAll(list); return list[idx];
  },
  async remove(id){
    if (isMongoConnected()) return await Customer.findByIdAndDelete(id);
    const list = readAll();
    const idx = list.findIndex(c=>c._id===id); if (idx===-1) return null;
    const [removed] = list.splice(idx,1); saveAll(list); return removed;
  }
};
