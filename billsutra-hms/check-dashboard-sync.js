// Dashboard Data Synchronization Check
import fs from 'fs';

const rooms = JSON.parse(fs.readFileSync('./server/data/rooms.json', 'utf-8'));
const bookings = JSON.parse(fs.readFileSync('./server/data/bookings.json', 'utf-8'));
const housekeeping = JSON.parse(fs.readFileSync('./server/data/housekeeping.json', 'utf-8'));

console.log('\n🔍 DASHBOARD DATA SYNCHRONIZATION CHECK\n');

// Room Status Analysis
console.log('📊 ROOM STATUS SUMMARY:');
const roomStats = {};
rooms.forEach(r => roomStats[r.status] = (roomStats[r.status] || 0) + 1);
Object.entries(roomStats).forEach(([status, count]) => {
  console.log(`   ${status}: ${count} rooms`);
});

console.log('\n📊 BOOKING STATUS SUMMARY:');
const bookingStats = {};
bookings.forEach(b => bookingStats[b.status] = (bookingStats[b.status] || 0) + 1);
Object.entries(bookingStats).forEach(([status, count]) => {
  console.log(`   ${status}: ${count} bookings`);
});

// Today's Data
const today = new Date().toISOString().slice(0, 10);
console.log(`\n📅 TODAY (${today}):`);

const arrivalsToday = bookings.filter(b => 
  b.status === 'Reserved' && 
  b.checkInDate?.slice(0, 10) === today
);
console.log(`   Arrivals Today: ${arrivalsToday.length}`);
arrivalsToday.forEach(b => {
  console.log(`     - ${b.guest?.name || 'Guest'} (Room ${b.roomId?.split('-')[1] || 'N/A'})`);
});

const departuresToday = bookings.filter(b => 
  b.status === 'CheckedIn' && 
  b.checkOutDate?.slice(0, 10) === today
);
console.log(`   Departures Today: ${departuresToday.length}`);
departuresToday.forEach(b => {
  console.log(`     - ${b.guest?.name || 'Guest'} (Room ${b.roomId?.split('-')[1] || 'N/A'})`);
});

const inHouse = bookings.filter(b => b.status === 'CheckedIn');
console.log(`   In-House Guests: ${inHouse.length}`);

// Housekeeping
console.log('\n🧹 HOUSEKEEPING TASKS:');
const hkPending = housekeeping.filter(t => t.status === 'Pending');
const hkCompleted = housekeeping.filter(t => t.status === 'Completed');
console.log(`   Pending: ${hkPending.length}`);
console.log(`   Completed: ${hkCompleted.length}`);

// Data Integrity Checks
console.log('\n✅ DATA INTEGRITY CHECKS:');

// Check 1: Rooms with OCCUPIED status should have CheckedIn bookings
const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED');
console.log(`\n   Check 1: OCCUPIED Rooms vs CheckedIn Bookings`);
console.log(`   - OCCUPIED rooms: ${occupiedRooms.length}`);
console.log(`   - CheckedIn bookings: ${inHouse.length}`);

occupiedRooms.forEach(room => {
  const booking = bookings.find(b => b.roomId === room._id && b.status === 'CheckedIn');
  if (!booking) {
    console.log(`   ⚠️  Room ${room.number} is OCCUPIED but has no CheckedIn booking!`);
  }
});

// Check 2: CheckedIn bookings should have OCCUPIED rooms
inHouse.forEach(booking => {
  const room = rooms.find(r => r._id === booking.roomId);
  if (room && room.status !== 'OCCUPIED') {
    console.log(`   ⚠️  Guest ${booking.guest?.name} is CheckedIn but room ${room.number} is ${room.status}!`);
  }
});

// Check 3: RESERVED rooms should have Reserved bookings
const reservedRooms = rooms.filter(r => r.status === 'RESERVED');
const reservedBookings = bookings.filter(b => b.status === 'Reserved');
console.log(`\n   Check 2: RESERVED Rooms vs Reserved Bookings`);
console.log(`   - RESERVED rooms: ${reservedRooms.length}`);
console.log(`   - Reserved bookings: ${reservedBookings.length}`);

reservedRooms.forEach(room => {
  const booking = bookings.find(b => b.roomId === room._id && b.status === 'Reserved');
  if (!booking) {
    console.log(`   ⚠️  Room ${room.number} is RESERVED but has no Reserved booking!`);
  }
});

// Check 4: DIRTY rooms should ideally have housekeeping tasks
const dirtyRooms = rooms.filter(r => r.status === 'DIRTY');
console.log(`\n   Check 3: DIRTY Rooms vs Housekeeping Tasks`);
console.log(`   - DIRTY rooms: ${dirtyRooms.length}`);
console.log(`   - Pending cleaning tasks: ${hkPending.filter(t => t.type === 'Cleaning').length}`);

console.log('\n✅ DASHBOARD SYNC CHECK COMPLETE!\n');
