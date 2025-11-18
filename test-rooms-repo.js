import { roomsRepo } from './server/repositories/roomsRepo.js';

async function test() {
  console.log('Testing roomsRepo.getAll()...\n');
  
  // Test 1: null hotelId (superadmin case)
  console.log('Test 1: getAll(null)');
  const allRooms = await roomsRepo.getAll(null);
  console.log('Result:', allRooms.length, 'rooms');
  if (allRooms.length > 0) {
    console.log('First room:', allRooms[0].number, allRooms[0].hotelId);
  }
  
  // Test 2: undefined hotelId
  console.log('\nTest 2: getAll(undefined)');
  const undefinedRooms = await roomsRepo.getAll(undefined);
  console.log('Result:', undefinedRooms.length, 'rooms');
  
  // Test 3: specific hotelId
  console.log('\nTest 3: getAll("hotel-001")');
  const hotel001Rooms = await roomsRepo.getAll('hotel-001');
  console.log('Result:', hotel001Rooms.length, 'rooms');
  
  // Test 4: non-existent hotelId
  console.log('\nTest 4: getAll("hotel-999")');
  const nonExistentRooms = await roomsRepo.getAll('hotel-999');
  console.log('Result:', nonExistentRooms.length, 'rooms');
}

test().catch(console.error);
