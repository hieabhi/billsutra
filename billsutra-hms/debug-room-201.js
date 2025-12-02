import { readJSON } from './server/utils/fileStore.js';

const rooms = readJSON('rooms.json', []);
const bookings = readJSON('bookings.json', []);

const room201 = rooms.find(r => r.number === '201' || r.number === 201);

if (!room201) {
    console.log('Room 201 not found!');
} else {
    console.log('Room 201:', room201);

    const roomBookings = bookings.filter(b => b.roomId === room201._id);
    console.log(`Found ${roomBookings.length} bookings for Room 201:`);

    roomBookings.forEach(b => {
        console.log(`- Booking ${b.reservationNumber}: Status=${b.status}, CheckIn=${b.checkInDate}, CheckOut=${b.checkOutDate}`);
    });
}
