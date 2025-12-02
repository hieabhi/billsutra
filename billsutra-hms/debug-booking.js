import { readJSON } from './server/utils/fileStore.js';

const bookings = readJSON('bookings.json', []);
const booking = bookings.find(b => b.reservationNumber === 'RES00035');

if (booking) {
    console.log('Booking RES00035:');
    console.log('Status:', booking.status);
    console.log('CheckIn:', booking.checkInDate);
    console.log('CheckOut:', booking.checkOutDate);
    console.log('RoomId:', booking.roomId);
} else {
    console.log('Booking RES00035 not found');
}
