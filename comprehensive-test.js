/**
 * COMPREHENSIVE BILLSUTRA TEST
 * Tests all features with realistic hotel data
 * Data is preserved for manual verification
 */

import http from 'http';

const BASE_URL = 'http://localhost:5051/api';
let token = '';
const testData = {
  customers: [],
  bookings: [],
  bills: [],
  housekeeping: [],
  rooms: []
};

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
          reject(new Error(`Invalid JSON: ${data.substring(0, 100)}`));
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

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

async function main() {
  console.log('\n🏨 COMPREHENSIVE BILLSUTRA TEST');
  console.log('📝 Creating realistic hotel data for testing\n');
  
  let passed = 0, failed = 0;

  try {
    // ==================== AUTHENTICATION ====================
    section('🔐 AUTHENTICATION');
    const login = await apiCall('POST', '/auth/login', { 
      username: 'admin', 
      password: 'admin123' 
    }, false);
    token = login.token;
    log('✅', `Logged in as ${login.user.username}`);
    passed++;

    // ==================== ROOM TYPES ====================
    section('🏢 ROOM TYPES');
    const roomTypes = await apiCall('GET', '/room-types');
    log('✅', `Found ${roomTypes.length} room types`);
    roomTypes.forEach(rt => {
      log('  📦', `${rt.name}: ₹${rt.defaultRate}/night - ${rt.description || 'Standard room'}`);
    });
    passed++;

    // ==================== ROOMS ====================
    section('🚪 ROOMS STATUS');
    const rooms = await apiCall('GET', '/rooms');
    testData.rooms = rooms;
    const roomStats = {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'AVAILABLE').length,
      occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
      reserved: rooms.filter(r => r.status === 'RESERVED').length,
      dirty: rooms.filter(r => r.housekeepingStatus === 'DIRTY').length,
      clean: rooms.filter(r => r.housekeepingStatus === 'CLEAN').length
    };
    log('✅', `Total Rooms: ${roomStats.total}`);
    log('  📊', `Available: ${roomStats.available} | Occupied: ${roomStats.occupied} | Reserved: ${roomStats.reserved}`);
    log('  🧹', `Clean: ${roomStats.clean} | Dirty: ${roomStats.dirty}`);
    passed++;

    // ==================== CREATE CUSTOMERS ====================
    section('👥 CREATING CUSTOMERS');
    const customerData = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@email.com',
        phone: '+91-9876543210',
        idType: 'AADHAAR',
        idNumber: '1234-5678-9012',
        address: '123 MG Road, Bangalore, Karnataka 560001',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560001'
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        phone: '+91-9876543211',
        idType: 'PAN',
        idNumber: 'ABCDE1234F',
        address: '456 Park Street, Mumbai, Maharashtra 400001',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      },
      {
        name: 'Amit Patel',
        email: 'amit.patel@email.com',
        phone: '+91-9876543212',
        idType: 'AADHAAR',
        idNumber: '9876-5432-1098',
        address: '789 Ring Road, Ahmedabad, Gujarat 380001',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        zipCode: '380001'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1-5550123456',
        idType: 'PASSPORT',
        idNumber: 'US1234567',
        address: '100 Broadway, New York, NY 10005',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10005'
      },
      {
        name: 'David Chen',
        email: 'david.chen@email.com',
        phone: '+86-13800001234',
        idType: 'PASSPORT',
        idNumber: 'CN7654321',
        address: '88 Nanjing Road, Shanghai 200001',
        city: 'Shanghai',
        state: 'Shanghai',
        country: 'China',
        zipCode: '200001'
      }
    ];

    for (const custData of customerData) {
      const customer = await apiCall('POST', '/customers', custData);
      testData.customers.push(customer);
      log('✅', `Created: ${customer.name} (${customer.phone})`);
      passed++;
    }

    // ==================== CREATE BOOKINGS ====================
    section('📅 CREATING BOOKINGS');
    
    // Booking 1: Standard Room - Walk-in today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const booking1 = await apiCall('POST', '/bookings', {
      customerId: testData.customers[0]._id,
      guest: {
        name: testData.customers[0].name,
        email: testData.customers[0].email,
        phone: testData.customers[0].phone
      },
      roomTypeId: roomTypes[0]._id,
      checkInDate: today.toISOString().split('T')[0],
      checkOutDate: tomorrow.toISOString().split('T')[0],
      guestCounts: { adults: 2, children: 1, infants: 0 },
      additionalGuests: [
        { name: 'Sunita Kumar', age: 35, relation: 'Spouse' },
        { name: 'Rohan Kumar', age: 8, relation: 'Child' }
      ],
      source: 'WALK_IN',
      advancePayment: 1500,
      specialRequests: 'Extra bed for child, early check-in if possible'
    });
    testData.bookings.push(booking1);
    log('✅', `Booking ${booking1.reservationNumber}: ${booking1.guest.name} - ${roomTypes[0].name} (Walk-in)`);
    passed++;

    // Booking 2: Deluxe Room - Online booking for next week
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 3);

    const booking2 = await apiCall('POST', '/bookings', {
      customerId: testData.customers[1]._id,
      guest: {
        name: testData.customers[1].name,
        email: testData.customers[1].email,
        phone: testData.customers[1].phone
      },
      roomTypeId: roomTypes[1]._id,
      checkInDate: nextWeek.toISOString().split('T')[0],
      checkOutDate: nextWeekEnd.toISOString().split('T')[0],
      guestCounts: { adults: 1, children: 0, infants: 0 },
      additionalGuests: [],
      source: 'ONLINE',
      advancePayment: 2500,
      specialRequests: 'Late checkout requested, vegetarian breakfast'
    });
    testData.bookings.push(booking2);
    log('✅', `Booking ${booking2.reservationNumber}: ${booking2.guest.name} - ${roomTypes[1].name} (Online)`);
    passed++;

    // Booking 3: Suite - Corporate booking
    const booking3 = await apiCall('POST', '/bookings', {
      customerId: testData.customers[2]._id,
      guest: {
        name: testData.customers[2].name,
        email: testData.customers[2].email,
        phone: testData.customers[2].phone
      },
      roomTypeId: roomTypes[2]._id,
      checkInDate: tomorrow.toISOString().split('T')[0],
      checkOutDate: dayAfter.toISOString().split('T')[0],
      guestCounts: { adults: 2, children: 0, infants: 0 },
      additionalGuests: [
        { name: 'Neha Patel', age: 32, relation: 'Colleague' }
      ],
      source: 'CORPORATE',
      advancePayment: 5000,
      specialRequests: 'Conference room access, business center facilities'
    });
    testData.bookings.push(booking3);
    log('✅', `Booking ${booking3.reservationNumber}: ${booking3.guest.name} - ${roomTypes[2].name} (Corporate)`);
    passed++;

    // Booking 4: International guest - Standard room
    const booking4 = await apiCall('POST', '/bookings', {
      customerId: testData.customers[3]._id,
      guest: {
        name: testData.customers[3].name,
        email: testData.customers[3].email,
        phone: testData.customers[3].phone
      },
      roomTypeId: roomTypes[0]._id,
      checkInDate: today.toISOString().split('T')[0],
      checkOutDate: dayAfter.toISOString().split('T')[0],
      guestCounts: { adults: 1, children: 0, infants: 0 },
      additionalGuests: [],
      source: 'TRAVEL_AGENT',
      advancePayment: 3000,
      specialRequests: 'Airport pickup arranged, western breakfast'
    });
    testData.bookings.push(booking4);
    log('✅', `Booking ${booking4.reservationNumber}: ${booking4.guest.name} - International Guest`);
    passed++;

    // ==================== CHECK-INS ====================
    section('🔑 CHECK-INS');
    
    // Check-in Booking 1
    const checkedIn1 = await apiCall('POST', `/bookings/${booking1._id}/check-in`, {});
    log('✅', `Checked in: ${checkedIn1.guest.name} → Room ${checkedIn1.roomNumber}`);
    log('  📝', `Guests: ${checkedIn1.guestCounts.adults} Adults, ${checkedIn1.guestCounts.children} Children`);
    passed++;

    // Check-in Booking 4
    const checkedIn4 = await apiCall('POST', `/bookings/${booking4._id}/check-in`, {});
    log('✅', `Checked in: ${checkedIn4.guest.name} → Room ${checkedIn4.roomNumber}`);
    log('  🌍', 'International guest from USA');
    passed++;

    // Verify room statuses changed
    const roomsAfterCheckIn = await apiCall('GET', '/rooms');
    const room1 = roomsAfterCheckIn.find(r => r._id === checkedIn1.roomId);
    const room4 = roomsAfterCheckIn.find(r => r._id === checkedIn4.roomId);
    if (room1.status === 'OCCUPIED' && room4.status === 'OCCUPIED') {
      log('✅', `Room statuses updated correctly: ${room1.number} & ${room4.number} now OCCUPIED`);
      passed++;
    } else {
      log('❌', `Room status sync failed`);
      failed++;
    }

    // ==================== HOUSEKEEPING ====================
    section('🧹 HOUSEKEEPING TASKS');
    
    const hkTasks = await apiCall('GET', '/housekeeping');
    const tasks = hkTasks.data || hkTasks;
    testData.housekeeping = tasks;
    
    const hkStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'InProgress' || t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length
    };
    
    log('✅', `Total Tasks: ${hkStats.total}`);
    log('  📊', `Pending: ${hkStats.pending} | In Progress: ${hkStats.inProgress} | Completed: ${hkStats.completed}`);
    
    // Show some task details
    const dirtyRooms = tasks.filter(t => t.status === 'Pending' && t.type === 'CLEANING').slice(0, 3);
    dirtyRooms.forEach(task => {
      log('  🧼', `Room ${task.roomNumber}: ${task.description || task.type} (${task.priority || 'NORMAL'} priority)`);
    });
    passed++;

    // Complete a housekeeping task
    if (hkStats.pending > 0) {
      const taskToComplete = tasks.find(t => t.status === 'Pending');
      if (taskToComplete) {
        const updated = await apiCall('PUT', `/housekeeping/${taskToComplete._id}`, {
          status: 'Completed',
          completedBy: 'Housekeeping Staff',
          notes: 'Room cleaned and inspected - ready for next guest'
        });
        log('✅', `Completed housekeeping for Room ${updated.roomNumber}`);
        passed++;
      }
    }

    // ==================== ROOM SERVICE / BILLING ====================
    section('🍽️ BILLING ITEMS');
    
    const items = await apiCall('GET', '/items');
    log('✅', `Found ${items.length} billing items/services`);
    if (items.length > 0) {
      items.slice(0, 5).forEach(item => {
        log('  💰', `${item.name}: ₹${item.price} (${item.category || 'General'})`);
      });
      passed++;
    }

    // ==================== CHECKOUT ====================
    section('🚪 CHECKOUT');
    
    // Checkout the first guest
    const checkedOut1 = await apiCall('POST', `/bookings/${booking1._id}/check-out`, {});
    log('✅', `Checked out: ${checkedOut1.guest.name} from Room ${checkedOut1.roomNumber}`);
    passed++;

    // Verify room status changed to AVAILABLE + DIRTY
    const roomsAfterCheckout = await apiCall('GET', '/rooms');
    const checkoutRoom = roomsAfterCheckout.find(r => r._id === checkedOut1.roomId);
    if (checkoutRoom.status === 'AVAILABLE' && checkoutRoom.housekeepingStatus === 'DIRTY') {
      log('✅', `Room ${checkoutRoom.number} status: AVAILABLE + DIRTY (correct)`);
      passed++;
    } else {
      log('❌', `Room status after checkout: ${checkoutRoom.status} + ${checkoutRoom.housekeepingStatus}`);
      failed++;
    }

    // Verify housekeeping task created
    const hkAfterCheckout = await apiCall('GET', '/housekeeping');
    const checkoutTask = (hkAfterCheckout.data || hkAfterCheckout).find(t => 
      t.roomNumber === checkoutRoom.number && 
      t.type === 'CHECKOUT_CLEAN'
    );
    if (checkoutTask) {
      log('✅', `Housekeeping task auto-created for checkout room`);
      passed++;
    } else {
      log('⚠️', 'No checkout cleaning task found (might be expected)');
    }

    // ==================== DASHBOARD STATS ====================
    section('📊 DASHBOARD STATISTICS');
    
    const stats = await apiCall('GET', '/stats');
    log('✅', 'Dashboard Stats Retrieved');
    log('  🏨', `Rooms: ${stats.rooms.total} total`);
    log('     ', `  • Occupied: ${stats.rooms.occupied}`);
    log('     ', `  • Available: ${stats.rooms.available}`);
    log('     ', `  • Reserved: ${stats.rooms.reserved || 0}`);
    log('     ', `  • Occupancy Rate: ${stats.rooms.occupancyRate}%`);
    log('  📅', `Bookings: ${stats.bookings.total} total`);
    log('     ', `  • Checked In: ${stats.bookings.checkedIn}`);
    log('     ', `  • Reserved: ${stats.bookings.reserved}`);
    log('     ', `  • Arrivals Today: ${stats.bookings.arrivalsToday}`);
    log('     ', `  • Departures Today: ${stats.bookings.departuresToday}`);
    log('  🧹', `Housekeeping: ${stats.housekeeping.pending} pending, ${stats.housekeeping.completed} completed`);
    passed++;

    // ==================== FINAL SUMMARY ====================
    section('📋 TEST SUMMARY');
    
    console.log('\n📊 Results:');
    log('✅', `Passed: ${passed}`);
    log('❌', `Failed: ${failed}`);
    
    const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
    log('📈', `Success Rate: ${successRate}%`);
    
    console.log('\n💾 Test Data Created:');
    log('👥', `${testData.customers.length} customers`);
    log('📅', `${testData.bookings.length} bookings`);
    log('🚪', `${testData.rooms.length} rooms tracked`);
    log('🧹', `${testData.housekeeping.length} housekeeping tasks`);
    
    console.log('\n📝 Booking Details:');
    testData.bookings.forEach((b, i) => {
      const status = b.status === 'CheckedIn' ? '🔑 Checked In' : 
                     b.status === 'CheckedOut' ? '🚪 Checked Out' :
                     '📅 Reserved';
      log('  ', `${i + 1}. ${b.reservationNumber} - ${b.guest.name} (${status})`);
    });
    
    console.log('\n' + '═'.repeat(60));
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Data preserved for review.');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Please review.`);
    }
    
    console.log('\n💡 Tip: Check server/data/ folder for all created data');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Critical Error:', error.message);
    console.error('Stack:', error.stack);
    failed++;
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
