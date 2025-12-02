import { readJSON } from './server/utils/fileStore.js';

const bookings = readJSON('bookings.json', []);
const activeBookings = bookings.filter(b =>
    b.roomId === 'room-201' &&
    (b.status === 'Reserved' || b.status === 'Confirmed')
);

console.log(`Found ${activeBookings.length} active bookings for Room 201:`);
activeBookings.forEach(b => {
    console.log(`- ${b.reservationNumber}: ${b.status}, In=${b.checkInDate}, Out=${b.checkOutDate}`);
});
