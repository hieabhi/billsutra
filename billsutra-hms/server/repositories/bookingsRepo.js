import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { readJSON, writeJSON } from '../utils/fileStore.js';
import { billsRepo } from './billsRepo.js';
import { roomsRepo } from './roomsRepo.js';
import { roomTypesRepo } from './roomTypesRepo.js';
// INDUSTRY STANDARD: Atomic sync operations (Opera PMS, Maestro)
import { syncRoomStatusWithBooking, validateBookingOperation } from '../utils/roomBookingSync.js';

const FILE = 'bookings.json';
const FILE_META = 'bookings_meta.json';

function isMongoConnected() {
  return mongoose.connection?.readyState === 1;
}

function readAll() { return readJSON(FILE, []); }
function saveAll(data) { writeJSON(FILE, data); }
function readMeta() { return readJSON(FILE_META, { nextReservation: 1, prefix: 'RES' }); }
function saveMeta(m) { writeJSON(FILE_META, m); }
function pad(n, size = 5) { const s = String(n); return s.length >= size ? s : '0'.repeat(size - s.length) + s; }

function computeNights(checkInDate, checkOutDate) {
  const inD = new Date(checkInDate);
  const outD = new Date(checkOutDate);
  const ms = outD - inD;
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export const bookingsRepo = {
  async list(query = {}) {
    if (isMongoConnected()) {
      // Using file fallback
    }
    let data = readAll();
    if (query.status) data = data.filter(b => b.status === query.status);
    if (query.roomId) data = data.filter(b => b.roomId === query.roomId);
    if (query.date) {
      const d = new Date(query.date);
      data = data.filter(b => new Date(b.checkInDate) <= d && d <= new Date(b.checkOutDate));
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getById(id) { return readAll().find(b => b._id === id); },

  /**
   * Check if booking dates overlap with existing bookings for the same room
   * @param {string} roomId - Room ID to check
   * @param {string} checkInDate - Check-in date (ISO string)
   * @param {string} checkOutDate - Check-out date (ISO string)
   * @param {string|null} excludeBookingId - Exclude this booking ID (for updates)
   * @returns {Promise<{hasConflict: boolean, conflictingBooking: object|null}>}
   */
  async checkOverlap(roomId, checkInDate, checkOutDate, excludeBookingId = null) {
    const bookings = readAll().filter(b =>
      b.roomId === roomId &&
      b._id !== excludeBookingId &&
      // Only active bookings can cause conflicts
      b.status !== 'Cancelled' &&
      b.status !== 'CheckedOut' &&
      b.status !== 'NoShow' &&
      // Check for date overlap: (newCheckIn < existingCheckOut) AND (newCheckOut > existingCheckIn)
      new Date(checkInDate) < new Date(b.checkOutDate) &&
      new Date(checkOutDate) > new Date(b.checkInDate)
    );

    return {
      hasConflict: bookings.length > 0,
      conflictingBooking: bookings.length > 0 ? bookings[0] : null
    };
  },

  /**
   * Validate booking dates
   * @param {string} checkInDate - Check-in date
   * @param {string} checkOutDate - Check-out date
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateDates(checkInDate, checkOutDate) {
    const errors = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Check if dates are valid
    if (isNaN(checkIn.getTime())) {
      errors.push('Invalid check-in date format');
    }
    if (isNaN(checkOut.getTime())) {
      errors.push('Invalid check-out date format');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Check if check-in is before check-out
    if (checkIn >= checkOut) {
      errors.push('Check-in date must be before check-out date');
    }

    // Check if dates are not in the past (allow today)
    if (checkIn < now) {
      errors.push('Check-in date cannot be in the past');
    }

    // Check if checkout is not in the past
    if (checkOut < now) {
      errors.push('Check-out date cannot be in the past');
    }

    // Check reasonable stay duration (e.g., max 365 days)
    const daysDiff = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      errors.push('Booking duration cannot exceed 365 days');
    }

    return { valid: errors.length === 0, errors };
  },

  async create(data) {
    // VALIDATION 1: Validate guest contact information
    const contactErrors = [];
    if (!data.guest?.name || data.guest.name.trim() === '') {
      contactErrors.push('Primary guest name is required');
    }
    if (!data.guest?.phone || data.guest.phone.trim() === '') {
      contactErrors.push('Primary guest phone number is required');
    } else {
      // Basic phone validation (10 digits)
      const phoneDigits = data.guest.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        contactErrors.push('Phone number must be at least 10 digits');
      }
    }
    if (!data.guest?.email || data.guest.email.trim() === '') {
      contactErrors.push('Primary guest email is required');
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.guest.email)) {
        contactErrors.push('Invalid email format');
      }
    }
    if (contactErrors.length > 0) {
      throw new Error(`Primary guest information incomplete: ${contactErrors.join(', ')}`);
    }

    // VALIDATION 1.5: Validate guest counts and additional guests (Industry Standard)
    const guestCounts = {
      adults: Number(data.guestCounts?.adults || data.adults || 1),
      children: Number(data.guestCounts?.children || data.children || 0),
      infants: Number(data.guestCounts?.infants || data.infants || 0)
    };

    // Validate guest counts
    if (guestCounts.adults < 1) {
      throw new Error('At least 1 adult is required');
    }
    if (guestCounts.children < 0 || guestCounts.infants < 0) {
      throw new Error('Guest counts cannot be negative');
    }

    const totalGuests = guestCounts.adults + guestCounts.children;

    // Validate additional guests if provided
    const additionalGuests = data.additionalGuests || [];
    if (additionalGuests.length > 0) {
      additionalGuests.forEach((guest, index) => {
        if (!guest.name || guest.name.trim() === '') {
          throw new Error(`Additional guest ${index + 1}: Name is required`);
        }
        if (guest.age !== undefined && (guest.age < 0 || guest.age > 120)) {
          throw new Error(`Additional guest ${index + 1}: Invalid age`);
        }
      });
    }

    // VALIDATION 2: Validate dates
    const dateValidation = this.validateDates(data.checkInDate, data.checkOutDate);
    if (!dateValidation.valid) {
      throw new Error(`Invalid booking dates: ${dateValidation.errors.join(', ')}`);
    }

    // VALIDATION 3: Check for booking conflicts FIRST (overlapping dates)
    // This is more important than room status check
    if (data.roomId) {
      const overlapCheck = await this.checkOverlap(data.roomId, data.checkInDate, data.checkOutDate);
      if (overlapCheck.hasConflict) {
        const conflicting = overlapCheck.conflictingBooking;
        throw new Error(
          `Booking conflict: Room ${data.roomNumber || data.roomId} is already booked from ` +
          `${new Date(conflicting.checkInDate).toLocaleDateString()} to ${new Date(conflicting.checkOutDate).toLocaleDateString()} ` +
          `(Reservation: ${conflicting.reservationNumber})`
        );
      }
    }

    // VALIDATION 3: Check room exists
    if (data.roomId) {
      const room = await roomsRepo.getById(data.roomId);
      if (!room) {
        throw new Error(`Room not found: ${data.roomId}`);
      }

      // VALIDATION 3.5: Check room capacity (Industry Standard)
      const maxOccupancy = room.maxOccupancy || 2;
      if (totalGuests > maxOccupancy) {
        throw new Error(
          `Room ${room.number} capacity exceeded. Maximum occupancy: ${maxOccupancy}, ` +
          `Requested: ${totalGuests} guests (${guestCounts.adults} adults, ${guestCounts.children} children)`
        );
      }

      // INDUSTRY STANDARD: Dual-status validation (Opera PMS, Maestro, Cloudbeds)
      // Check both occupancy status AND housekeeping status
      const { ROOM_STATUS, HOUSEKEEPING_STATUS } = await import('../models/Room.js');

      // 1. Check occupancy status first
      if (room.status !== ROOM_STATUS.AVAILABLE) {
        throw new Error(
          `Room ${room.number} is not available for booking (current status: ${room.status}). ` +
          `Please select a different room.`
        );
      }

      // 2. Check housekeeping status (CRITICAL: dirty rooms cannot be sold)
      if (room.housekeepingStatus === HOUSEKEEPING_STATUS.DIRTY) {
        throw new Error(
          `Room ${room.number} is currently dirty and needs housekeeping before it can be reserved. ` +
          `Please select a clean room or wait for housekeeping to complete cleaning.`
        );
      }

      // 3. Additional check for other non-bookable housekeeping statuses
      const unbookableHousekeepingStatuses = [
        HOUSEKEEPING_STATUS.MAINTENANCE,
        HOUSEKEEPING_STATUS.IN_PROGRESS
      ];
      if (unbookableHousekeepingStatuses.includes(room.housekeepingStatus)) {
        throw new Error(
          `Room ${room.number} is currently under ${room.housekeepingStatus.toLowerCase().replace('_', ' ')} ` +
          `and cannot be booked at this time. Please select a different room.`
        );
      }
    }

    // VALIDATION 4: Validate guest count
    if (data.guestsCount && Number(data.guestsCount) <= 0) {
      throw new Error('Guest count must be at least 1');
    }

    const bookings = readAll();
    const meta = readMeta();
    const now = new Date().toISOString();
    const reservationNumber = `${meta.prefix}${pad(meta.nextReservation)}`;
    const nights = computeNights(data.checkInDate, data.checkOutDate);
    const amount = Number(data.rate || 0) * nights;

    // INDUSTRY STANDARD: Handle advance payment (like Opera PMS, Maestro, Mews)
    // IMPORTANT: Advance payment is stored SEPARATELY in booking.advancePayment
    // It should NOT be added to folio.payments to avoid double-counting
    const advancePayment = Number(data.advancePayment || 0);
    const advancePaymentMethod = data.advancePaymentMethod || 'Cash';
    const initialBalance = amount - advancePayment;

    // Initialize folio - payments array starts EMPTY
    // Advance payment is tracked in booking.advancePayment field
    const folioLines = [];
    const folioPayments = []; // Empty - advance is NOT duplicated here

    const booking = {
      _id: uuidv4(),
      reservationNumber,
      guest: data.guest || { name: 'Guest' },
      guestCounts: {
        adults: guestCounts.adults,
        children: guestCounts.children,
        infants: guestCounts.infants
      },
      additionalGuests: additionalGuests,
      totalGuests: totalGuests,
      roomTypeId: data.roomTypeId || '',
      roomId: data.roomId || '',
      roomNumber: data.roomNumber || '',
      rate: Number(data.rate || 0),
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      nights,
      status: data.status || 'Reserved',
      guestsCount: totalGuests, // Keep for backward compatibility
      paymentMethod: data.paymentMethod || 'Cash',
      bookingSource: data.bookingSource || 'Walk-in',
      amount,
      balance: initialBalance,
      advancePayment: advancePayment,
      advancePaymentMethod: advancePayment > 0 ? advancePaymentMethod : null,
      notes: data.notes || '',
      folio: {
        lines: folioLines,
        payments: folioPayments,
        total: amount,
        balance: initialBalance
      },
      createdAt: now,
      updatedAt: now,
    };
    bookings.push(booking);
    saveAll(bookings);
    meta.nextReservation += 1;
    saveMeta(meta);

    // INDUSTRY STANDARD: Atomic room status sync (Opera PMS pattern)
    // Ensures room status ALWAYS matches booking state
    if (booking.roomId && (booking.status === 'Reserved' || booking.status === 'Confirmed')) {
      await syncRoomStatusWithBooking(booking._id, booking.status, booking.roomId);
    }

    return booking;
  },
  async update(id, data) {
    const bookings = readAll();
    const idx = bookings.findIndex(b => b._id === id);
    if (idx === -1) return null;

    const base = { ...bookings[idx], ...data };

    // VALIDATION: If dates are being changed, validate them
    if (data.checkInDate || data.checkOutDate) {
      const dateValidation = this.validateDates(base.checkInDate, base.checkOutDate);
      if (!dateValidation.valid) {
        throw new Error(`Invalid booking dates: ${dateValidation.errors.join(', ')}`);
      }

      // Check for conflicts when updating dates
      if (base.roomId) {
        const overlapCheck = await this.checkOverlap(base.roomId, base.checkInDate, base.checkOutDate, id);
        if (overlapCheck.hasConflict) {
          const conflicting = overlapCheck.conflictingBooking;
          throw new Error(
            `Booking conflict: Room ${base.roomNumber || base.roomId} is already booked from ` +
            `${new Date(conflicting.checkInDate).toLocaleDateString()} to ${new Date(conflicting.checkOutDate).toLocaleDateString()} ` +
            `(Reservation: ${conflicting.reservationNumber})`
          );
        }
      }
    }

    base.nights = computeNights(base.checkInDate, base.checkOutDate);
    base.amount = Number(base.rate || 0) * base.nights;
    // keep folio totals consistent if balance/total provided
    if (!base.folio) base.folio = { lines: [], payments: [], total: base.amount, balance: base.amount };
    // DON'T override folio.total/balance if they're already calculated (preserves charge totals)
    if (data.folio && typeof data.folio.total === 'number') {
      base.folio.total = data.folio.total;
    } else if (!base.folio.total) {
      base.folio.total = base.amount;
    }
    if (data.folio && typeof data.folio.balance === 'number') {
      base.folio.balance = data.folio.balance;
    } else if (typeof base.balance === 'number') {
      base.folio.balance = Number(base.balance);
    }
    base.updatedAt = new Date().toISOString();
    bookings[idx] = base;
    saveAll(bookings);

    // INDUSTRY STANDARD: Atomic room status sync (Opera PMS pattern)
    // Sync room status whenever booking status changes
    if (data.status && base.roomId) {
      await syncRoomStatusWithBooking(base._id, base.status, base.roomId);
    }

    return base;
  },
  async remove(id) {
    const bookings = readAll();
    const idx = bookings.findIndex(b => b._id === id);
    if (idx === -1) return null;
    const [removed] = bookings.splice(idx, 1);
    saveAll(bookings);

    // INDUSTRY STANDARD: Atomic room status sync (Opera PMS pattern)
    // Automatically fixes room status when booking is deleted
    if (removed?.roomId) {
      await syncRoomStatusWithBooking(removed._id, 'Cancelled', removed.roomId);
    }

    return removed;
  },
  async checkIn(id) {
    let booking = await this.getById(id);
    if (!booking) throw new Error('Booking not found');

    // AUTO-ASSIGN ROOM: If no room assigned yet, find available room of the requested type
    if (!booking.roomId || booking.roomId === '') {
      const { roomsRepo } = await import('./roomsRepo.js');
      const allRooms = await roomsRepo.getAll(booking.hotelId);

      // Find available rooms of the requested room type (prefer CLEAN, but allow DIRTY)
      const availableRooms = allRooms.filter(room =>
        room.roomTypeId === booking.roomTypeId &&
        room.status === 'AVAILABLE'
      );

      if (availableRooms.length === 0) {
        throw new Error(`No available rooms of type ${booking.roomTypeId} for check-in`);
      }

      // Prefer clean rooms, but fallback to dirty rooms
      const cleanRoom = availableRooms.find(r => r.housekeepingStatus === 'CLEAN');
      const assignedRoom = cleanRoom || availableRooms[0];

      booking = await this.update(id, {
        roomId: assignedRoom._id,
        roomNumber: assignedRoom.number
      });

      console.log(`[CHECK-IN] Auto-assigned room ${assignedRoom.number} (${assignedRoom.housekeepingStatus || 'CLEAN'}) to booking ${booking.reservationNumber}`);

      // If room is dirty, create urgent housekeeping task
      if (assignedRoom.housekeepingStatus === 'DIRTY') {
        const { housekeepingRepo } = await import('./housekeepingRepo.js');
        await housekeepingRepo.create({
          hotelId: booking.hotelId,
          roomId: assignedRoom._id,
          roomNumber: assignedRoom.number,
          type: 'CHECK_IN_CLEAN',
          priority: 'HIGH',
          description: `Urgent: Clean room for guest check-in - ${booking.guest?.name || booking.guestName}`,
          status: 'PENDING'
        });
        console.log(`[CHECK-IN] Created HIGH priority housekeeping task for dirty room ${assignedRoom.number}`);
      }
    }

    // Now update status to CheckedIn
    booking = await this.update(id, { status: 'CheckedIn' });

    // INDUSTRY STANDARD: Atomic room status sync (Opera PMS pattern)
    if (booking?.roomId) {
      await syncRoomStatusWithBooking(booking._id, 'CheckedIn', booking.roomId);

      // FIX: Populate room number for better UX in API responses
      if (!booking.roomNumber) {
        const { roomsRepo } = await import('./roomsRepo.js');
        const room = await roomsRepo.getById(booking.roomId);
        if (room) {
          booking.roomNumber = room.number;
        }
      }
    }
    return booking;
  },
  async checkOut(id) {
    console.log(`[CHECKOUT] Function called for booking ID: ${id}`);
    const now = new Date().toISOString();
    const booking = await this.update(id, {
      status: 'CheckedOut',
      actualCheckOutDate: now,
      actualCheckOutTime: now
    });
    console.log(`[CHECKOUT] Booking updated. roomId: ${booking?.roomId}, roomNumber: ${booking?.roomNumber}, actualCheckOutDate: ${now}`);

    // INDUSTRY STANDARD: Atomic room status sync (Opera PMS pattern)
    if (booking?.roomId) {
      console.log(`[CHECKOUT] Has roomId, proceeding with room status sync...`);
      // FIX: Populate room number for better UX in API responses
      if (!booking.roomNumber) {
        const { roomsRepo } = await import('./roomsRepo.js');
        const room = await roomsRepo.getById(booking.roomId);
        if (room) {
          booking.roomNumber = room.number;
        }
      }

      // DEBUG: Trace sync execution with detailed error logging
      try {
        console.log(`[CHECKOUT DEBUG] About to call syncRoomStatusWithBooking for room ${booking.roomId}`);
        const syncResult = await syncRoomStatusWithBooking(booking._id, 'CheckedOut', booking.roomId);
        console.log(`[CHECKOUT DEBUG] Sync completed. Result:`, syncResult);
      } catch (syncError) {
        console.error(`[CHECKOUT ERROR] Sync failed:`, syncError.message);
        console.error(`[CHECKOUT ERROR] Stack:`, syncError.stack);
        // Don't throw - continue checkout even if sync fails
      }

      // INDUSTRY STANDARD: No separate history table
      // Checkout history is queried from bookings table (status='CheckedOut')
      // This follows best practices from Opera PMS, Maestro, Cloudbeds, etc.
      console.log(`[CHECKOUT] Guest ${booking.guest?.name} checked out from room ${booking.roomNumber || booking.roomId}`);

      // Create housekeeping task for checkout cleaning
      const { housekeepingRepo } = await import('./housekeepingRepo.js');

      // Check for next arrival to set priority
      const nextBooking = await this.list({ roomId: booking.roomId });
      const upcomingBookings = nextBooking.filter(b =>
        b.status === 'Reserved' &&
        new Date(b.checkInDate) > new Date()
      ).sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));

      const nextArrivalTime = upcomingBookings.length > 0
        ? upcomingBookings[0].checkInDate
        : null;

      // Get hotelId from room (bookings don't have hotelId field)
      let hotelId = booking.hotelId || null;
      if (!hotelId && booking.roomId) {
        try {
          const room = await roomsRepo.getById(booking.roomId);
          hotelId = room?.hotelId || 'hotel-001'; // Fallback to default
        } catch (err) {
          hotelId = 'hotel-001'; // Fallback to default
        }
      }

      await housekeepingRepo.createFromCheckout(
        booking.roomId,
        booking.roomNumber,
        hotelId,
        booking._id,
        nextArrivalTime
      );
    }

    // Auto-generate invoice from booking (INDUSTRY STANDARD - Opera PMS, Maestro, Cloudbeds)
    if (booking) {
      // Post a room rent folio line if none exists
      try {
        if (!booking.folio) booking.folio = { lines: [], payments: [], total: booking.amount, balance: booking.amount };
        if (!booking.folio.lines.some(l => l.type === 'room_rent')) {
          booking.folio.lines.push({ _id: uuidv4(), date: new Date().toISOString().slice(0, 10), type: 'room_rent', description: `Room ${booking.roomNumber} x ${booking.nights} night(s)`, amount: booking.amount });
        }
      } catch { }

      // INDUSTRY STANDARD: Calculate actual balance from folio (includes advance payments)
      const totalPaid = (booking.folio?.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const actualBalance = booking.amount - totalPaid;
      const advancePayment = booking.advancePayment || 0;

      // Derive tax rates from room type if configured
      let cgst = 2.5, sgst = 2.5, igst = 0;
      try {
        const room = booking.roomId ? await roomsRepo.getById(booking.roomId) : null;
        const types = await roomTypesRepo.list();
        const match = room?.type ? types.find(t => (t.name || '').toLowerCase() === String(room.type).toLowerCase()) : null;
        if (match) { cgst = Number(match.cgst ?? cgst); sgst = Number(match.sgst ?? sgst); igst = Number(match.igst ?? igst); }
      } catch { }

      // INDUSTRY STANDARD: Include full guest details on invoice (like Opera PMS, Maestro, Mews)

      // Build items array: Room charge + all folio charges (food, laundry, etc.)
      const billItems = [
        // Room charge
        {
          name: `Room ${booking.roomNumber} - ${booking.nights} night(s)`,
          hsn: '9963',
          quantity: 1,
          rate: booking.amount,
          cgst,
          sgst,
          igst
        }
      ];

      // Add all folio charges (food, laundry, minibar, etc.)
      if (booking.folio && booking.folio.lines && Array.isArray(booking.folio.lines)) {
        booking.folio.lines.forEach(line => {
          // Skip room rent lines since we already added room charge above
          if (line.type === 'room_rent') return;

          // Convert folio line to bill item format
          // Folio lines have: description, quantity, rate, totalAmount, cgst/sgst/igst amounts
          // Bill items need: name, quantity, rate, cgst/sgst/igst percentages

          const lineBaseAmount = Number(line.quantity || 1) * Number(line.rate || 0);
          const lineCGST = Number(line.cgst || 0);
          const lineSGST = Number(line.sgst || 0);
          const lineIGST = Number(line.igst || 0);

          // Calculate tax percentages from amounts
          const cgstPercent = lineBaseAmount > 0 ? (lineCGST / lineBaseAmount) * 100 : 0;
          const sgstPercent = lineBaseAmount > 0 ? (lineSGST / lineBaseAmount) * 100 : 0;
          const igstPercent = lineBaseAmount > 0 ? (lineIGST / lineBaseAmount) * 100 : 0;

          billItems.push({
            name: line.description || 'Additional Charge',
            hsn: line.hsn || '-',
            quantity: Number(line.quantity || 1),
            rate: Number(line.rate || 0),
            cgst: Number(cgstPercent.toFixed(2)),
            sgst: Number(sgstPercent.toFixed(2)),
            igst: Number(igstPercent.toFixed(2))
          });
        });
      }

      const billData = {
        customer: {
          name: booking.guest?.name || 'Guest',
          phone: booking.guest?.phone || '',
          email: booking.guest?.email || '',
          idProof: booking.guest?.idProof || '',
          address: booking.guest?.address || ''
        },
        items: billItems,  // Now includes room + all folio charges
        paymentMethod: booking.paymentMethod || 'Cash',
        notes: `Reservation ${booking.reservationNumber}${advancePayment > 0 ? ` | Advance Paid: ₹${advancePayment}` : ''} | Balance Due: ₹${actualBalance}`,
        status: actualBalance === 0 ? 'Paid' : 'Unpaid',
        // INDUSTRY STANDARD: Track advance payment on invoice
        advancePayment: advancePayment,
        balanceDue: actualBalance,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        nights: booking.nights
      };
      const bill = await billsRepo.create(billData);
      booking.billId = bill._id;
      booking.billNumber = bill.billNumber;
      await this.update(id, { billId: bill._id, billNumber: bill.billNumber });
    }
    return booking;
  }
};
