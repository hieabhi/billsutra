// Test Enhanced Booking Creation with Industry Standards
// Run: node test-enhanced-bookings.js

import axios from 'axios';

const API = 'http://localhost:5051/api';
let token = '';

async function login() {
  console.log('\n🔐 Logging in...');
  const response = await axios.post(`${API}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  token = response.data.token;
  console.log('✅ Login successful');
  return token;
}

const headers = () => ({ Authorization: `Bearer ${token}` });

async function testGuestContactValidation() {
  console.log('\n📋 TEST 1: Guest Contact Validation');
  console.log('─'.repeat(60));
  
  // Test 1.1: Missing phone number
  try {
    await axios.post(`${API}/bookings`, {
      guest: {
        name: 'Test Guest',
        email: 'test@example.com'
        // Missing phone
      },
      roomId: 'test-room',
      checkInDate: '2025-12-01',
      checkOutDate: '2025-12-03',
      rate: 1000
    }, { headers: headers() });
    console.log('❌ FAILED: Should reject booking without phone');
  } catch (err) {
    if (err.response?.data?.message?.includes('phone')) {
      console.log('✅ PASSED: Correctly rejected booking without phone');
      console.log('   Error:', err.response.data.message);
    } else {
      console.log('⚠️  Unexpected error:', err.response?.data?.message || err.message);
    }
  }
  
  // Test 1.2: Invalid email format
  try {
    await axios.post(`${API}/bookings`, {
      guest: {
        name: 'Test Guest',
        phone: '9876543210',
        email: 'invalid-email'
      },
      roomId: 'test-room',
      checkInDate: '2025-12-01',
      checkOutDate: '2025-12-03',
      rate: 1000
    }, { headers: headers() });
    console.log('❌ FAILED: Should reject invalid email');
  } catch (err) {
    if (err.response?.data?.message?.includes('email')) {
      console.log('✅ PASSED: Correctly rejected invalid email');
      console.log('   Error:', err.response.data.message);
    } else {
      console.log('⚠️  Unexpected error:', err.response?.data?.message || err.message);
    }
  }
  
  // Test 1.3: Phone too short
  try {
    await axios.post(`${API}/bookings`, {
      guest: {
        name: 'Test Guest',
        phone: '12345', // Only 5 digits
        email: 'test@example.com'
      },
      roomId: 'test-room',
      checkInDate: '2025-12-01',
      checkOutDate: '2025-12-03',
      rate: 1000
    }, { headers: headers() });
    console.log('❌ FAILED: Should reject short phone number');
  } catch (err) {
    if (err.response?.data?.message?.includes('10 digits')) {
      console.log('✅ PASSED: Correctly rejected short phone number');
      console.log('   Error:', err.response.data.message);
    } else {
      console.log('⚠️  Unexpected error:', err.response?.data?.message || err.message);
    }
  }
}

async function testSmartRoomAvailability() {
  console.log('\n🏨 TEST 2: Smart Room Availability Filtering');
  console.log('─'.repeat(60));
  
  // Get all rooms first
  const roomsResponse = await axios.get(`${API}/rooms`, { headers: headers() });
  const allRooms = roomsResponse.data;
  console.log(`📊 Total rooms in hotel: ${allRooms.length}`);
  
  if (allRooms.length === 0) {
    console.log('⚠️  No rooms found. Cannot test availability filtering.');
    return;
  }
  
  // Test 2.1: Get available rooms without dates (should return all bookable rooms)
  const availableAllResponse = await axios.get(`${API}/rooms/available`, { headers: headers() });
  console.log(`✅ Available rooms (no dates): ${availableAllResponse.data.length}`);
  
  // Test 2.2: Create a test booking
  const testRoom = allRooms.find(r => r.status === 'AVAILABLE' || r.status === 'CLEAN');
  if (!testRoom) {
    console.log('⚠️  No available rooms to test with');
    return;
  }
  
  console.log(`\n📝 Creating test booking for Room ${testRoom.number}...`);
  const bookingResponse = await axios.post(`${API}/bookings`, {
    guest: {
      name: 'Test Guest Availability',
      phone: '+91-9876543210',
      email: 'availability@test.com',
      idProof: 'TEST-ID-001'
    },
    roomId: testRoom._id,
    roomNumber: testRoom.number,
    checkInDate: '2025-12-15',
    checkOutDate: '2025-12-18',
    rate: testRoom.rate || 1500,
    guestsCount: 2,
    bookingSource: 'Phone'
  }, { headers: headers() });
  
  const testBooking = bookingResponse.data;
  console.log(`✅ Created booking: ${testBooking.reservationNumber}`);
  console.log(`   Guest: ${testBooking.guest.name}`);
  console.log(`   Phone: ${testBooking.guest.phone}`);
  console.log(`   Email: ${testBooking.guest.email}`);
  console.log(`   Source: ${testBooking.bookingSource}`);
  
  // Test 2.3: Get available rooms for overlapping dates
  const overlappingResponse = await axios.get(`${API}/rooms/available`, {
    params: {
      checkInDate: '2025-12-16',  // Overlaps with Dec 15-18
      checkOutDate: '2025-12-17'
    },
    headers: headers()
  });
  
  const overlappingRooms = overlappingResponse.data;
  const testRoomAvailable = overlappingRooms.find(r => r._id === testRoom._id);
  
  if (!testRoomAvailable) {
    console.log(`✅ PASSED: Room ${testRoom.number} correctly excluded from overlapping dates`);
  } else {
    console.log(`❌ FAILED: Room ${testRoom.number} should not be available for overlapping dates`);
  }
  
  // Test 2.4: Get available rooms for non-overlapping dates
  const nonOverlappingResponse = await axios.get(`${API}/rooms/available`, {
    params: {
      checkInDate: '2025-12-19',  // After Dec 15-18
      checkOutDate: '2025-12-21'
    },
    headers: headers()
  });
  
  const nonOverlappingRooms = nonOverlappingResponse.data;
  const testRoomAvailableAfter = nonOverlappingRooms.find(r => r._id === testRoom._id);
  
  if (testRoomAvailableAfter) {
    console.log(`✅ PASSED: Room ${testRoom.number} correctly available for non-overlapping dates`);
  } else {
    console.log(`❌ FAILED: Room ${testRoom.number} should be available after booking period`);
  }
  
  // Cleanup: Delete test booking
  console.log(`\n🧹 Cleaning up test booking...`);
  await axios.delete(`${API}/bookings/${testBooking._id}`, { headers: headers() });
  console.log('✅ Test booking deleted');
}

async function testBookingSourceTracking() {
  console.log('\n📊 TEST 3: Booking Source Tracking');
  console.log('─'.repeat(60));
  
  const sources = ['Walk-in', 'Phone', 'Online', 'OTA', 'Travel Agent'];
  console.log('Testing booking sources:', sources.join(', '));
  
  // Get an available room
  const roomsResponse = await axios.get(`${API}/rooms`, { headers: headers() });
  const testRoom = roomsResponse.data.find(r => r.status === 'AVAILABLE' || r.status === 'CLEAN');
  
  if (!testRoom) {
    console.log('⚠️  No available rooms for testing');
    return;
  }
  
  const createdBookings = [];
  
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const checkInDate = `2025-12-${String(20 + i * 2).padStart(2, '0')}`;
    const checkOutDate = `2025-12-${String(21 + i * 2).padStart(2, '0')}`;
    
    try {
      const response = await axios.post(`${API}/bookings`, {
        guest: {
          name: `${source} Guest`,
          phone: `+91-98765432${i}0`,
          email: `${source.toLowerCase().replace(/\s+/g, '')}@test.com`
        },
        roomId: testRoom._id,
        roomNumber: testRoom.number,
        checkInDate,
        checkOutDate,
        rate: 1000,
        guestsCount: 1,
        bookingSource: source
      }, { headers: headers() });
      
      createdBookings.push(response.data);
      console.log(`✅ Created booking with source: ${source} (${response.data.reservationNumber})`);
    } catch (err) {
      console.log(`❌ Failed to create ${source} booking:`, err.response?.data?.message || err.message);
    }
  }
  
  // Verify bookings have correct sources
  console.log(`\n📋 Verifying booking sources...`);
  for (const booking of createdBookings) {
    console.log(`   ${booking.reservationNumber}: ${booking.bookingSource || 'Walk-in (default)'}`);
  }
  
  // Cleanup
  console.log(`\n🧹 Cleaning up test bookings...`);
  for (const booking of createdBookings) {
    await axios.delete(`${API}/bookings/${booking._id}`, { headers: headers() });
  }
  console.log(`✅ Deleted ${createdBookings.length} test bookings`);
}

async function testCompletBookingWorkflow() {
  console.log('\n🎯 TEST 4: Complete Booking Workflow (Industry Standard)');
  console.log('─'.repeat(60));
  
  // Get available rooms
  const roomsResponse = await axios.get(`${API}/rooms/available`, {
    params: {
      checkInDate: '2025-12-10',
      checkOutDate: '2025-12-12'
    },
    headers: headers()
  });
  
  const availableRooms = roomsResponse.data;
  console.log(`📊 Available rooms for Dec 10-12: ${availableRooms.length}`);
  
  if (availableRooms.length === 0) {
    console.log('⚠️  No rooms available for test dates');
    return;
  }
  
  const selectedRoom = availableRooms[0];
  console.log(`✅ Selected Room ${selectedRoom.number} (${selectedRoom.type})`);
  
  // Create booking with all enhanced fields
  console.log('\n📝 Creating booking with full guest information...');
  const bookingData = {
    guest: {
      name: 'Rajesh Kumar',
      phone: '+91-9876543210',
      email: 'rajesh.kumar@example.com',
      idProof: 'AADHAAR-1234-5678-9012',
      address: '123, MG Road, Bangalore, Karnataka - 560001'
    },
    roomId: selectedRoom._id,
    roomNumber: selectedRoom.number,
    checkInDate: '2025-12-10',
    checkOutDate: '2025-12-12',
    rate: selectedRoom.rate || 2000,
    guestsCount: 2,
    bookingSource: 'Online',
    paymentMethod: 'Credit Card',
    notes: 'Guest prefers ground floor. Non-smoking room.'
  };
  
  const bookingResponse = await axios.post(`${API}/bookings`, bookingData, { headers: headers() });
  const booking = bookingResponse.data;
  
  console.log('✅ Booking created successfully!');
  console.log('\n📋 Booking Details:');
  console.log(`   Reservation #: ${booking.reservationNumber}`);
  console.log(`   Guest: ${booking.guest.name}`);
  console.log(`   Phone: ${booking.guest.phone}`);
  console.log(`   Email: ${booking.guest.email}`);
  console.log(`   ID Proof: ${booking.guest.idProof}`);
  console.log(`   Address: ${booking.guest.address}`);
  console.log(`   Room: ${booking.roomNumber}`);
  console.log(`   Dates: ${booking.checkInDate} → ${booking.checkOutDate}`);
  console.log(`   Nights: ${booking.nights}`);
  console.log(`   Rate: ₹${booking.rate}/night`);
  console.log(`   Total: ₹${booking.amount}`);
  console.log(`   Source: ${booking.bookingSource}`);
  console.log(`   Status: ${booking.status}`);
  
  // Verify room is no longer available for same dates
  console.log('\n🔍 Verifying room availability after booking...');
  const afterBookingResponse = await axios.get(`${API}/rooms/available`, {
    params: {
      checkInDate: '2025-12-10',
      checkOutDate: '2025-12-12'
    },
    headers: headers()
  });
  
  const stillAvailable = afterBookingResponse.data.find(r => r._id === selectedRoom._id);
  if (!stillAvailable) {
    console.log(`✅ PASSED: Room ${selectedRoom.number} correctly removed from available rooms`);
  } else {
    console.log(`❌ FAILED: Room ${selectedRoom.number} should not be available`);
  }
  
  // Cleanup
  console.log(`\n🧹 Cleaning up...`);
  await axios.delete(`${API}/bookings/${booking._id}`, { headers: headers() });
  console.log('✅ Test booking deleted');
}

async function runAllTests() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   BILLSUTRA ENHANCED BOOKING SYSTEM - TEST SUITE          ║');
    console.log('║   Testing Industry Standard Features                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    await login();
    
    await testGuestContactValidation();
    await testSmartRoomAvailability();
    await testBookingSourceTracking();
    await testCompletBookingWorkflow();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ALL TESTS COMPLETED                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

runAllTests();
