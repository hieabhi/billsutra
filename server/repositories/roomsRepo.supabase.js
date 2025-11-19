/**
 * Rooms Repository - Supabase Version
 * Handles all room operations with PostgreSQL
 */

import supabase, { setTenantContext } from '../config/supabase.js';
import { ROOM_STATUS } from '../models/Room.js';

export const roomsRepo = {
  /**
   * Get all rooms for a hotel/tenant
   */
  async getAll(hotelId) {
    if (!hotelId) return [];
    
    await setTenantContext(hotelId);
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', hotelId)
      .order('room_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
    
    // Map Supabase columns to app format
    return (data || []).map(room => ({
      _id: room.id,
      hotelId: room.tenant_id,
      number: room.room_number,
      type: room.type,
      status: room.status,
      housekeepingStatus: room.housekeeping_status,
      rate: room.rate,
      floor: room.floor,
      amenities: room.amenities || [],
      notes: room.notes,
      createdAt: room.created_at,
      updatedAt: room.updated_at
    }));
  },

  /**
   * Legacy alias
   */
  async list(hotelId) {
    return this.getAll(hotelId);
  },

  /**
   * Get room by ID
   */
  async getById(id, hotelId = null) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    if (hotelId && data.tenant_id !== hotelId) return null;
    
    return {
      _id: data.id,
      hotelId: data.tenant_id,
      number: data.room_number,
      type: data.type,
      status: data.status,
      housekeepingStatus: data.housekeeping_status,
      rate: data.rate,
      floor: data.floor,
      amenities: data.amenities || [],
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  /**
   * Get room by number
   */
  async getByNumber(number, hotelId) {
    await setTenantContext(hotelId);
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', hotelId)
      .eq('room_number', number)
      .single();
    
    if (error || !data) return null;
    
    return {
      _id: data.id,
      hotelId: data.tenant_id,
      number: data.room_number,
      type: data.type,
      status: data.status,
      housekeepingStatus: data.housekeeping_status,
      rate: data.rate
    };
  },

  /**
   * Get rooms by status
   */
  async getByStatus(status, hotelId) {
    await setTenantContext(hotelId);
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', hotelId)
      .eq('status', status);
    
    if (error) return [];
    
    return (data || []).map(room => ({
      _id: room.id,
      hotelId: room.tenant_id,
      number: room.room_number,
      type: room.type,
      status: room.status,
      housekeepingStatus: room.housekeeping_status,
      rate: room.rate
    }));
  },

  /**
   * Get available rooms for date range
   */
  async getAvailable(hotelId, checkInDate, checkOutDate) {
    await setTenantContext(hotelId);
    
    // Get all rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', hotelId)
      .eq('status', ROOM_STATUS.AVAILABLE);
    
    if (roomsError || !rooms) return [];
    
    // If no dates, return all available rooms
    if (!checkInDate || !checkOutDate) {
      return rooms.map(r => ({
        _id: r.id,
        number: r.room_number,
        type: r.type,
        status: r.status,
        rate: r.rate
      }));
    }
    
    // Get overlapping bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('room_id')
      .eq('tenant_id', hotelId)
      .or(`check_in.lte.${checkOutDate},check_out.gte.${checkInDate}`)
      .in('status', ['Reserved', 'CheckedIn']);
    
    const bookedRoomIds = new Set((bookings || []).map(b => b.room_id));
    
    return rooms
      .filter(r => !bookedRoomIds.has(r.id))
      .map(r => ({
        _id: r.id,
        number: r.room_number,
        type: r.type,
        status: r.status,
        rate: r.rate
      }));
  },

  /**
   * Update room status
   */
  async updateStatus(id, status, hotelId) {
    await setTenantContext(hotelId);
    
    const { data, error } = await supabase
      .from('rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', hotelId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating room status:', error);
      return null;
    }
    
    return {
      _id: data.id,
      status: data.status,
      updatedAt: data.updated_at
    };
  },

  /**
   * Update housekeeping status
   */
  async updateHousekeepingStatus(id, housekeepingStatus, hotelId) {
    await setTenantContext(hotelId);
    
    const { data, error } = await supabase
      .from('rooms')
      .update({ 
        housekeeping_status: housekeepingStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('tenant_id', hotelId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating housekeeping status:', error);
      return null;
    }
    
    return {
      _id: data.id,
      housekeepingStatus: data.housekeeping_status,
      updatedAt: data.updated_at
    };
  },

  /**
   * Create new room
   */
  async create(roomData, hotelId) {
    await setTenantContext(hotelId);
    
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        tenant_id: hotelId,
        room_number: roomData.number,
        type: roomData.type,
        status: roomData.status || ROOM_STATUS.AVAILABLE,
        housekeeping_status: roomData.housekeepingStatus || 'CLEAN',
        rate: roomData.rate || 0,
        floor: roomData.floor || null,
        amenities: roomData.amenities || [],
        notes: roomData.notes || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating room:', error);
      throw error;
    }
    
    return {
      _id: data.id,
      hotelId: data.tenant_id,
      number: data.room_number,
      type: data.type,
      status: data.status,
      rate: data.rate
    };
  },

  /**
   * Update room
   */
  async update(id, updates, hotelId) {
    await setTenantContext(hotelId);
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.number) updateData.room_number = updates.number;
    if (updates.type) updateData.type = updates.type;
    if (updates.status) updateData.status = updates.status;
    if (updates.rate !== undefined) updateData.rate = updates.rate;
    if (updates.floor !== undefined) updateData.floor = updates.floor;
    if (updates.amenities) updateData.amenities = updates.amenities;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.housekeepingStatus) updateData.housekeeping_status = updates.housekeepingStatus;
    
    const { data, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', hotelId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating room:', error);
      throw error;
    }
    
    return {
      _id: data.id,
      hotelId: data.tenant_id,
      number: data.room_number,
      type: data.type,
      status: data.status,
      rate: data.rate,
      updatedAt: data.updated_at
    };
  },

  /**
   * Delete room
   */
  async delete(id, hotelId) {
    await setTenantContext(hotelId);
    
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      .eq('tenant_id', hotelId);
    
    if (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
    
    return true;
  }
};
