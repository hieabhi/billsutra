// Room Model with Multi-Tenancy and Dual-Status System (Industry Standard)
// Like Opera PMS, Maestro, Cloudbeds, Mews - separate occupancy and housekeeping status

// Occupancy Status (WHO is in the room)
export const ROOM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
  BLOCKED: 'BLOCKED',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
};

// Housekeeping Status (CLEANLINESS state)
export const HOUSEKEEPING_STATUS = {
  CLEAN: 'CLEAN',
  DIRTY: 'DIRTY',
  IN_PROGRESS: 'IN_PROGRESS',
  INSPECTED: 'INSPECTED',
  PICKUP: 'PICKUP', // Light cleaning needed
  MAINTENANCE: 'MAINTENANCE'
};

export const ROOM_STATUS_TRANSITIONS = {
  AVAILABLE: ['RESERVED', 'BLOCKED', 'OUT_OF_SERVICE', 'OCCUPIED'],
  RESERVED: ['OCCUPIED', 'AVAILABLE', 'BLOCKED'],
  OCCUPIED: ['AVAILABLE'], // After checkout
  OUT_OF_SERVICE: ['AVAILABLE'],
  BLOCKED: ['AVAILABLE']
};

export class Room {
  constructor(data) {
    this.id = data.id || null;
    this.hotelId = data.hotelId; // Required for multi-tenancy
    this.floorId = data.floorId || null;
    this.number = data.number;
    this.name = data.name || data.number;
    this.typeId = data.typeId; // References room_types
    
    // DUAL STATUS SYSTEM (Industry Standard)
    this.status = data.status || ROOM_STATUS.AVAILABLE; // Occupancy status
    this.housekeepingStatus = data.housekeepingStatus || HOUSEKEEPING_STATUS.CLEAN; // Cleanliness status
    
    this.maxOccupancy = data.maxOccupancy || 2;
    this.baseRate = data.baseRate || 0;
    this.description = data.description || '';
    this.amenities = data.amenities || [];
    this.blockedUntil = data.blockedUntil || null;
    this.blockReason = data.blockReason || '';
    this.housekeepingNotes = data.housekeepingNotes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];
    
    if (!this.hotelId) errors.push('Hotel ID is required');
    if (!this.number || String(this.number).trim() === '') errors.push('Room number is required');
    if (!this.typeId) errors.push('Room type is required');
    if (!Object.values(ROOM_STATUS).includes(this.status)) {
      errors.push(`Invalid occupancy status. Must be one of: ${Object.values(ROOM_STATUS).join(', ')}`);
    }
    if (!Object.values(HOUSEKEEPING_STATUS).includes(this.housekeepingStatus)) {
      errors.push(`Invalid housekeeping status. Must be one of: ${Object.values(HOUSEKEEPING_STATUS).join(', ')}`);
    }
    if (this.maxOccupancy < 1) errors.push('Max occupancy must be at least 1');
    if (this.baseRate < 0) errors.push('Base rate cannot be negative');
    
    return errors;
  }

  canTransitionTo(newStatus) {
    const allowedTransitions = ROOM_STATUS_TRANSITIONS[this.status] || [];
    return allowedTransitions.includes(newStatus);
  }

  isAvailableForBooking() {
    return [ROOM_STATUS.AVAILABLE, ROOM_STATUS.CLEAN].includes(this.status);
  }

  needsHousekeeping() {
    return this.status === ROOM_STATUS.DIRTY;
  }
}
