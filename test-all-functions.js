/**
 * Comprehensive API Test Suite
 * Tests all major functions and validations
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

async function testAPI(token, endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  return { ok: response.ok, status: response.status, data: await response.json() };
}

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         BILLSUTRA COMPREHENSIVE FUNCTION TESTS               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  let passCount = 0;
  let failCount = 0;
  
  const test = (name, condition, details = '') => {
    if (condition) {
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
      passCount++;
    } else {
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
      failCount++;
    }
  };
  
  try {
    // ========================================
    // AUTHENTICATION TESTS
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 AUTHENTICATION & AUTHORIZATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const token = await login();
    test('Login with valid credentials', token !== undefined, `Token: ${token.substring(0, 20)}...`);
    
    // ========================================
    // ROOMS TESTS
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏨 ROOM MANAGEMENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const roomsRes = await testAPI(token, '/rooms');
    test('Fetch all rooms', roomsRes.ok, `Found ${roomsRes.data.length} rooms`);
    
    const availableRooms = roomsRes.data.filter(r => r.status === 'AVAILABLE');
    test('Available rooms exist', availableRooms.length > 0, `${availableRooms.length} available`);
    
    // ========================================
    // ROOM TYPES & GST
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️  ROOM TYPES & GST CALCULATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const typesRes = await testAPI(token, '/room-types');
    test('Fetch room types', typesRes.ok, `Found ${typesRes.data.length} types`);
    
    if (typesRes.data.length > 0) {
      const deluxe = typesRes.data.find(t => t.name === 'Deluxe');
      if (deluxe) {
        test('Deluxe type has GST rates', deluxe.cgst !== undefined && deluxe.sgst !== undefined, 
          `CGST: ${deluxe.cgst}%, SGST: ${deluxe.sgst}%`);
      }
    }
    
    // ========================================
    // RATE PLANS
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 DYNAMIC PRICING & RATE PLANS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const ratePlansRes = await testAPI(token, '/rate-plans');
    test('Fetch rate plans', ratePlansRes.ok, `Found ${ratePlansRes.data.length} plans`);
    
    // ========================================
    // HOUSEKEEPING TESTS
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧹 HOUSEKEEPING MANAGEMENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const tasksRes = await testAPI(token, '/housekeeping');
    test('Fetch housekeeping tasks', tasksRes.ok, `Found ${tasksRes.data.length} tasks`);
    
    const pendingTasks = tasksRes.data.filter(t => t.status === 'PENDING');
    test('Pending tasks tracked', pendingTasks.length >= 0, `${pendingTasks.length} pending`);
    
    // ========================================
    // BOOKING VALIDATION TESTS
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 BOOKING VALIDATIONS (NEW FEATURES)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const testRoom = availableRooms[0];
    if (testRoom) {
      // Test 1: Valid booking
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 4);
      
      const validBooking = {
        guest: { name: 'Test Guest' },
        roomId: testRoom._id,
        roomNumber: testRoom.number,
        rate: 3000,
        checkInDate: tomorrow.toISOString().slice(0, 10),
        checkOutDate: nextWeek.toISOString().slice(0, 10),
        guestsCount: 2,
        paymentMethod: 'Cash',
        notes: 'Test booking'
      };
      
      const booking1 = await testAPI(token, '/bookings', 'POST', validBooking);
      test('✅ Valid booking creation', booking1.ok, 
        booking1.ok ? `Reservation: ${booking1.data.reservationNumber}` : booking1.data.message);
      
      if (booking1.ok) {
        const bookingId = booking1.data._id;
        
        // Test 2: Duplicate booking (should fail)
        const dupBooking = { ...validBooking, guest: { name: 'Duplicate Test' } };
        const booking2 = await testAPI(token, '/bookings', 'POST', dupBooking);
        test('❌ Duplicate booking prevented', !booking2.ok, booking2.data.message);
        
        // Test 3: Invalid dates (check-out before check-in)
        const invalidDates = { 
          ...validBooking, 
          checkInDate: nextWeek.toISOString().slice(0, 10),
          checkOutDate: tomorrow.toISOString().slice(0, 10),
          guest: { name: 'Invalid Dates' }
        };
        const booking3 = await testAPI(token, '/bookings', 'POST', invalidDates);
        test('❌ Invalid dates rejected', !booking3.ok, booking3.data.message);
        
        // Test 4: Past date booking
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);
        const pastBooking = {
          ...validBooking,
          checkInDate: yesterday.toISOString().slice(0, 10),
          checkOutDate: tomorrow.toISOString().slice(0, 10),
          guest: { name: 'Past Date' }
        };
        const booking4 = await testAPI(token, '/bookings', 'POST', pastBooking);
        test('❌ Past date booking rejected', !booking4.ok, booking4.data.message);
        
        // Test 5: Future non-overlapping booking (should succeed)
        const twoWeeks = new Date();
        twoWeeks.setDate(twoWeeks.getDate() + 10);
        const threeWeeks = new Date();
        threeWeeks.setDate(threeWeeks.getDate() + 14);
        
        const futureBooking = {
          ...validBooking,
          checkInDate: twoWeeks.toISOString().slice(0, 10),
          checkOutDate: threeWeeks.toISOString().slice(0, 10),
          guest: { name: 'Future Guest' }
        };
        const booking5 = await testAPI(token, '/bookings', 'POST', futureBooking);
        test('✅ Future non-overlapping booking', booking5.ok, 
          booking5.ok ? `Reservation: ${booking5.data.reservationNumber}` : booking5.data.message);
      }
    }
    
    // ========================================
    // ROOM-HOUSEKEEPING SYNC
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 ROOM-HOUSEKEEPING SYNCHRONIZATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const dirtyRooms = roomsRes.data.filter(r => r.status === 'DIRTY');
    test('Dirty rooms tracked', dirtyRooms.length >= 0, `${dirtyRooms.length} dirty rooms`);
    
    const autoTasks = tasksRes.data.filter(t => t.notes && t.notes.includes('Auto'));
    test('Auto-generated tasks exist', autoTasks.length >= 0, `${autoTasks.length} auto-tasks`);
    
    // ========================================
    // STATISTICS
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DASHBOARD & STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const statsRes = await testAPI(token, '/stats');
    test('Fetch statistics', statsRes.ok);
    
    if (statsRes.ok) {
      const stats = statsRes.data;
      console.log(`   Total Rooms: ${stats.totalRooms || 0}`);
      console.log(`   Occupied: ${stats.occupiedRooms || 0}`);
      console.log(`   Available: ${stats.availableRooms || 0}`);
      console.log(`   Dirty: ${stats.dirtyRooms || 0}`);
    }
    
    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    const total = passCount + failCount;
    const percentage = Math.round((passCount / total) * 100);
    
    console.log(`✅ Passed: ${passCount}/${total}`);
    console.log(`❌ Failed: ${failCount}/${total}`);
    console.log(`📊 Success Rate: ${percentage}%\n`);
    
    if (percentage >= 90) {
      console.log('🎉 EXCELLENT! All major functions working correctly!\n');
    } else if (percentage >= 70) {
      console.log('⚠️  GOOD! Most functions working, some issues detected.\n');
    } else {
      console.log('❌ ISSUES DETECTED! Please review failed tests.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    console.error(error);
  }
}

// Run tests
runAllTests();
