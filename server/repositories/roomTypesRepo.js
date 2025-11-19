import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { RoomType } from '../models/RoomType.js';

const FILE = 'room_types.json';

function readAll(){ return readJSON(FILE, []);} 
function saveAll(d){ writeJSON(FILE, d);} 

export const roomTypesRepo = {
  async getAll(hotelId) {
    const types = readAll();
    if (!hotelId) return types;
    return types.filter(t => t.hotelId === hotelId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  },

  async list(hotelId){ 
    return this.getAll(hotelId);
  },
  
  async getById(id, hotelId = null) {
    const types = readAll();
    const type = types.find(t => t._id === id);
    if (type && hotelId && type.hotelId !== hotelId) return null;
    return type;
  },

  async getByName(name, hotelId) {
    const types = readAll();
    return types.find(t => 
      t.name.toLowerCase() === name.toLowerCase() && 
      t.hotelId === hotelId
    );
  },

  async create(data){
    const types = readAll();
    
    // Check for duplicate name in same hotel
    if (data.hotelId) {
      const existing = types.find(t => 
        t.name.toLowerCase() === String(data.name).toLowerCase() && 
        t.hotelId === data.hotelId
      );
      if (existing) {
        throw new Error(`Room type "${data.name}" already exists in this hotel`);
      }
      
      // Check for duplicate code in same hotel
      if (data.code) {
        const existingCode = types.find(t => 
          t.code.toUpperCase() === String(data.code).toUpperCase() && 
          t.hotelId === data.hotelId
        );
        if (existingCode) {
          throw new Error(`Room type code "${data.code}" already exists in this hotel`);
        }
      }
    }

    const now = new Date().toISOString();
    const rate = Number(data.baseRate || data.defaultRate || 0);
    const t = {
      _id: uuidv4(),
      hotelId: data.hotelId || null,
      name: String(data.name||'').trim(),
      code: data.code || String(data.name||'').toUpperCase().replace(/\s+/g, '_').substring(0, 10),
      description: data.description || '',
      baseRate: rate,
      defaultRate: rate,
      maxOccupancy: Number(data.maxOccupancy || 2),
      defaultAmenities: data.defaultAmenities || data.amenities || [],
      images: data.images || [],
      active: data.active !== undefined ? data.active : true,
      displayOrder: data.displayOrder || 0,
      // Legacy GST fields for backward compatibility
      cgst: Number(data.cgst ?? 2.5),
      sgst: Number(data.sgst ?? 2.5),
      igst: Number(data.igst ?? 0),
      createdAt: now,
      updatedAt: now
    };

    // Validate using model
    const roomTypeModel = new RoomType(t);
    const errors = roomTypeModel.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    types.push(t); saveAll(types); return t;
  },

  async createMultiple(typesData, hotelId) {
    const createdTypes = [];
    for (const typeData of typesData) {
      const type = await this.create({ ...typeData, hotelId });
      createdTypes.push(type);
    }
    return createdTypes;
  },

  async update(id, data, hotelId = null){
    const types = readAll();
    const idx = types.findIndex(t => t._id === id);
    if (idx === -1) return null;
    
    // Verify hotel ownership
    if (hotelId && types[idx].hotelId !== hotelId) return null;
    
    // Check for duplicate code if code is being changed
    if (data.code && data.code !== types[idx].code && types[idx].hotelId) {
      const existingCode = types.find(t => 
        t._id !== id &&
        t.code.toUpperCase() === String(data.code).toUpperCase() && 
        t.hotelId === types[idx].hotelId
      );
      if (existingCode) {
        throw new Error(`Room type code "${data.code}" already exists in this hotel`);
      }
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== types[idx].name && types[idx].hotelId) {
      const duplicate = types.find(t => 
        t.name.toLowerCase() === data.name.toLowerCase() && 
        t.hotelId === types[idx].hotelId &&
        t._id !== id
      );
      if (duplicate) {
        throw new Error(`Room type "${data.name}" already exists in this hotel`);
      }
    }

    const rate = Number(data.defaultRate ?? data.baseRate ?? types[idx].defaultRate ?? types[idx].baseRate);
    types[idx] = {
      ...types[idx],
      ...data,
      hotelId: types[idx].hotelId, // Prevent changing hotel
      _id: types[idx]._id,
      defaultRate: rate,
      baseRate: rate,
      cgst: Number(data.cgst ?? types[idx].cgst ?? 2.5),
      sgst: Number(data.sgst ?? types[idx].sgst ?? 2.5),
      igst: Number(data.igst ?? types[idx].igst ?? 0),
      updatedAt: new Date().toISOString()
    };
    saveAll(types); return types[idx];
  },

  async remove(id, hotelId = null){
    const types = readAll();
    const idx = types.findIndex(x=>x._id===id); 
    if(idx===-1) return null;
    
    // Verify hotel ownership
    if (hotelId && types[idx].hotelId !== hotelId) return null;

    const [removed]=types.splice(idx,1); saveAll(types); return removed;
  },

  // Calculate GST for a given amount using Indian hotel tax slabs
  async calculateGST(amount, typeId, hotelId = null) {
    const type = typeId ? await this.getById(typeId, hotelId) : null;
    if (type) {
      const roomTypeModel = new RoomType(type);
      return roomTypeModel.calculateGST(amount);
    }
    
    // Fallback to standard Indian hotel GST calculation
    if (amount < 1000) {
      return { rate: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
    } else if (amount >= 1000 && amount < 2500) {
      return { rate: 12, cgst: 6, sgst: 6, igst: 12, total: amount * 0.12 };
    } else if (amount >= 2500 && amount < 7500) {
      return { rate: 18, cgst: 9, sgst: 9, igst: 18, total: amount * 0.18 };
    } else {
      return { rate: 28, cgst: 14, sgst: 14, igst: 28, total: amount * 0.28 };
    }
  }
};
