// Test: Housekeeping Status Update on Task Completion
// Verifies that room housekeeping status updates correctly when tasks are completed

const http = require('http');

const BASE = 'http://127.0.0.1:5051/api';
let token = '';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          console.error(`Failed to parse response from ${method} ${path}`);
          console.error(`Raw data: ${data.substring(0, 200)}`);
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login() {
  const data = await request('POST', '/auth/login', { username: 'superadmin', password: 'admin123' });
  token = data.token;
  console.log('✅ Logged in\n');
}

async function testHousekeepingStatusUpdate() {
  console.log('=== TESTING HOUSEKEEPING STATUS UPDATE ===\n');
  
  // Get all rooms
  const rooms = await request('GET', '/rooms');
  console.log(`Found ${rooms.length} rooms`);
  
  // Use any AVAILABLE + CLEAN room for testing
  const testRoom = rooms.find(r => r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN');
  
  if (!testRoom) {
    console.log('❌ No AVAILABLE + CLEAN room found for testing');
    console.log('Available rooms:', rooms.map(r => `${r.number}: ${r.status}/${r.housekeepingStatus}`).join(', '));
    return;
  }
  
  console.log(`Test Room: ${testRoom.number}`);
  console.log(`Initial Status: ${testRoom.status} | HK: ${testRoom.housekeepingStatus}\n`);
  
  // Scenario 1: Mark room as DIRTY, create CLEANING task, complete it → Should become CLEAN
  console.log('--- Scenario 1: CLEANING Task ---');
  
  // Mark room dirty
  await request('PATCH', `/rooms/${testRoom._id}`, { housekeepingStatus: 'DIRTY' });
  console.log('✓ Marked room as DIRTY');
  
  // Create CLEANING task
  const cleanTask = await request('POST', '/housekeeping', {
    roomNumber: testRoom.number,
    roomId: testRoom._id,
    type: 'CLEANING',
    status: 'PENDING',
    priority: 'MEDIUM',
    description: 'Test cleaning task'
  });
  console.log(`✓ Created CLEANING task: ${cleanTask._id}`);
  
  // Complete CLEANING task
  await request('POST', `/housekeeping/${cleanTask._id}/complete`, {
    notes: 'Room cleaned successfully'
  });
  console.log('✓ Completed CLEANING task');
  
  // Check room status
  const roomAfterCleaning = await request('GET', `/rooms/${testRoom._id}`);
  console.log(`Room status after CLEANING: ${roomAfterCleaning.status} | HK: ${roomAfterCleaning.housekeepingStatus}`);
  
  if (roomAfterCleaning.housekeepingStatus === 'CLEAN') {
    console.log('✅ PASS: Room is CLEAN after CLEANING task completed\n');
  } else {
    console.log(`❌ FAIL: Expected CLEAN, got ${roomAfterCleaning.housekeepingStatus}\n`);
    return;
  }
  
  // Scenario 2: Create MAINTENANCE task, complete it → Should stay CLEAN (no other tasks)
  console.log('--- Scenario 2: MAINTENANCE Task (No Other Tasks) ---');
  
  const maintTask = await request('POST', '/housekeeping', {
    roomNumber: testRoom.number,
    roomId: testRoom._id,
    type: 'MAINTENANCE',
    status: 'PENDING',
    priority: 'MEDIUM',
    description: 'Fix door lock'
  });
  console.log(`✓ Created MAINTENANCE task: ${maintTask._id}`);
  
  // Room should now be in MAINTENANCE status
  const roomDuringMaint = await request('GET', `/rooms/${testRoom._id}`);
  console.log(`Room status during MAINTENANCE task: ${roomDuringMaint.status} | HK: ${roomDuringMaint.housekeepingStatus}`);
  
  // Complete MAINTENANCE task
  await request('POST', `/housekeeping/${maintTask._id}/complete`, {
    notes: 'Door lock fixed'
  });
  console.log('✓ Completed MAINTENANCE task');
  
  // Check room status
  const roomAfterMaint = await request('GET', `/rooms/${testRoom._id}`);
  console.log(`Room status after MAINTENANCE: ${roomAfterMaint.status} | HK: ${roomAfterMaint.housekeepingStatus}`);
  
  if (roomAfterMaint.housekeepingStatus === 'CLEAN') {
    console.log('✅ PASS: Room is CLEAN after MAINTENANCE completed (no other pending tasks)\n');
  } else {
    console.log(`❌ FAIL: Expected CLEAN, got ${roomAfterMaint.housekeepingStatus}\n`);
    return;
  }
  
  // Scenario 3: Create CLEANING + MAINTENANCE tasks, complete only CLEANING → Should stay MAINTENANCE
  console.log('--- Scenario 3: CLEANING + MAINTENANCE Tasks ---');
  
  // Mark room dirty again
  await request('PATCH', `/rooms/${testRoom._id}`, { housekeepingStatus: 'DIRTY' });
  console.log('✓ Marked room as DIRTY');
  
  const cleanTask2 = await request('POST', '/housekeeping', {
    roomNumber: testRoom.number,
    roomId: testRoom._id,
    type: 'CLEANING',
    status: 'PENDING',
    priority: 'MEDIUM',
    description: 'Clean room'
  });
  
  const maintTask2 = await request('POST', '/housekeeping', {
    roomNumber: testRoom.number,
    roomId: testRoom._id,
    type: 'MAINTENANCE',
    status: 'PENDING',
    priority: 'MEDIUM',
    description: 'Fix AC'
  });
  
  console.log(`✓ Created CLEANING task: ${cleanTask2._id}`);
  console.log(`✓ Created MAINTENANCE task: ${maintTask2._id}`);
  
  // Complete CLEANING task first
  await request('POST', `/housekeeping/${cleanTask2._id}/complete`, {
    notes: 'Room cleaned'
  });
  console.log('✓ Completed CLEANING task');
  
  // Check room status - should be MAINTENANCE because MAINTENANCE task is still pending
  const roomAfterCleanWithPendingMaint = await request('GET', `/rooms/${testRoom._id}`);
  console.log(`Room status after CLEANING (with pending MAINTENANCE): ${roomAfterCleanWithPendingMaint.status} | HK: ${roomAfterCleanWithPendingMaint.housekeepingStatus}`);
  
  if (roomAfterCleanWithPendingMaint.housekeepingStatus === 'MAINTENANCE') {
    console.log('✅ PASS: Room stays MAINTENANCE when MAINTENANCE task is still pending\n');
  } else {
    console.log(`❌ FAIL: Expected MAINTENANCE, got ${roomAfterCleanWithPendingMaint.housekeepingStatus}\n`);
    return;
  }
  
  // Complete MAINTENANCE task
  await request('POST', `/housekeeping/${maintTask2._id}/complete`, {
    notes: 'AC fixed'
  });
  console.log('✓ Completed MAINTENANCE task');
  
  // Check room status - should now be CLEAN
  const roomFinal = await request('GET', `/rooms/${testRoom._id}`);
  console.log(`Room status after all tasks completed: ${roomFinal.status} | HK: ${roomFinal.housekeepingStatus}`);
  
  if (roomFinal.housekeepingStatus === 'CLEAN') {
    console.log('✅ PASS: Room is CLEAN after all tasks completed\n');
  } else {
    console.log(`❌ FAIL: Expected CLEAN, got ${roomFinal.housekeepingStatus}\n`);
    return;
  }
  
  console.log('=== ALL TESTS PASSED ===');
  console.log('✅ Housekeeping status updates correctly on task completion');
  console.log('✅ CLEANING task → CLEAN status');
  console.log('✅ MAINTENANCE task (no other tasks) → CLEAN status');
  console.log('✅ CLEANING task (with pending MAINTENANCE) → MAINTENANCE status');
  console.log('✅ All tasks completed → CLEAN status');
}

async function run() {
  try {
    await login();
    await testHousekeepingStatusUpdate();
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  }
}

run();
