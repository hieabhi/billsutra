import { v4 as uuidv4 } from 'uuid';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { Room, ROOM_STATUS, ROOM_STATUS_TRANSITIONS } from '../models/Room.js';

const FILE = 'rooms.json';

function readAll() { return readJSON(FILE, []); }
function saveAll(data) { writeJSON(FILE, data); }

export const roomsRepo = {
  // Get all rooms for a hotel
  async getAll(hotelId) {
    const rooms = readAll();
    if (!hotelId) return rooms;
    return rooms.filter(r => r.hotelId === hotelId)
      .sort((a, b) => (a.number || '').localeCompare(b.number || ''));
  },

  // Legacy method for backward compatibility
  async list(hotelId) {
    return this.getAll(hotelId);
  },

  async getById(id, hotelId = null) {
    const rooms = readAll();
    const room = rooms.find(r => r._id === id);
    if (room && hotelId && room.hotelId !== hotelId) return null;
    return room;
  },

  async getByNumber(number, hotelId) {
    const rooms = readAll();
    return rooms.find(r => r.number === number && r.hotelId === hotelId);
  },

  async getByFloor(floorId, hotelId) {
    const rooms = readAll();
    return rooms.filter(r => r.floorId === floorId && r.hotelId === hotelId)
      .sort((a, b) => (a.number || '').localeCompare(b.number || ''));
  },

  async getByStatus(status, hotelId) {
    const rooms = readAll();
    return rooms.filter(r => r.status === status && r.hotelId === hotelId);
  },

  async getAvailable(hotelId, checkInDate, checkOutDate) {
    const rooms = await this.getAll(hotelId);
    
    // If no dates provided, return all bookable rooms
    if (!checkInDate || !checkOutDate) {
      return rooms.filter(room => {
        const roomModel = new Room(room);
        return roomModel.isAvailableForBooking();
      });
    }
    
    // Import bookingsRepo to check overlaps
    const { bookingsRepo } = await import('./bookingsRepo.js');
    
    // Filter rooms that are:
    // 1. In bookable status (AVAILABLE, CLEAN, RESERVED)
    // 2. Don't have overlapping bookings for the requested dates
    const availableRooms = [];
    
    for (const room of rooms) {
      const roomModel = new Room(room);
      
      // First check if room is in bookable status
      if (!roomModel.isAvailableForBooking()) {
        continue;
      }
      
      // Then check for date conflicts
      const overlapCheck = await bookingsRepo.checkOverlap(room._id, checkInDate, checkOutDate);
      
      if (!overlapCheck.hasConflict) {
        availableRooms.push(room);
      }
    }
    
    return availableRooms;
  },

  async create(data) {
    const rooms = readAll();
    
    // Check for duplicate room number in same hotel
    const existing = rooms.find(r => 
      r.number === data.number && r.hotelId === data.hotelId
    );
    if (existing) {
      throw new Error(`Room number ${data.number} already exists in this hotel`);
    }

    const now = new Date().toISOString();
    const room = {
      _id: uuidv4(),
      hotelId: data.hotelId,
      floorId: data.floorId || null,
      number: String(data.number || '').trim(),
      name: data.name || String(data.number || '').trim(),
      
      // Support both old 'type' (string) and new 'roomTypeId'/'typeId' (UUID)
      // If 'type' is provided as a string name, store it in both fields for backward compatibility
      roomTypeId: data.roomTypeId || data.typeId || null,
      type: data.type || null, // Legacy field for backward compatibility
      
      status: data.status || ROOM_STATUS.AVAILABLE,
      housekeepingStatus: data.housekeepingStatus || 'CLEAN',
      maxOccupancy: Number(data.maxOccupancy || 2),
      
      // Support both old 'rate' and new 'baseRate'
      baseRate: Number(data.baseRate || data.rate || 0),
      rate: Number(data.rate || data.baseRate || 0), // Legacy field
      
      description: data.description || '',
      amenities: data.amenities || [],
      features: data.features || data.amenities || [], // Legacy field
      floor: data.floor || null, // Legacy string floor field
      blockedUntil: data.blockedUntil || null,
      blockReason: data.blockReason || '',
      isBlocked: data.isBlocked || false, // Legacy field
      housekeepingNotes: data.housekeepingNotes || data.notes || '',
      notes: data.notes || data.housekeepingNotes || '', // Legacy field
      history: data.history || [],
      createdAt: now,
      updatedAt: now,
    };

    // Validate: require either roomTypeId or type (legacy)
    if (!room.roomTypeId && !room.type) {
      throw new Error('Room type is required (roomTypeId or type field)');
    }
    if (!room.number || room.number.trim() === '') {
      throw new Error('Room number is required');
    }
    if (!room.hotelId) {
      throw new Error('Hotel ID is required');
    }

    rooms.push(room);
    saveAll(rooms);
    return room;
  },

  async createMultiple(roomsData, hotelId) {
    const createdRooms = [];
    for (const roomData of roomsData) {
      const room = await this.create({ ...roomData, hotelId });
      createdRooms.push(room);
    }
    return createdRooms;
  },

  async update(id, data, hotelId = null) {
    const rooms = readAll();
    const idx = rooms.findIndex(r => r._id === id);
    if (idx === -1) return null;
    
    // Verify hotel ownership
    if (hotelId && rooms[idx].hotelId !== hotelId) return null;

    const oldStatus = rooms[idx].status;
    const now = new Date().toISOString();
    const updated = {
      ...rooms[idx],
      ...data,
      hotelId: rooms[idx].hotelId, // Prevent changing hotel
      _id: rooms[idx]._id, // Prevent changing ID
      updatedAt: now
    };

    rooms[idx] = updated;
    saveAll(rooms);
    
    // AUTO-SYNC: Create housekeeping task when room needs attention
    const newStatus = updated.status;
    
    // If room changed to DIRTY, create cleaning task
    if (oldStatus !== ROOM_STATUS.DIRTY && newStatus === ROOM_STATUS.DIRTY) {
      const { housekeepingRepo } = await import('./housekeepingRepo.js');
      await housekeepingRepo.createFromRoomStatus(
        updated._id,
        updated.number,
        updated.hotelId,
        'CLEANING',
        'Room needs cleaning'
      );
    }
    
    // If room changed to MAINTENANCE, create maintenance task
    if (oldStatus !== ROOM_STATUS.MAINTENANCE && newStatus === ROOM_STATUS.MAINTENANCE) {
      const { housekeepingRepo } = await import('./housekeepingRepo.js');
      await housekeepingRepo.createFromRoomStatus(
        updated._id,
        updated.number,
        updated.hotelId,
        'MAINTENANCE',
        data.blockReason || 'Room under maintenance - needs inspection after completion'
      );
    }
    
    return updated;
  },

  async remove(id, hotelId = null) {
    const rooms = readAll();
    const idx = rooms.findIndex(r => r._id === id);
    if (idx === -1) return null;
    
    // Verify hotel ownership
    if (hotelId && rooms[idx].hotelId !== hotelId) return null;

    const [removed] = rooms.splice(idx, 1);
    saveAll(rooms);
    return removed;
  },

  async setStatus(id, newStatus, hotelId = null) {
    const room = await this.getById(id, hotelId);
    if (!room) return null;

    // Validate status transition
    const roomModel = new Room(room);
    if (!roomModel.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${room.status} to ${newStatus}. ` +
        `Allowed transitions: ${ROOM_STATUS_TRANSITIONS[room.status]?.join(', ') || 'none'}`
      );
    }

    return this.update(id, { status: newStatus }, hotelId);
  },

  async blockRoom(id, blockedUntil, reason, hotelId = null) {
    return this.update(id, {
      status: ROOM_STATUS.BLOCKED,
      blockedUntil,
      blockReason: reason
    }, hotelId);
  },

  async unblockRoom(id, hotelId = null) {
    return this.update(id, {
      status: ROOM_STATUS.AVAILABLE,
      blockedUntil: null,
      blockReason: ''
    }, hotelId);
  },

  // Get rooms that need housekeeping
  async getNeedingHousekeeping(hotelId) {
    return this.getByStatus(ROOM_STATUS.DIRTY, hotelId);
  },

  // Bulk status update
  async updateBulkStatus(roomIds, newStatus, hotelId) {
    const updates = [];
    for (const id of roomIds) {
      const updated = await this.setStatus(id, newStatus, hotelId);
      if (updated) updates.push(updated);
    }
    return updates;
  }

  // REMOVED: addHistory(), getHistory(), clearOldHistory() methods
  // Industry standard: No separate room.history array
  // Checkout history is queried from bookings table (status='CheckedOut')
  // This follows best practices from Opera PMS, Maestro, Cloudbeds, Hotelogix, Airbnb
  // Benefits: Single source of truth, no sync issues, simpler codebase
};
