/**
 * Checkout Debug Test
 * Runs checkout and shows sync logs inline
 */

const BASE_URL = 'http://localhost:5051';
let authToken = '';

async function apiCall(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  
  return await response.json();
}

async function main() {
  console.log('\n🔍 CHECKOUT SYNC DEBUG TEST\n');
  
  try {
    // 1. Login
    console.log('1️⃣  Logging in...');
    const loginResult = await apiCall('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    authToken = loginResult.token;
    console.log('✅ Logged in\n');
    
    // 2. Get available room
    console.log('2️⃣  Finding available room...');
    const rooms = await apiCall('GET', '/rooms');
    const availableRoom = rooms.find(r => r.status === 'AVAILABLE');
    if (!availableRoom) {
      console.log('❌ No available rooms');
      return;
    }
    console.log(`✅ Found Room ${availableRoom.number} (${availableRoom.status})\n`);
    
    // 3. Create customer
    console.log('3️⃣  Creating customer...');
    const customer = await apiCall('POST', '/customers', {
      name: 'Debug Test Guest',
      phone: '+91-9999999999',
      email: 'debug@test.com'
    });
    console.log(`✅ Customer created: ${customer.name}\n`);
    
    // 4. Create booking
    console.log('4️⃣  Creating booking...');
    const booking = await apiCall('POST', '/bookings', {
      customerId: customer._id,
      guest: {
        name: 'Debug Test Guest',
        phone: '+91-9999999999',
        email: 'debug@test.com'
      },
      roomId: availableRoom._id,
      roomNumber: availableRoom.number,
      roomTypeId: availableRoom.roomTypeId,
      checkInDate: new Date().toISOString(),
      checkOutDate: new Date(Date.now() + 86400000).toISOString(),
      numberOfGuests: 2,
      guestCounts: { adults: 2, children: 0, infants: 0 },
      rate: 1500,
      paymentStatus: 'Paid'
    });
    console.log(`✅ Booking created: ${booking.reservationNumber}\n`);
    
    // 5. Check-in
    console.log('5️⃣  Checking in...');
    const checkedIn = await apiCall('POST', `/bookings/${booking._id}/checkin`);
    console.log(`✅ Checked in to Room ${checkedIn.roomNumber}`);
    
    // Verify room is occupied
    const roomAfterCheckIn = await apiCall('GET', `/rooms/${availableRoom._id}`);
    console.log(`   Room status: ${roomAfterCheckIn.status} + ${roomAfterCheckIn.housekeepingStatus}\n`);
    
    // 6. CHECKOUT - This is where we need to see debug logs
    console.log('6️⃣  CHECKING OUT (watch for [CHECKOUT DEBUG] and [SYNC] logs)...');
    console.log('   ⏱️  Waiting 2 seconds for server logs to appear...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const checkedOut = await apiCall('POST', `/bookings/${booking._id}/checkout`);
    console.log(`✅ Checkout API completed: Room ${checkedOut.roomNumber}`);
    
    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 7. Verify room status
    console.log('\n7️⃣  Verifying room status after checkout...');
    const roomAfterCheckOut = await apiCall('GET', `/rooms/${availableRoom._id}`);
    console.log(`   Room ${roomAfterCheckOut.number}:`);
    console.log(`   - Status: ${roomAfterCheckOut.status}`);
    console.log(`   - Housekeeping: ${roomAfterCheckOut.housekeepingStatus}`);
    
    if (roomAfterCheckOut.status === 'AVAILABLE' && roomAfterCheckOut.housekeepingStatus === 'DIRTY') {
      console.log('\n✅ SUCCESS: Room status synced correctly!');
    } else if (roomAfterCheckOut.status === 'OCCUPIED') {
      console.log('\n❌ FAILED: Room still OCCUPIED (sync didn\'t execute)');
      console.log('   Expected: AVAILABLE + DIRTY');
      console.log(`   Actual: ${roomAfterCheckOut.status} + ${roomAfterCheckOut.housekeepingStatus}`);
    } else {
      console.log('\n⚠️  UNEXPECTED: Room in unexpected state');
      console.log(`   Status: ${roomAfterCheckOut.status} + ${roomAfterCheckOut.housekeepingStatus}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

main();
