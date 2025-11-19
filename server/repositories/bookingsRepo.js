import { v4 as uuidv4 } from 'uuid';
import supabase, { mapBookingFromDBComplete, mapBookingToDB } from '../config/supabase.js';
import { syncRoomStatusWithBooking, validateBookingOperation } from '../utils/roomBookingSync.js';

console.log('🚀 LOADING SUPABASE BOOKINGSREPO');

function getTenantId(hotelId) {
  return hotelId;
}

function computeNights(checkInDate, checkOutDate) {
  const inD = new Date(checkInDate);
  const outD = new Date(checkOutDate);
  const ms = outD - inD;
  return Math.max(1, Math.ceil(ms/(1000*60*60*24)));
}

export const bookingsRepo = {
  async list(query = {}) {
    try {
      const tenantId = getTenantId(query.hotelId);
      
      if (!tenantId) {
        console.error('[ERROR] Bookings list: No tenantId provided');
        return [];
      }
      
      let supaQuery = supabase
        .from('bookings')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (query.status) supaQuery = supaQuery.eq('status', query.status);
      if (query.roomId) supaQuery = supaQuery.eq('room_id', query.roomId);
      if (query.date) {
        const d = new Date(query.date);
        supaQuery = supaQuery
          .lte('check_in_date', d.toISOString())
          .gte('check_out_date', d.toISOString());
      }
      
      supaQuery = supaQuery.order('created_at', { ascending: false });
      
      const { data, error } = await supaQuery;
      if (error) throw error;
      
      return (data || []).map(mapBookingFromDBComplete);
    } catch (error) {
      console.error('[ERROR] Bookings list:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return mapBookingFromDBComplete(data);
    } catch (error) {
      console.error('[ERROR] Get booking by ID:', error);
      return null;
    }
  },

  async checkOverlap(roomId, checkInDate, checkOutDate, excludeBookingId = null) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .neq('status', 'Cancelled')
        .neq('status', 'CheckedOut');
      
      if (error) throw error;
      
      const newIn = new Date(checkInDate);
      const newOut = new Date(checkOutDate);
      
      const overlapping = data.filter(b => {
        if (b.id === excludeBookingId) return false;
        
        const existingIn = new Date(b.check_in_date);
        const existingOut = new Date(b.check_out_date);
        
        return (newIn < existingOut && newOut > existingIn);
      });
      
      return {
        hasConflict: overlapping.length > 0,
        conflictingBooking: overlapping[0] ? mapBookingFromDBComplete(overlapping[0]) : null
      };
    } catch (error) {
      console.error('[ERROR] Check overlap:', error);
      return { hasConflict: false, conflictingBooking: null };
    }
  },

  async create(bookingData) {
    try {
      const tenantId = getTenantId(bookingData.hotelId);
      const newId = uuidv4();
      const now = new Date().toISOString();
      
      // Validate booking
      await validateBookingOperation(bookingData.roomId, bookingData.status, bookingData.checkInDate, bookingData.checkOutDate);
      
      const booking = {
        id: newId,
        tenant_id: tenantId,
        room_id: bookingData.roomId,
        guest_id: bookingData.guestId || null,
        check_in_date: bookingData.checkInDate,
        check_out_date: bookingData.checkOutDate,
        status: bookingData.status || 'Reserved',
        adults: bookingData.adults || 1,
        children: bookingData.children || 0,
        total_amount: bookingData.totalAmount || 0,
        paid_amount: bookingData.paidAmount || 0,
        notes: bookingData.notes || (bookingData.guestName ? `Guest: ${bookingData.guestName}` : ''),
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();
      
      if (error) throw error;
      
      // Sync room status
      await syncRoomStatusWithBooking(bookingData.roomId, bookingData.status);
      
      return mapBookingFromDBComplete(data);
    } catch (error) {
      console.error('[ERROR] Create booking:', error);
      throw error;
    }
  },

  async update(id, updates) {
    try {
      const tenantId = getTenantId(updates.hotelId);
      const now = new Date().toISOString();
      
      // Validate if status is changing
      if (updates.status && updates.roomId) {
        await validateBookingOperation(updates.roomId, updates.status, updates.checkInDate, updates.checkOutDate);
      }
      
      const updateData = {
        updated_at: now
      };
      
      if (updates.roomId) updateData.room_id = updates.roomId;
      if (updates.guestId) updateData.guest_id = updates.guestId;
      if (updates.checkInDate) updateData.check_in_date = updates.checkInDate;
      if (updates.checkOutDate) updateData.check_out_date = updates.checkOutDate;
      if (updates.status) updateData.status = updates.status;
      if (updates.adults !== undefined) updateData.adults = updates.adults;
      if (updates.children !== undefined) updateData.children = updates.children;
      if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
      if (updates.paidAmount !== undefined) updateData.paid_amount = updates.paidAmount;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.guestName) updateData.notes = `Guest: ${updates.guestName}`;
      
      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Sync room status if status changed
      if (updates.status && updates.roomId) {
        await syncRoomStatusWithBooking(updates.roomId, updates.status);
      }
      
      return mapBookingFromDBComplete(data);
    } catch (error) {
      console.error('[ERROR] Update booking:', error);
      throw error;
    }
  },

  async remove(id, hotelId) {
    try {
      const tenantId = getTenantId(hotelId);
      
      // Get booking first to sync room status
      const booking = await this.getById(id);
      
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      // Update room status if booking was active
      if (booking && booking.roomId && booking.status !== 'Cancelled') {
        await syncRoomStatusWithBooking(booking.roomId, 'Available');
      }
      
      return booking;
    } catch (error) {
      console.error('[ERROR] Delete booking:', error);
      throw error;
    }
  },

  async updateStatus(id, status, hotelId) {
    return this.update(id, { status, hotelId });
  },

  async checkIn(id, hotelId) {
    const booking = await this.getById(id);
    if (!booking) throw new Error('Booking not found');
    
    await this.update(id, { 
      status: 'CheckedIn',
      hotelId,
      roomId: booking.roomId
    });
    
    return this.getById(id);
  },

  async checkOut(id, hotelId) {
    const booking = await this.getById(id);
    if (!booking) throw new Error('Booking not found');
    
    await this.update(id, { 
      status: 'CheckedOut',
      hotelId,
      roomId: booking.roomId
    });
    
    return this.getById(id);
  },

  async cancel(id, hotelId) {
    return this.update(id, { status: 'Cancelled', hotelId });
  }
};
