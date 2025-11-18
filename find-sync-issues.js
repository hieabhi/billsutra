// Find Booking-Room Sync Issues
import fs from 'fs';

const rooms = JSON.parse(fs.readFileSync('./server/data/rooms.json', 'utf-8'));
const bookings = JSON.parse(fs.readFileSync('./server/data/bookings.json', 'utf-8'));

console.log('\n🔍 BOOKING-ROOM SYNCHRONIZATION ISSUES\n');

const reservedBookings = bookings.filter(b => b.status === 'Reserved');

console.log(`Found ${reservedBookings.length} Reserved bookings:\n`);

reservedBookings.forEach(booking => {
  const room = rooms.find(r => r._id === booking.roomId);
  
  console.log(`📋 Booking ${booking.reservationNumber}:`);
  console.log(`   Guest: ${booking.guest?.name || 'N/A'}`);
  console.log(`   Room ID: ${booking.roomId}`);
  
  if (room) {
    console.log(`   ✓ Room ${room.number} exists`);
    console.log(`   ⚠️  Current status: ${room.status} (should be RESERVED)`);
    if (room.status !== 'RESERVED') {
      console.log(`   🔧 NEEDS FIX: Change room ${room.number} from ${room.status} to RESERVED`);
    }
  } else {
    console.log(`   ❌ Room NOT FOUND in rooms.json!`);
  }
  console.log('');
});

console.log('\n');
