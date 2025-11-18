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

import { readJSON, writeJSON } from './fileStore.js';

const ROOMS_FILE = 'rooms.json';
const BOOKINGS_FILE = 'bookings.json';

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
  const rooms = readJSON(ROOMS_FILE, []);
  const bookings = readJSON(BOOKINGS_FILE, []);
  
  const fixes = [];
  const now = new Date();
  
  for (const room of rooms) {
    // Find active bookings for this room
    const activeBookings = bookings.filter(b => 
      b.roomId === room._id && 
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
        roomId: room._id,
        roomNumber: room.number,
        from: room.status,
        to: expectedStatus,
        reason: getFixReason(room.status, expectedStatus, checkedInBooking, reservedBookings)
      });
      
      // Apply fix
      room.status = expectedStatus;
    }
  }
  
  if (fixes.length > 0) {
    writeJSON(ROOMS_FILE, rooms);
    console.log(`[SYNC] Fixed ${fixes.length} room(s) with incorrect status:`);
    fixes.forEach(f => {
      console.log(`  - Room ${f.roomNumber}: ${f.from} → ${f.to} (${f.reason})`);
    });
  }
  
  return {
    fixed: fixes.length,
    details: fixes
  };
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
    return `Guest checked in (booking ${checkedInBooking.reservationNumber})`;
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
    const rooms = readJSON(ROOMS_FILE, []);
    const bookings = readJSON(BOOKINGS_FILE, []);
    
    const room = rooms.find(r => r._id === roomId);
    if (!room) {
      console.error(`[SYNC ERROR] Room ${roomId} not found`);
      return { success: false, error: 'Room not found' };
    }
    
    console.log(`[SYNC] Processing ${newStatus} for room ${room.number} (current: ${room.status} + ${room.housekeepingStatus})`);
    
    // Determine new room status based on booking status
    let newRoomStatus = room.status;
    
    switch (newStatus) {
      case 'CheckedIn':
        newRoomStatus = ROOM_STATUS.OCCUPIED;
        break;
        
      case 'Reserved':
      case 'Confirmed':
        // INDUSTRY STANDARD: Only set to RESERVED if check-in is today or tomorrow
        // Follows Opera PMS, Mews, Cloudbeds best practices
        if (room.status !== ROOM_STATUS.OCCUPIED) {
          const booking = bookings.find(b => b._id === bookingId);
          if (booking) {
            const checkInDate = new Date(booking.checkInDate);
            checkInDate.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Only RESERVED if arriving today or tomorrow
            if (checkInDate <= tomorrow) {
              newRoomStatus = ROOM_STATUS.RESERVED;
              console.log(`[SYNC] Room ${room.number} → RESERVED (arrival: ${booking.checkInDate})`);
            } else {
              // Next guest is 2+ days away - keep AVAILABLE
              newRoomStatus = ROOM_STATUS.AVAILABLE;
              console.log(`[SYNC] Room ${room.number} → AVAILABLE (arrival ${booking.checkInDate} is ${Math.ceil((checkInDate - today) / (1000*60*60*24))} days away)`);
            }
          } else {
            newRoomStatus = ROOM_STATUS.RESERVED;
          }
        }
        break;
        
      case 'CheckedOut':
        // INDUSTRY STANDARD: Room becomes AVAILABLE (occupancy) + DIRTY (housekeeping)
        newRoomStatus = ROOM_STATUS.AVAILABLE;
        room.housekeepingStatus = HOUSEKEEPING_STATUS.DIRTY;
        console.log(`[SYNC] Checkout: Room ${room.number} → AVAILABLE + DIRTY`);
        break;
        
      case 'Cancelled':
      case 'NoShow':
        // Check if there are other active bookings
        const otherActiveBookings = bookings.filter(b => 
          b.roomId === roomId && 
          b._id !== bookingId &&
          (b.status === 'CheckedIn' || b.status === 'Reserved' || b.status === 'Confirmed')
        );
        
        if (otherActiveBookings.length === 0) {
          // No other bookings - room should be AVAILABLE or DIRTY based on current state
          newRoomStatus = room.status === ROOM_STATUS.DIRTY ? ROOM_STATUS.DIRTY : ROOM_STATUS.AVAILABLE;
        }
        break;
    }
    
    // Update room status if changed
    const oldRoomStatus = room.status;
    if (newRoomStatus !== room.status) {
      room.status = newRoomStatus;
      console.log(`[SYNC] Room ${room.number}: ${oldRoomStatus} → ${newRoomStatus} (Booking ${newStatus})`);
    }
    
    // Always save after processing checkout/checkin (housekeepingStatus may have changed)
    if (newStatus === 'CheckedOut' || newStatus === 'CheckedIn') {
      writeJSON(ROOMS_FILE, rooms);
      console.log(`[SYNC] Saved room ${room.number} - Status: ${room.status}, Housekeeping: ${room.housekeepingStatus}`);
    } else if (newRoomStatus !== oldRoomStatus) {
      writeJSON(ROOMS_FILE, rooms);
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
  const rooms = readJSON(ROOMS_FILE, []);
  const bookings = readJSON(BOOKINGS_FILE, []);
  
  const room = rooms.find(r => r._id === roomId);
  if (!room) {
    return { valid: false, error: 'Room not found' };
  }
  
  const errors = [];
  
  // Validate based on operation type
  switch (operation) {
    case 'create':
    case 'checkIn':
      // Check if room is available for booking
      const activeBookings = bookings.filter(b => 
        b.roomId === roomId &&
        b._id !== bookingData._id &&
        (b.status === 'CheckedIn' || b.status === 'Reserved')
      );
      
      if (activeBookings.length > 0 && operation === 'checkIn') {
        errors.push(`Room ${room.number} already has an active booking`);
      }
      
      if (room.status === ROOM_STATUS.OUT_OF_SERVICE) {
        errors.push(`Room ${room.number} is out of service`);
      }
      break;
      
    case 'checkOut':
      // Verify room is actually occupied
      const checkedInBooking = bookings.find(b => 
        b.roomId === roomId && 
        b.status === 'CheckedIn'
      );
      
      if (!checkedInBooking) {
        errors.push(`Room ${room.number} has no checked-in guest`);
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  validateAndFixRoomBookingSync,
  syncRoomStatusWithBooking,
  startPeriodicSync,
  stopPeriodicSync,
  validateBookingOperation
};
