/**
 * SIMPLIFIED BILLSUTRA TEST - Quick API validation
 */

import http from 'http';

const BASE = 'http://localhost:5051/api';
let token = '';
let results = { pass: 0, fail: 0 };

function apiCall(method, path, body = null, auth = true) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5051,
      path: `/api${path}`,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (auth && token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(json.message || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

async function main() {
  console.log('\n🏨 BILLSUTRA QUICK TEST\n');
  console.log('═'.repeat(60));
  
  try {
    // Test 1: Login
    console.log('\n1️⃣  AUTHENTICATION');
    const login = await apiCall('POST', '/auth/login', { username: 'admin', password: 'admin123' }, false);
    token = login.token;
    log('✅', `Logged in as ${login.user.username}`);
    results.pass++;
    
    // Test 2: Room Types
    console.log('\n2️⃣  ROOM TYPES');
    const roomTypes = await apiCall('GET', '/room-types');
    log('✅', `Found ${roomTypes.length} room types`);
    roomTypes.forEach(rt => log('  📦', `${rt.name}: ₹${rt.defaultRate}/night`));
    results.pass++;
    
    // Test 3: Rooms
    console.log('\n3️⃣  ROOMS');
    const rooms = await apiCall('GET', '/rooms');
    const available = rooms.filter(r => r.status === 'AVAILABLE').length;
    const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
    const dirty = rooms.filter(r => r.housekeepingStatus === 'DIRTY').length;
    log('✅', `Total: ${rooms.length} | Available: ${available} | Occupied: ${occupied} | Dirty: ${dirty}`);
    results.pass++;
    
    // Test 4: Create customer
    console.log('\n4️⃣  CREATE CUSTOMER');
    try {
      const customer = await apiCall('POST', '/customers', {
        name: 'Test Guest',
        email: `testguest${Date.now()}@hotel.com`,
        phone: '+91-9999999999',
        idType: 'AADHAAR',
        idNumber: 'TEST123456',
        address: 'Test Address'
      });
      log('✅', `Created customer: ${customer.name}`);
      results.pass++;
      
      // Test 5: Create booking
      console.log('\n5️⃣  CREATE BOOKING');
      const tomorrow = new Date(Date.now() + 86400000);
      const dayAfter = new Date(Date.now() + 172800000);
      
      const booking = await apiCall('POST', '/bookings', {
        customerId: customer._id,
        guest: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        roomTypeId: roomTypes[0]._id,
        checkInDate: tomorrow.toISOString().split('T')[0],
        checkOutDate: dayAfter.toISOString().split('T')[0],
        guestCounts: {
          adults: 2,
          children: 0,
          infants: 0
        },
        additionalGuests: [],
        source: 'WALK_IN',
        advancePayment: 1000
      });
      log('✅', `Created booking: ${booking.guest?.name || booking.guestName || 'Guest'} → Room ${booking.roomNumber || booking.room?.number || 'TBD'}`);
      results.pass++;
      
      // Test 6: Check-in
      console.log('\n6️⃣  CHECK-IN');
      const checkedIn = await apiCall('POST', `/bookings/${booking._id}/check-in`, {});
      log('✅', `Checked in: ${checkedIn.guest?.name || checkedIn.guestName || 'Guest'} to Room ${checkedIn.roomNumber || checkedIn.room?.number}`);
      results.pass++;
      
      // Verify room status - use booking's roomId if checkedIn doesn't have it
      const roomIdToCheck = checkedIn.roomId || booking.roomId;
      if (roomIdToCheck) {
        const updatedRooms = await apiCall('GET', '/rooms');
        const bookedRoom = updatedRooms.find(r => r._id === roomIdToCheck);
        if (bookedRoom && bookedRoom.status === 'OCCUPIED') {
          log('✅', `Room ${bookedRoom.number} status: OCCUPIED`);
          results.pass++;
        } else if (bookedRoom) {
          log('❌', `Room status mismatch: ${bookedRoom.status}`);
          results.fail++;
        } else {
          log('❌', `Room not found`);
          results.fail++;
        }
      } else {
        log('⚠️', `No room ID found in response`);
      }
      
      // Test 7: Housekeeping
      console.log('\n7️⃣  HOUSEKEEPING');
      const hk = await apiCall('GET', '/housekeeping');
      const tasks = hk.data || hk; // Handle both array and object responses
      log('✅', `Found ${tasks.length} housekeeping tasks`);
      results.pass++;
      
      // Test 8: Checkout
      console.log('\n8️⃣  CHECKOUT');
      const checkedOut = await apiCall('POST', `/bookings/${booking._id}/check-out`, {});
      log('✅', `Checked out: ${checkedOut.guest?.name || checkedOut.guestName || 'Guest'} from Room ${checkedOut.roomNumber || checkedOut.room?.number}`);
      results.pass++;
      
      // Verify room became dirty
      const finalRooms = await apiCall('GET', '/rooms');
      const checkoutRoom = finalRooms.find(r => r._id === checkedOut.roomId);
      if (checkoutRoom && checkoutRoom.status === 'AVAILABLE' && checkoutRoom.housekeepingStatus === 'DIRTY') {
        log('✅', `Room ${checkoutRoom.number} status: AVAILABLE + DIRTY`);
        results.pass++;
      } else {
        log('❌', `Room status after checkout: ${checkoutRoom.status} + ${checkoutRoom.housekeepingStatus}`);
        results.fail++;
      }
      
      // Test 9: Items
      console.log('\n9️⃣  BILLING ITEMS');
      const items = await apiCall('GET', '/items');
      log('✅', `Found ${items.length} billing items`);
      results.pass++;
      
      // Test 10: Dashboard stats
      console.log('\n🔟 DASHBOARD STATS');
      const stats = await apiCall('GET', '/stats');
      log('✅', `Rooms: ${stats.rooms.total} | Bookings: ${stats.bookings.total}`);
      log('  📊', `Occupied: ${stats.rooms.occupied} | Available: ${stats.rooms.available}`);
      log('  📊', `CheckedIn: ${stats.bookings.checkedIn} | Reserved: ${stats.bookings.reserved}`);
      results.pass++;
      
    } catch (error) {
      log('❌', `Test failed: ${error.message}`);
      results.fail++;
    }
    
  } catch (error) {
    log('❌', `Critical error: ${error.message}`);
    results.fail++;
  }
  
  // Final report
  console.log('\n═'.repeat(60));
  console.log(`\n📊 RESULTS: ${results.pass} passed, ${results.fail} failed`);
  const rate = ((results.pass / (results.pass + results.fail)) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${rate}%`);
  
  if (results.fail === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
  } else {
    console.log('\n⚠️  Some tests failed');
  }
  console.log('\n═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
