import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { Floor } from '../models/Floor.js';

const FILE = 'floors.json';

function readAll() { return readJSON(FILE, []); }
function saveAll(data) { writeJSON(FILE, data); }

export const floorsRepo = {
  async getAll(hotelId = null) {
    const floors = readAll();
    if (hotelId) {
      return floors.filter(f => f.hotelId === hotelId);
    }
    return floors;
  },

  async getById(id, hotelId = null) {
    const floors = await this.getAll(hotelId);
    return floors.find(f => f._id === id);
  },

  async getByHotel(hotelId) {
    const floors = await this.getAll(hotelId);
    return floors.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  },

  async create(floorData) {
    const floors = readAll();
    const now = new Date().toISOString();
    
    const floor = {
      _id: uuidv4(),
      hotelId: floorData.hotelId,
      name: floorData.name,
      number: floorData.number,
      displayOrder: floorData.displayOrder || 0,
      createdAt: now,
      updatedAt: now
    };

    // Validate using model
    const floorModel = new Floor(floor);
    const errors = floorModel.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    floors.push(floor);
    saveAll(floors);
    return floor;
  },

  async createMultiple(floorsData, hotelId) {
    const createdFloors = [];
    for (const data of floorsData) {
      const floor = await this.create({ ...data, hotelId });
      createdFloors.push(floor);
    }
    return createdFloors;
  },

  async update(id, updates, hotelId = null) {
    const floors = readAll();
    const index = floors.findIndex(f => f._id === id && (!hotelId || f.hotelId === hotelId));
    
    if (index === -1) {
      throw new Error('Floor not found');
    }

    const now = new Date().toISOString();
    floors[index] = { ...floors[index], ...updates, _id: id, hotelId: floors[index].hotelId, updatedAt: now };
    saveAll(floors);
    return floors[index];
  },

  async delete(id, hotelId = null) {
    const floors = readAll();
    const filtered = floors.filter(f => f._id !== id || (hotelId && f.hotelId !== hotelId));
    
    if (floors.length === filtered.length) {
      throw new Error('Floor not found');
    }

    saveAll(filtered);
    return true;
  },

  async deleteByHotel(hotelId) {
    const floors = readAll();
    const filtered = floors.filter(f => f.hotelId !== hotelId);
    saveAll(filtered);
    return true;
  }
};
