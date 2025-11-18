/**
 * Test script for booking validations
 * Run: node test-booking-validations.js
 */

const API_URL = 'http://localhost:5051/api';

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const data = await response.json();
  return data.token;
}

async function getRooms(token) {
  const response = await fetch(`${API_URL}/rooms`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

async function createBooking(token, bookingData) {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Booking failed');
  }
  
  return response.json();
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   BOOKING VALIDATION TESTS                        ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  try {
    // Login
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful\n');
    
    // Get available rooms
    console.log('🏨 Fetching rooms...');
    const rooms = await getRooms(token);
    console.log(`✅ Found ${rooms.length} rooms\n`);
    
    if (rooms.length === 0) {
      console.log('❌ No rooms available for testing');
      return;
    }
    
    const testRoom = rooms.find(r => r.status === 'AVAILABLE') || rooms[0];
    console.log(`🎯 Testing with Room ${testRoom.number} (${testRoom._id})\n`);
    
    // TEST 1: Valid booking
    console.log('═══════════════════════════════════════════════════');
    console.log('TEST 1: Create valid booking');
    console.log('═══════════════════════════════════════════════════');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    
    const validBooking = {
      guest: { name: 'Test Guest 1' },
      roomId: testRoom._id,
      roomNumber: testRoom.number,
      rate: 3000,
      checkInDate: tomorrow.toISOString().slice(0, 10),
      checkOutDate: dayAfter.toISOString().slice(0, 10),
      guestsCount: 2,
      paymentMethod: 'Cash',
      notes: 'Test booking - valid'
    };
    
    try {
      const booking1 = await createBooking(token, validBooking);
      console.log(`✅ PASS: Created booking ${booking1.reservationNumber}`);
      console.log(`   Check-in: ${booking1.checkInDate}, Check-out: ${booking1.checkOutDate}`);
      console.log(`   Nights: ${booking1.nights}, Amount: ₹${booking1.amount}\n`);
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}\n`);
    }
    
    // TEST 2: Duplicate booking (conflict detection)
    console.log('═══════════════════════════════════════════════════');
    console.log('TEST 2: Duplicate booking (should FAIL)');
    console.log('═══════════════════════════════════════════════════');
    
    const duplicateBooking = {
      guest: { name: 'Test Guest 2' },
      roomId: testRoom._id,
      roomNumber: testRoom.number,
      rate: 3000,
      checkInDate: tomorrow.toISOString().slice(0, 10),
      checkOutDate: dayAfter.toISOString().slice(0, 10),
      guestsCount: 1,
      paymentMethod: 'Cash',
      notes: 'Test booking - duplicate (should fail)'
    };
    
    try {
      await createBooking(token, duplicateBooking);
      console.log(`❌ FAIL: Should have prevented duplicate booking\n`);
    } catch (err) {
      console.log(`✅ PASS: Correctly rejected duplicate booking`);
      console.log(`   Error: ${err.message}\n`);
    }
    
    // TEST 3: Check-in after check-out
    console.log('═══════════════════════════════════════════════════');
    console.log('TEST 3: Check-in AFTER check-out (should FAIL)');
    console.log('═══════════════════════════════════════════════════');
    
    const invalidDates = {
      guest: { name: 'Test Guest 3' },
      roomId: testRoom._id,
      roomNumber: testRoom.number,
      rate: 3000,
      checkInDate: dayAfter.toISOString().slice(0, 10),
      checkOutDate: tomorrow.toISOString().slice(0, 10),
      guestsCount: 1,
      paymentMethod: 'Cash',
      notes: 'Test booking - invalid dates'
    };
    
    try {
      await createBooking(token, invalidDates);
      console.log(`❌ FAIL: Should have rejected invalid dates\n`);
    } catch (err) {
      console.log(`✅ PASS: Correctly rejected invalid dates`);
      console.log(`   Error: ${err.message}\n`);
    }
    
    // TEST 4: Past date booking
    console.log('═══════════════════════════════════════════════════');
    console.log('TEST 4: Booking in the past (should FAIL)');
    console.log('═══════════════════════════════════════════════════');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const pastBooking = {
      guest: { name: 'Test Guest 4' },
      roomId: testRoom._id,
      roomNumber: testRoom.number,
      rate: 3000,
      checkInDate: twoDaysAgo.toISOString().slice(0, 10),
      checkOutDate: yesterday.toISOString().slice(0, 10),
      guestsCount: 1,
      paymentMethod: 'Cash',
      notes: 'Test booking - past dates'
    };
    
    try {
      await createBooking(token, pastBooking);
      console.log(`❌ FAIL: Should have rejected past dates\n`);
    } catch (err) {
      console.log(`✅ PASS: Correctly rejected past dates`);
      console.log(`   Error: ${err.message}\n`);
    }
    
    // TEST 5: Overlapping booking (partial overlap)
    console.log('═══════════════════════════════════════════════════');
    console.log('TEST 5: Partial overlap (should FAIL)');
    console.log('═══════════════════════════════════════════════════');
    
    const tomorrowPlus2 = new Date();
    tomorrowPlus2.setDate(tomorrowPlus2.getDate() + 2);
    const tomorrowPlus5 = new Date();
    tomorrowPlus5.setDate(tomorrowPlus5.getDate() + 5);
    
    const overlapBooking = {
      guest: { name: 'Test Guest 5' },
      roomId: testRoom._id,
      roomNumber: testRoom.number,
      rate: 3000,
      checkInDate: tomorrowPlus2.toISOString().slice(0, 10),
      checkOutDate: tomorrowPlus5.toISOString().slice(0, 10),
      guestsCount: 1,
      paymentMethod: 'Cash',
      notes: 'Test booking - overlap'
    };
    
    try {
      await createBooking(token, overlapBooking);
      console.log(`❌ FAIL: Should have prevented overlapping booking\n`);
    } catch (err) {
      console.log(`✅ PASS: Correctly rejected overlapping booking`);
      console.log(`   Error: ${err.message}\n`);
    }
    
    // TEST 6: Booking after existing booking ends (should succeed)
    console.log('═══════════════════════════════════════════════════');
    console.log('TEST 6: Booking AFTER existing ends (should PASS)');
    console.log('═══════════════════════════════════════════════════');
    
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const tenDaysLater = new Date();
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);
    
    const futureBooking = {
      guest: { name: 'Test Guest 6' },
      roomId: testRoom._id,
      roomNumber: testRoom.number,
      rate: 3500,
      checkInDate: weekLater.toISOString().slice(0, 10),
      checkOutDate: tenDaysLater.toISOString().slice(0, 10),
      guestsCount: 1,
      paymentMethod: 'Cash',
      notes: 'Test booking - future (should work)'
    };
    
    try {
      const booking6 = await createBooking(token, futureBooking);
      console.log(`✅ PASS: Created future booking ${booking6.reservationNumber}`);
      console.log(`   Check-in: ${booking6.checkInDate}, Check-out: ${booking6.checkOutDate}\n`);
    } catch (err) {
      console.log(`❌ FAIL: Should have allowed future booking`);
      console.log(`   Error: ${err.message}\n`);
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error);
  }
}

// Run tests
runTests();
