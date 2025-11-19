import { v4 as uuidv4 } from 'uuid';
import supabase, { mapRoomFromDB } from '../config/supabase.js';
import { Room, ROOM_STATUS, ROOM_STATUS_TRANSITIONS } from '../models/Room.js';

console.log('🚀 LOADING SUPABASE ROOMSREPO - NOT JSON VERSION!');

// hotelId is actually the tenant_id from req.user.hotelId
function getTenantId(hotelId) {
  return hotelId; // Already is tenant_id
}

export const roomsRepo = {
  // Get all rooms for a hotel
  async getAll(hotelId) {
    const tenantId = getTenantId(hotelId);
    console.log('🔍 RoomsRepo.getAll - hotelId:', hotelId, 'tenantId:', tenantId);
    if (!tenantId) return [];
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('room_number');
    
    console.log('📦 Supabase response - data:', data?.length, 'error:', error?.message);
    if (error) throw error;
    return (data || []).map(mapRoomFromDB);
  },

  // Legacy method for backward compatibility
  async list(hotelId) {
    return this.getAll(hotelId);
  },

  async getById(id, hotelId = null) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    if (hotelId) {
      const tenantId = getTenantId(hotelId);
      if (data.tenant_id !== tenantId) return null;
    }
    return mapRoomFromDB(data);
  },

  async getByNumber(number, hotelId) {
    const tenantId = getTenantId(hotelId);
    if (!tenantId) return null;
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('room_number', String(number))
      .single();
    
    if (error) return null;
    return mapRoomFromDB(data);
  },

  async getByFloor(floorId, hotelId) {
    const tenantId = getTenantId(hotelId);
    if (!tenantId) return [];
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('floor', floorId)
      .order('room_number');
    
    if (error) throw error;
    return (data || []).map(mapRoomFromDB);
  },

  async getByStatus(status, hotelId) {
    const tenantId = getTenantId(hotelId);
    if (!tenantId) return [];
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', status);
    
    if (error) throw error;
    return (data || []).map(mapRoomFromDB);
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
    const tenantId = getTenantId(data.hotelId);
    if (!tenantId) throw new Error('Hotel ID is required');
    
    // Check for duplicate room number in same hotel
    const existing = await this.getByNumber(data.number, data.hotelId);
    if (existing) {
      throw new Error(`Room number ${data.number} already exists in this hotel`);
    }

    const roomData = {
      id: uuidv4(),
      tenant_id: tenantId,
      room_number: String(data.number || '').trim(),
      type: data.roomTypeId || data.typeId || data.type || null,
      status: data.status || ROOM_STATUS.AVAILABLE,
      housekeeping_status: data.housekeepingStatus || 'CLEAN',
      rate: Number(data.baseRate || data.rate || 0),
      floor: data.floor || null,
      amenities: data.amenities || [],
      notes: data.housekeepingNotes || data.notes || ''
    };

    // Validate
    if (!roomData.room_number || roomData.room_number.trim() === '') {
      throw new Error('Room number is required');
    }

    const { data: created, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (error) throw error;
    return mapRoomFromDB(created);
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
    // Get existing room
    const room = await this.getById(id, hotelId);
    if (!room) return null;

    const oldStatus = room.status;
    
    const updateData = {
      room_number: data.number !== undefined ? String(data.number) : undefined,
      type: data.roomTypeId || data.typeId || data.type || undefined,
      status: data.status,
      housekeeping_status: data.housekeepingStatus,
      rate: data.baseRate !== undefined ? Number(data.baseRate) : data.rate !== undefined ? Number(data.rate) : undefined,
      floor: data.floor,
      amenities: data.amenities,
      notes: data.housekeepingNotes || data.notes
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const { data: updated, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    const mappedRoom = mapRoomFromDB(updated);
    
    // AUTO-SYNC: Create housekeeping task when room needs attention
    const newStatus = mappedRoom.status;
    
    // If room changed to DIRTY, create cleaning task
    if (oldStatus !== ROOM_STATUS.DIRTY && newStatus === ROOM_STATUS.DIRTY) {
      const { housekeepingRepo } = await import('./housekeepingRepo.js');
      await housekeepingRepo.createFromRoomStatus(
        mappedRoom._id,
        mappedRoom.number,
        hotelId,
        'CLEANING',
        'Room needs cleaning'
      );
    }
    
    // If room changed to MAINTENANCE, create maintenance task
    if (oldStatus !== ROOM_STATUS.MAINTENANCE && newStatus === ROOM_STATUS.MAINTENANCE) {
      const { housekeepingRepo } = await import('./housekeepingRepo.js');
      await housekeepingRepo.createFromRoomStatus(
        mappedRoom._id,
        mappedRoom.number,
        hotelId,
        'MAINTENANCE',
        data.blockReason || 'Room under maintenance - needs inspection after completion'
      );
    }
    
    return mappedRoom;
  },

  async remove(id, hotelId = null) {
    const room = await this.getById(id, hotelId);
    if (!room) return null;

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return room;
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
};
