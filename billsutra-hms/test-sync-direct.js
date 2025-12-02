// Direct test of sync function - no server needed
import { syncRoomStatusWithBooking } from './server/utils/roomBookingSync.js';
import { readFileSync } from 'fs';

console.log('\n🧪 DIRECT SYNC FUNCTION TEST\n');

// Read current room status
const rooms = JSON.parse(readFileSync('./server/data/rooms.json', 'utf-8'));
const room101 = rooms.find(r => r.number === '101');

console.log('Room 101 BEFORE sync:');
console.log(`  Status: ${room101.status}`);
console.log(`  Housekeeping: ${room101.housekeepingStatus}\n`);

// Call sync with a fake checkout
console.log('Calling syncRoomStatusWithBooking("fake-id", "CheckedOut", "room-101")...\n');
const result = await syncRoomStatusWithBooking('fake-id', 'CheckedOut', 'room-101');

console.log('Sync result:', result);

// Read updated room status
const roomsAfter = JSON.parse(readFileSync('./server/data/rooms.json', 'utf-8'));
const room101After = roomsAfter.find(r => r.number === '101');

console.log('\nRoom 101 AFTER sync:');
console.log(`  Status: ${room101After.status}`);
console.log(`  Housekeeping: ${room101After.housekeepingStatus}\n`);

if (room101After.status === 'AVAILABLE' && room101After.housekeepingStatus === 'DIRTY') {
  console.log('✅ SUCCESS: Sync function works correctly!\n');
} else {
  console.log('❌ FAILED: Sync function did not update correctly\n');
}
