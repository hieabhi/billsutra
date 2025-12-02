/**
 * Data Validation Utility: Room-Booking Sync Checker
 * 
 * INDUSTRY STANDARD: Ensures room status matches actual booking state
 * Prevents issues like Room 102 showing "OCCUPIED" with no booking
 * 
 * Similar to data integrity checks in Opera PMS, Maestro, Cloudbeds
 */

import { readJSON, writeJSON } from './fileStore.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOMS_FILE = 'rooms.json';
const BOOKINGS_FILE = 'bookings.json';

/**
 * Validate and fix room-booking synchronization issues
 * @returns {Object} Validation report with issues found and fixed
 */
export async function validateRoomBookingSync() {
  const rooms = readJSON(ROOMS_FILE, []);
  const bookings = readJSON(BOOKINGS_FILE, []);
  const today = new Date();
  
  const report = {
    totalRooms: rooms.length,
    totalBookings: bookings.length,
    issues: [],
    fixes: []
  };

  // Check each room's status against actual bookings
  for (const room of rooms) {
    const roomBookings = bookings.filter(b => b.roomId === room._id);
    
    // Find active bookings (current occupancy or reservations)
    const activeBookings = roomBookings.filter(b => {
      if (b.status === 'CheckedOut' || b.status === 'Cancelled' || b.status === 'NoShow') {
        return false;
      }
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return checkIn <= today && today <= checkOut;
    });

    const futureReservations = roomBookings.filter(b => {
      if (b.status === 'CheckedOut' || b.status === 'Cancelled' || b.status === 'NoShow') {
        return false;
      }
      return new Date(b.checkInDate) > today;
    });

    // Determine expected status based on bookings
    let expectedStatus = 'AVAILABLE';
    
    if (activeBookings.some(b => b.status === 'CheckedIn')) {
      expectedStatus = 'OCCUPIED';
    } else if (futureReservations.length > 0 || activeBookings.some(b => b.status === 'Reserved')) {
      expectedStatus = 'RESERVED';
    }

    // Check for mismatches
    if (room.status === 'OCCUPIED' && activeBookings.length === 0) {
      report.issues.push({
        roomId: room._id,
        roomNumber: room.number,
        issue: 'Room marked OCCUPIED but no active booking found',
        currentStatus: room.status,
        expectedStatus: 'AVAILABLE',
        activeBookings: activeBookings.length
      });
      
      // Auto-fix: Change to AVAILABLE
      room.status = 'AVAILABLE';
      room.notes = (room.notes ? room.notes + ' | ' : '') + 'Status auto-corrected - no active booking found';
      room.updatedAt = new Date().toISOString();
      
      report.fixes.push({
        roomNumber: room.number,
        action: 'Changed status from OCCUPIED to AVAILABLE'
      });
    }

    if (room.status === 'RESERVED' && futureReservations.length === 0 && activeBookings.length === 0) {
      report.issues.push({
        roomId: room._id,
        roomNumber: room.number,
        issue: 'Room marked RESERVED but no reservation found',
        currentStatus: room.status,
        expectedStatus: 'AVAILABLE',
        futureReservations: futureReservations.length
      });
      
      // Auto-fix: Change to AVAILABLE
      room.status = 'AVAILABLE';
      room.notes = (room.notes ? room.notes + ' | ' : '') + 'Status auto-corrected - no reservation found';
      room.updatedAt = new Date().toISOString();
      
      report.fixes.push({
        roomNumber: room.number,
        action: 'Changed status from RESERVED to AVAILABLE'
      });
    }

    if (room.status === 'AVAILABLE' && activeBookings.length > 0) {
      const checkedInBooking = activeBookings.find(b => b.status === 'CheckedIn');
      if (checkedInBooking) {
        report.issues.push({
          roomId: room._id,
          roomNumber: room.number,
          issue: 'Room marked AVAILABLE but guest is checked in',
          currentStatus: room.status,
          expectedStatus: 'OCCUPIED',
          booking: checkedInBooking.reservationNumber
        });
        
        // Auto-fix: Change to OCCUPIED
        room.status = 'OCCUPIED';
        room.notes = (room.notes ? room.notes + ' | ' : '') + `Status auto-corrected - ${checkedInBooking.guest?.name || 'Guest'} checked in`;
        room.updatedAt = new Date().toISOString();
        
        report.fixes.push({
          roomNumber: room.number,
          action: 'Changed status from AVAILABLE to OCCUPIED',
          booking: checkedInBooking.reservationNumber
        });
      }
    }
  }

  // Save fixes if any were made
  if (report.fixes.length > 0) {
    writeJSON(ROOMS_FILE, rooms);
    console.log(`✅ Fixed ${report.fixes.length} room status inconsistencies`);
  }

  return report;
}

/**
 * Generate a detailed validation report
 */
export function printValidationReport(report) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       ROOM-BOOKING SYNC VALIDATION REPORT              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Total Rooms: ${report.totalRooms}`);
  console.log(`📊 Total Bookings: ${report.totalBookings}`);
  console.log(`⚠️  Issues Found: ${report.issues.length}`);
  console.log(`✅ Issues Fixed: ${report.fixes.length}\n`);

  if (report.issues.length > 0) {
    console.log('📋 ISSUES DETECTED:\n');
    report.issues.forEach((issue, index) => {
      console.log(`${index + 1}. Room ${issue.roomNumber} (${issue.roomId})`);
      console.log(`   Problem: ${issue.issue}`);
      console.log(`   Current Status: ${issue.currentStatus}`);
      console.log(`   Expected Status: ${issue.expectedStatus}`);
      if (issue.booking) console.log(`   Booking: ${issue.booking}`);
      console.log('');
    });
  }

  if (report.fixes.length > 0) {
    console.log('🔧 FIXES APPLIED:\n');
    report.fixes.forEach((fix, index) => {
      console.log(`${index + 1}. Room ${fix.roomNumber}: ${fix.action}`);
      if (fix.booking) console.log(`   Related Booking: ${fix.booking}`);
      console.log('');
    });
  }

  if (report.issues.length === 0) {
    console.log('✨ All room statuses are correctly synced with bookings!\n');
  }
}

// Run validation if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  console.log('Running room-booking sync validation...\n');
  const report = await validateRoomBookingSync();
  printValidationReport(report);
}
