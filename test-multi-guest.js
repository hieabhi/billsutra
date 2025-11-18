/**
 * MULTI-GUEST SUPPORT TEST SUITE
 * Tests the new guest count tracking and additional guests features
 */

const BASE_URL = 'http://localhost:5051/api';

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let authToken = '';
let testRoomId = '';
let largeRoomId = '';  // For tests requiring more capacity
let testRoomNumber = '';
let largeRoomNumber = '';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function login() {
  log('\n🔐 Logging in...', 'cyan');
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  const data = await response.json();
  authToken = data.token;
  log('✓ Login successful', 'green');
}

async function getAvailableRoom() {
  log('\n🏨 Finding available rooms...', 'cyan');
  const response = await fetch(`${BASE_URL}/rooms`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  const rooms = await response.json();
  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE' || r.status === 'CLEAN');
  
  if (availableRooms.length === 0) {
    throw new Error('No available rooms found');
  }
  
  // Find a small room (capacity 2) and a large room (capacity 4+)
  const smallRoom = availableRooms.find(r => (r.maxOccupancy || 2) === 2);
  const largeRoom = availableRooms.find(r => (r.maxOccupancy || 2) >= 4);
  
  if (!smallRoom) {
    throw new Error('No small capacity room found');
  }
  
  testRoomId = smallRoom._id;
  testRoomNumber = smallRoom.number;
  log(`✓ Found Small Room ${smallRoom.number} (Capacity: ${smallRoom.maxOccupancy || 2})`, 'green');
  
  if (largeRoom) {
    largeRoomId = largeRoom._id;
    largeRoomNumber = largeRoom.number;
    log(`✓ Found Large Room ${largeRoom.number} (Capacity: ${largeRoom.maxOccupancy || 2})`, 'green');
  } else {
    log(`⚠️  No large room found - will skip capacity tests`, 'yellow');
  }
  
  return { small: smallRoom, large: largeRoom };
}

async function testBooking(testName, bookingData, shouldPass = true) {
  log(`\n📝 TEST: ${testName}`, 'yellow');
  log(`   Details: ${JSON.stringify(bookingData.guestCounts)}`, 'gray');
  
  try {
    const response = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    const errorMsg = result.error || result.message || 'Unknown error';
    
    if (shouldPass) {
      if (response.ok) {
        log(`   ✅ PASS: Booking created successfully`, 'green');
        log(`   Reservation #: ${result.reservationNumber}`, 'gray');
        log(`   Total Guests: ${result.totalGuests}`, 'gray');
        log(`   Guest Breakdown: ${result.guestCounts.adults}A, ${result.guestCounts.children}C, ${result.guestCounts.infants}I`, 'gray');
        if (result.additionalGuests?.length > 0) {
          log(`   Additional Guests: ${result.additionalGuests.length}`, 'gray');
        }
        results.passed++;
        results.tests.push({ name: testName, status: 'PASS', result: 'Created successfully' });
        return result._id;
      } else {
        log(`   ❌ FAIL: Expected success but got error: ${errorMsg}`, 'red');
        log(`   Status: ${response.status}`, 'gray');
        results.failed++;
        results.tests.push({ name: testName, status: 'FAIL', result: errorMsg });
        return null;
      }
    } else {
      if (!response.ok) {
        log(`   ✅ PASS: Correctly rejected with error: ${errorMsg}`, 'green');
        results.passed++;
        results.tests.push({ name: testName, status: 'PASS', result: `Validation worked: ${errorMsg}` });
        return null;
      } else {
        log(`   ❌ FAIL: Should have been rejected but was accepted`, 'red');
        results.failed++;
        results.tests.push({ name: testName, status: 'FAIL', result: 'Validation failed - should have rejected' });
        return result._id;
      }
    }
  } catch (error) {
    log(`   ❌ ERROR: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: testName, status: 'ERROR', result: error.message });
    return null;
  }
}

async function runTests() {
  try {
    await login();
    const rooms = await getAvailableRoom();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('  MULTI-GUEST SUPPORT TEST SUITE', 'cyan');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    // Helper to get unique date ranges for each test
    let dayOffset = 1;
    const getDateRange = () => {
      const start = new Date(tomorrow);
      start.setDate(start.getDate() + dayOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      dayOffset += 5; // Skip 5 days for next test
      return {
        checkIn: start.toISOString().split('T')[0],
        checkOut: end.toISOString().split('T')[0]
      };
    };
    
    // TEST 1: Family booking - use large room if available
    if (largeRoomId) {
      const dates1 = getDateRange();
      await testBooking('Family of 4 (2A, 2C)', {
        guest: {
          name: 'Rajesh Kumar',
          phone: '9876543210',
          email: 'rajesh@example.com',
          idProof: 'AADHAR123456',
          address: 'Mumbai, India'
        },
        guestCounts: {
          adults: 2,
          children: 2,
          infants: 0
        },
        additionalGuests: [
          { name: 'Priya Kumar', age: 35, ageCategory: 'Adult', idProof: 'AADHAR789012' },
          { name: 'Aarav Kumar', age: 10, ageCategory: 'Child', idProof: '' },
          { name: 'Diya Kumar', age: 7, ageCategory: 'Child', idProof: '' }
        ],
        roomId: largeRoomId,
        roomNumber: largeRoomNumber,
        checkInDate: dates1.checkIn,
        checkOutDate: dates1.checkOut,
        rate: 2500,
        paymentMethod: 'Cash',
        bookingSource: 'Walk-in'
      }, true);
    } else {
      log('\n⏭️  SKIPPED: Family of 4 (no large room available)', 'yellow');
    }
    
    // TEST 2: Couple with baby (2A, 1I)
    const dates2 = getDateRange();
    await testBooking('Couple with Baby (2A, 0C, 1I)', {
      guest: {
        name: 'John Doe',
        phone: '8765432109',
        email: 'john@example.com',
        idProof: 'PASSPORT987654',
        address: 'Delhi, India'
      },
      guestCounts: {
        adults: 2,
        children: 0,
        infants: 1
      },
      additionalGuests: [
        { name: 'Jane Doe', age: 28, ageCategory: 'Adult', idProof: 'PASSPORT123456' },
        { name: 'Baby Doe', age: 0.5, ageCategory: 'Infant', idProof: '' }
      ],
      roomId: testRoomId,
      roomNumber: testRoomNumber,
      checkInDate: dates2.checkIn,
      checkOutDate: dates2.checkOut,
      rate: 2000,
      paymentMethod: 'Credit Card',
      bookingSource: 'Online'
    }, true);
    
    // TEST 3: Solo traveler (1A only)
    const dates3 = getDateRange();
    await testBooking('Solo Traveler (1A)', {
      guest: {
        name: 'Amit Singh',
        phone: '7654321098',
        email: 'amit@example.com',
        idProof: 'DL456789',
        address: 'Bangalore, India'
      },
      guestCounts: {
        adults: 1,
        children: 0,
        infants: 0
      },
      additionalGuests: [],
      roomId: testRoomId,
      roomNumber: testRoomNumber,
      checkInDate: dates3.checkIn,
      checkOutDate: dates3.checkOut,
      rate: 1500,
      paymentMethod: 'UPI',
      bookingSource: 'Phone'
    }, true);
    
    // TEST 4: Group booking (3A) - only if large room available
    if (largeRoomId) {
      const dates4 = getDateRange();
      await testBooking('Group of 3 Adults', {
        guest: {
          name: 'Corporate Booker',
          phone: '6543210987',
          email: 'corporate@example.com',
          idProof: 'AADHAR111222',
          address: 'Pune, India'
        },
        guestCounts: {
          adults: 3,
          children: 0,
          infants: 0
        },
        additionalGuests: [
          { name: 'Employee 1', age: 30, ageCategory: 'Adult', idProof: 'AADHAR333444' },
          { name: 'Employee 2', age: 28, ageCategory: 'Adult', idProof: 'AADHAR555666' }
        ],
        roomId: largeRoomId,
        roomNumber: largeRoomNumber,
        checkInDate: dates4.checkIn,
        checkOutDate: dates4.checkOut,
        rate: 3000,
        paymentMethod: 'Bank Transfer',
        bookingSource: 'Agent'
      }, true);
    } else {
      log('\n⏭️  SKIPPED: Group of 3 Adults (no large room available)', 'yellow');
    }
    
    // TEST 5: VALIDATION - No adults (should FAIL)
    const dates5 = getDateRange();
    await testBooking('Validation: 0 Adults (Should FAIL)', {
      guest: {
        name: 'Test User',
        phone: '5432109876',
        email: 'test@example.com',
        idProof: 'TEST123',
        address: 'Test City'
      },
      guestCounts: {
        adults: 0,
        children: 2,
        infants: 0
      },
      additionalGuests: [],
      roomId: testRoomId,
      roomNumber: testRoomNumber,
      checkInDate: dates5.checkIn,
      checkOutDate: dates5.checkOut,
      rate: 1500,
      paymentMethod: 'Cash',
      bookingSource: 'Walk-in'
    }, false); // Should fail
    
    // TEST 6: VALIDATION - Exceeds room capacity (should FAIL)
    const dates6 = getDateRange();
    await testBooking(`Validation: Exceeds Capacity (Max: ${rooms.small.maxOccupancy || 2}) (Should FAIL)`, {
      guest: {
        name: 'Large Family',
        phone: '4321098765',
        email: 'large@example.com',
        idProof: 'FAMILY123',
        address: 'Test City'
      },
      guestCounts: {
        adults: 5,
        children: 3,
        infants: 1
      },
      additionalGuests: [],
      roomId: testRoomId,
      roomNumber: testRoomNumber,
      checkInDate: dates6.checkIn,
      checkOutDate: dates6.checkOut,
      rate: 2000,
      paymentMethod: 'Cash',
      bookingSource: 'Walk-in'
    }, false); // Should fail
    
    // TEST 7: Edge case - Exactly at capacity
    const dates7 = getDateRange();
    const maxGuests = rooms.small.maxOccupancy || 2;
    await testBooking(`Exactly At Capacity (${maxGuests} guests)`, {
      guest: {
        name: 'Perfect Fit',
        phone: '3210987654',
        email: 'perfect@example.com',
        idProof: 'PERFECT123',
        address: 'Test City'
      },
      guestCounts: {
        adults: maxGuests,
        children: 0,
        infants: 0
      },
      additionalGuests: [],
      roomId: testRoomId,
      roomNumber: testRoomNumber,
      checkInDate: dates7.checkIn,
      checkOutDate: dates7.checkOut,
      rate: 2000,
      paymentMethod: 'Cash',
      bookingSource: 'Walk-in'
    }, true); // Should pass
    
    // TEST 8: Infants don't count toward capacity
    const dates8 = getDateRange();
    await testBooking('Infants Excluded from Capacity (2A + 5I)', {
      guest: {
        name: 'Daycare Group',
        phone: '2109876543',
        email: 'daycare@example.com',
        idProof: 'DAYCARE123',
        address: 'Test City'
      },
      guestCounts: {
        adults: 2,
        children: 0,
        infants: 5
      },
      additionalGuests: [],
      roomId: testRoomId,
      roomNumber: testRoomNumber,
      checkInDate: dates8.checkIn,
      checkOutDate: dates8.checkOut,
      rate: 2000,
      paymentMethod: 'Cash',
      bookingSource: 'Walk-in'
    }, true); // Should pass (infants don't count)
    
    // SUMMARY
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('  TEST RESULTS SUMMARY', 'cyan');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    log(`\n✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`📊 Total:  ${results.passed + results.failed}`, 'cyan');
    
    const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    log(`\n🎯 Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
    
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('  DETAILED RESULTS', 'cyan');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    results.tests.forEach((test, index) => {
      const color = test.status === 'PASS' ? 'green' : 'red';
      log(`\n${index + 1}. ${test.name}`, 'yellow');
      log(`   Status: ${test.status}`, color);
      log(`   Result: ${test.result}`, 'gray');
    });
    
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
    
    if (results.failed === 0) {
      log('🎉 ALL TESTS PASSED! Multi-guest support working perfectly!', 'green');
    } else {
      log(`⚠️  ${results.failed} test(s) failed. Please review.`, 'red');
    }
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the tests
runTests();
