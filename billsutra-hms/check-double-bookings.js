// Find Double Bookings
import fs from 'fs';

const bookings = JSON.parse(fs.readFileSync('./server/data/bookings.json', 'utf-8'));
const rooms = JSON.parse(fs.readFileSync('./server/data/rooms.json', 'utf-8'));

console.log('\n🔍 DOUBLE BOOKING ANALYSIS\n');

const reservedBookings = bookings.filter(b => b.status === 'Reserved');

// Group by room
const bookingsByRoom = {};
reservedBookings.forEach(b => {
  if (!bookingsByRoom[b.roomId]) {
    bookingsByRoom[b.roomId] = [];
  }
  bookingsByRoom[b.roomId].push(b);
});

console.log('📊 RESERVED BOOKINGS BY ROOM:\n');

Object.entries(bookingsByRoom).forEach(([roomId, bookings]) => {
  const room = rooms.find(r => r._id === roomId);
  const roomNum = room ? room.number : 'N/A';
  
  console.log(`Room ${roomNum} (${roomId}): ${bookings.length} bookings`);
  
  if (bookings.length > 1) {
    console.log(`   ⚠️  DOUBLE BOOKING DETECTED!`);
  }
  
  bookings.forEach(b => {
    const checkIn = b.checkInDate?.slice(0, 10) || 'N/A';
    const checkOut = b.checkOutDate?.slice(0, 10) || 'N/A';
    console.log(`   - ${b.reservationNumber}: ${b.guest?.name || 'N/A'} (${checkIn} to ${checkOut})`);
  });
  console.log('');
});

// Check for overlapping dates
console.log('\n🚨 CHECKING FOR DATE OVERLAPS:\n');

Object.entries(bookingsByRoom).forEach(([roomId, bookings]) => {
  if (bookings.length <= 1) return;
  
  const room = rooms.find(r => r._id === roomId);
  const roomNum = room ? room.number : 'N/A';
  
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const b1 = bookings[i];
      const b2 = bookings[j];
      
      const b1CheckIn = new Date(b1.checkInDate);
      const b1CheckOut = new Date(b1.checkOutDate);
      const b2CheckIn = new Date(b2.checkInDate);
      const b2CheckOut = new Date(b2.checkOutDate);
      
      // Check if dates overlap
      const overlap = (b1CheckIn < b2CheckOut) && (b2CheckIn < b1CheckOut);
      
      if (overlap) {
        console.log(`❌ Room ${roomNum}: DATE OVERLAP!`);
        console.log(`   ${b1.reservationNumber} (${b1.guest?.name}): ${b1.checkInDate?.slice(0,10)} to ${b1.checkOutDate?.slice(0,10)}`);
        console.log(`   ${b2.reservationNumber} (${b2.guest?.name}): ${b2.checkInDate?.slice(0,10)} to ${b2.checkOutDate?.slice(0,10)}`);
        console.log('');
      } else {
        console.log(`✓ Room ${roomNum}: No overlap between ${b1.reservationNumber} and ${b2.reservationNumber}`);
      }
    }
  }
});

console.log('\n');
