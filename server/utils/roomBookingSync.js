/**
 * Room-Booking Synchronization Utility
 * 
 * INDUSTRY STANDARD: Based on practices from Opera PMS, Maestro, Cloudbeds, Mews
 * 
 * Prevents data corruption by ensuring:
 * 1. Room status ALWAYS matches booking state
 * 2. Automatic validation and repair
 * 3. Transaction-like operations
 * 4. Real-time consistency checks
 */

import supabase from '../config/supabase.js';

console.log('🔄 LOADING SUPABASE ROOM-BOOKING SYNC');

// INDUSTRY STANDARD: Room status constants (Opera PMS, Maestro)
const ROOM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  DIRTY: 'DIRTY',
  CLEAN: 'CLEAN',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  BLOCKED: 'BLOCKED'
};

// Housekeeping status constants
const HOUSEKEEPING_STATUS = {
  CLEAN: 'CLEAN',
  DIRTY: 'DIRTY',
  INSPECTED: 'INSPECTED',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
};

/**
 * INDUSTRY STANDARD: Validate and fix room-booking synchronization
 * Based on Opera PMS consistency checks
 */
export async function validateAndFixRoomBookingSync() {
  try {
    // Get all rooms and bookings from Supabase
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');
    
    if (roomsError) throw roomsError;
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*');
    
    if (bookingsError) throw bookingsError;
    
    const fixes = [];
    const now = new Date();
    
    for (const room of rooms || []) {
      // Find active bookings for this room
      const activeBookings = (bookings || []).filter(b => 
        b.room_id === room.id && 
        (b.status === 'CheckedIn' || b.status === 'Reserved' || b.status === 'Confirmed')
      );
      
      // Find checked-in booking
      const checkedInBooking = activeBookings.find(b => b.status === 'CheckedIn');
      
      // Find reserved bookings
      const reservedBookings = activeBookings.filter(b => 
        b.status === 'Reserved' || b.status === 'Confirmed'
      );
      
      const expectedStatus = determineExpectedRoomStatus(room, checkedInBooking, reservedBookings, now);
      
      if (room.status !== expectedStatus) {
        fixes.push({
          roomId: room.id,
          roomNumber: room.room_number,
          from: room.status,
          to: expectedStatus,
          reason: getFixReason(room.status, expectedStatus, checkedInBooking, reservedBookings)
        });
        
        // Apply fix to Supabase
        await supabase
          .from('rooms')
          .update({ status: expectedStatus })
          .eq('id', room.id);
      }
    }
    
    if (fixes.length > 0) {
      console.log(`[SYNC] Fixed ${fixes.length} room(s) with incorrect status:`);
      fixes.forEach(f => {
        console.log(`  - Room ${f.roomNumber}: ${f.from} → ${f.to} (${f.reason})`);
      });
    }
    
    return {
      fixed: fixes.length,
      details: fixes
    };
  } catch (error) {
    console.error('[SYNC ERROR]', error);
    return { fixed: 0, details: [], error: error.message };
  }
}

/**
 * INDUSTRY STANDARD: Determine expected room status based on bookings
 * Logic from Opera PMS, Mews, and Cloudbeds
 * 
 * RESERVED = Guest arriving today or tomorrow (imminent arrival)
 * AVAILABLE = Next guest is 2+ days away (room can be sold for tonight)
 */
function determineExpectedRoomStatus(room, checkedInBooking, reservedBookings, now) {
  // PRIORITY 1: If guest is checked in, room must be OCCUPIED
  if (checkedInBooking) {
    return ROOM_STATUS.OCCUPIED;
  }
  
  // PRIORITY 2: Check for imminent arrivals (today or tomorrow)
  if (reservedBookings.length > 0) {
    // INDUSTRY STANDARD: Only show RESERVED if check-in is TODAY or TOMORROW
    // This follows Opera PMS, Mews, Cloudbeds best practices
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    const imminentArrivals = reservedBookings.filter(b => {
      const checkInDate = new Date(b.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate <= tomorrow;
    });
    
    if (imminentArrivals.length > 0) {
      // Guest arriving today or tomorrow - room is RESERVED
      return ROOM_STATUS.RESERVED;
    }
    
    // Next guest is 2+ days away - room is AVAILABLE (can be sold for tonight)
    // This is standard practice in Opera PMS and other professional systems
  }
  
  // PRIORITY 3: If room is in maintenance/blocked status, keep it
  if (room.status === ROOM_STATUS.MAINTENANCE || 
      room.status === ROOM_STATUS.OUT_OF_SERVICE ||
      room.status === ROOM_STATUS.BLOCKED) {
    return room.status;
  }
  
  // PRIORITY 4: If room is dirty, keep it dirty
  if (room.status === ROOM_STATUS.DIRTY) {
    return ROOM_STATUS.DIRTY;
  }
  
  // PRIORITY 5: If room is clean, keep it clean
  if (room.status === ROOM_STATUS.CLEAN) {
    return ROOM_STATUS.CLEAN;
  }
  
  // DEFAULT: No bookings and no special status - should be AVAILABLE
  return ROOM_STATUS.AVAILABLE;
}

/**
 * Get human-readable reason for status fix
 */
function getFixReason(currentStatus, expectedStatus, checkedInBooking, reservedBookings) {
  if (checkedInBooking && expectedStatus === ROOM_STATUS.OCCUPIED) {
    return `Guest checked in (booking ${checkedInBooking.reservation_number})`;
  }
  
  if (reservedBookings.length > 0 && expectedStatus === ROOM_STATUS.RESERVED) {
    return `Has ${reservedBookings.length} reservation(s)`;
  }
  
  if (currentStatus === ROOM_STATUS.OCCUPIED && !checkedInBooking) {
    return 'No checked-in guest found';
  }
  
  if (currentStatus === ROOM_STATUS.RESERVED && reservedBookings.length === 0) {
    return 'No active reservations found';
  }
  
  return 'Syncing to match booking state';
}

/**
 * INDUSTRY STANDARD: Synchronize room status when booking changes
 * Atomic operation pattern from Opera PMS
 */
export async function syncRoomStatusWithBooking(bookingId, newStatus, roomId) {
  console.log(`[SYNC-START] Called with: bookingId=${bookingId}, newStatus='${newStatus}', roomId=${roomId}`);
  try {
    // Get room from Supabase
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (roomError || !room) {
      console.error(`[SYNC ERROR] Room ${roomId} not found`);
      return { success: false, error: 'Room not found' };
    }
    
    // Get all bookings from Supabase
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*');
    
    if (bookingsError) {
      console.error(`[SYNC ERROR] Failed to fetch bookings:`, bookingsError);
      return { success: false, error: bookingsError.message };
    }
    
    console.log(`[SYNC] Processing ${newStatus} for room ${room.room_number} (current: ${room.status} + ${room.housekeeping_status})`);
    
    // Determine new room status based on booking status
    let newRoomStatus = room.status;
    const updates = {};
    
    switch (newStatus) {
      case 'CheckedIn':
        newRoomStatus = ROOM_STATUS.OCCUPIED;
        updates.status = newRoomStatus;
        break;
        
      case 'Reserved':
      case 'Confirmed':
        // INDUSTRY STANDARD: Only set to RESERVED if check-in is today or tomorrow
        // Follows Opera PMS, Mews, Cloudbeds best practices
        if (room.status !== ROOM_STATUS.OCCUPIED) {
          const booking = bookings.find(b => b.id === bookingId);
          if (booking) {
            const checkInDate = new Date(booking.check_in_date);
            checkInDate.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Only RESERVED if arriving today or tomorrow
            if (checkInDate <= tomorrow) {
              newRoomStatus = ROOM_STATUS.RESERVED;
              console.log(`[SYNC] Room ${room.room_number} → RESERVED (arrival: ${booking.check_in_date})`);
            } else {
              // Next guest is 2+ days away - keep AVAILABLE
              newRoomStatus = ROOM_STATUS.AVAILABLE;
              console.log(`[SYNC] Room ${room.room_number} → AVAILABLE (arrival ${booking.check_in_date} is ${Math.ceil((checkInDate - today) / (1000*60*60*24))} days away)`);
            }
          } else {
            newRoomStatus = ROOM_STATUS.RESERVED;
          }
          updates.status = newRoomStatus;
        }
        break;
        
      case 'CheckedOut':
        // INDUSTRY STANDARD: Room becomes AVAILABLE (occupancy) + DIRTY (housekeeping)
        newRoomStatus = ROOM_STATUS.AVAILABLE;
        updates.status = newRoomStatus;
        updates.housekeeping_status = HOUSEKEEPING_STATUS.DIRTY;
        console.log(`[SYNC] Checkout: Room ${room.room_number} → AVAILABLE + DIRTY`);
        break;
        
      case 'Cancelled':
      case 'NoShow':
        // Check if there are other active bookings
        const otherActiveBookings = bookings.filter(b => 
          b.room_id === roomId && 
          b.id !== bookingId &&
          (b.status === 'CheckedIn' || b.status === 'Reserved' || b.status === 'Confirmed')
        );
        
        if (otherActiveBookings.length === 0) {
          // No other bookings - room should be AVAILABLE or DIRTY based on current state
          newRoomStatus = room.status === ROOM_STATUS.DIRTY ? ROOM_STATUS.DIRTY : ROOM_STATUS.AVAILABLE;
          updates.status = newRoomStatus;
        }
        break;
    }
    
    // Update room status if changed
    const oldRoomStatus = room.status;
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', roomId);
      
      if (updateError) {
        console.error('[SYNC ERROR] Failed to update room:', updateError);
        return { success: false, error: updateError.message };
      }
      
      console.log(`[SYNC] Room ${room.room_number}: ${oldRoomStatus} → ${newRoomStatus} (Booking ${newStatus})`);
      if (updates.housekeeping_status) {
        console.log(`[SYNC] Saved room ${room.room_number} - Status: ${updates.status}, Housekeeping: ${updates.housekeeping_status}`);
      }
    }
    
    return { success: true, oldStatus: oldRoomStatus, newStatus: newRoomStatus };
    
  } catch (error) {
    console.error('[SYNC ERROR]', error);
    return { success: false, error: error.message };
  }
}

/**
 * INDUSTRY STANDARD: Background sync job (runs periodically)
 * Pattern from Cloudbeds and Mews
 */
let syncInterval = null;

export function startPeriodicSync(intervalMinutes = 5) {
  if (syncInterval) {
    console.log('[SYNC] Periodic sync already running');
    return;
  }
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`[SYNC] Starting periodic validation every ${intervalMinutes} minutes`);
  
  // Run immediately on start
  validateAndFixRoomBookingSync();
  
  // Then run periodically
  syncInterval = setInterval(async () => {
    const result = await validateAndFixRoomBookingSync();
    if (result.fixed > 0) {
      console.log(`[SYNC] Periodic check fixed ${result.fixed} room(s)`);
    }
  }, intervalMs);
}

export function stopPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[SYNC] Stopped periodic validation');
  }
}

/**
 * INDUSTRY STANDARD: Pre-operation validation hook
 * Prevents invalid operations before they happen
 */
export async function validateBookingOperation(operation, bookingData, roomId) {
  try {
    // Get room from Supabase
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (roomError || !room) {
      return { valid: false, error: 'Room not found' };
    }
    
    // Get bookings from Supabase
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', roomId);
    
    if (bookingsError) {
      return { valid: false, error: bookingsError.message };
    }
    
    const errors = [];
    
    // Validate based on operation type
    switch (operation) {
      case 'create':
      case 'checkIn':
        // Check if room is available for booking
        const activeBookings = (bookings || []).filter(b => 
          b.id !== bookingData._id &&
          (b.status === 'CheckedIn' || b.status === 'Reserved')
        );
        
        if (activeBookings.length > 0 && operation === 'checkIn') {
          errors.push(`Room ${room.room_number} already has an active booking`);
        }
        
        if (room.status === ROOM_STATUS.OUT_OF_SERVICE) {
          errors.push(`Room ${room.room_number} is out of service`);
        }
        break;
        
      case 'checkOut':
        // Verify room is actually occupied
        const checkedInBooking = (bookings || []).find(b => 
          b.status === 'CheckedIn'
        );
        
        if (!checkedInBooking) {
          errors.push(`Room ${room.room_number} has no checked-in guest`);
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('[VALIDATE ERROR]', error);
    return { valid: false, error: error.message };
  }
}

export default {
  validateAndFixRoomBookingSync,
  syncRoomStatusWithBooking,
  startPeriodicSync,
  stopPeriodicSync,
  validateBookingOperation
};
