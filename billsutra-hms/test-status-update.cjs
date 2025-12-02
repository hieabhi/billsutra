// Quick Test: Complete MAINTENANCE task and verify status update
const http = require('http');
const fs = require('fs');

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
          resolve(JSON.parse(data));
        } catch (e) {
          console.error(`Parse error from ${method} ${path}:`, data.substring(0, 100));
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  // Login
  const login = await request('POST', '/auth/login', { username: 'superadmin', password: 'admin123' });
  token = login.token;
  console.log('✅ Logged in\n');
  
  console.log('=== TESTING HOUSEKEEPING STATUS UPDATE ===\n');
  
  // Get Room 302 current state from file
  const roomsData = JSON.parse(fs.readFileSync('server/data/rooms.json', 'utf8'));
  const room302Before = roomsData.find(r => r.number === '302');
  console.log('Room 302 BEFORE:');
  console.log(`  Status: ${room302Before.status}`);
  console.log(`  Housekeeping: ${room302Before.housekeepingStatus}\n`);
  
  // Get pending MAINTENANCE task for Room 302
  const tasks = await request('GET', '/housekeeping');
  const pendingMaint = tasks.filter(t => t.roomNumber === '302' && t.type === 'MAINTENANCE' && t.status === 'PENDING');
  
  if (pendingMaint.length === 0) {
    console.log('ℹ️  No pending MAINTENANCE task for Room 302');
    console.log('Creating one for testing...\n');
    
    // Create a MAINTENANCE task
    const newTask = await request('POST', '/housekeeping', {
      roomNumber: '302',
      type: 'MAINTENANCE',
      status: 'PENDING',
      priority: 'MEDIUM',
      description: 'Test maintenance task'
    });
    console.log(`✅ Created MAINTENANCE task: ${newTask._id}\n`);
    
    // Check room status should be MAINTENANCE now
    const roomsAfterCreate = JSON.parse(fs.readFileSync('server/data/rooms.json', 'utf8'));
    const room302AfterCreate = roomsAfterCreate.find(r => r.number === '302');
    console.log(`Room status after creating MAINTENANCE task: ${room302AfterCreate.housekeepingStatus}`);
    console.log(room302AfterCreate.housekeepingStatus === 'MAINTENANCE' ? '✅ Correct\n' : '⚠️  Not updated yet\n');
    
    // Complete the task
    console.log('Completing MAINTENANCE task...');
    await request('POST', `/housekeeping/${newTask._id}/complete`, {
      notes: 'Fixed successfully - no issues'
    });
    console.log('✅ Task completed\n');
  } else {
    console.log(`Found ${pendingMaint.length} pending MAINTENANCE task(s)\n`);
    
    // Complete the first pending MAINTENANCE task
    const taskToComplete = pendingMaint[0];
    console.log(`Completing MAINTENANCE task: ${taskToComplete._id}`);
    console.log(`Description: ${taskToComplete.description}\n`);
    
    await request('POST', `/housekeeping/${taskToComplete._id}/complete`, {
      notes: 'Fixed successfully - no issues'
    });
    console.log('✅ Task completed\n');
  }
  
  // Wait a moment for file write
  await new Promise(r => setTimeout(r, 500));
  
  // Check Room 302 status after completion
  const roomsAfter = JSON.parse(fs.readFileSync('server/data/rooms.json', 'utf8'));
  const room302After = roomsAfter.find(r => r.number === '302');
  
  console.log('Room 302 AFTER:');
  console.log(`  Status: ${room302After.status}`);
  console.log(`  Housekeeping: ${room302After.housekeepingStatus}\n`);
  
  // Check for any remaining pending tasks
  const tasksAfter = await request('GET', '/housekeeping');
  const remainingTasks = tasksAfter.filter(t => t.roomNumber === '302' && t.status === 'PENDING');
  console.log(`Remaining pending tasks for Room 302: ${remainingTasks.length}`);
  if (remainingTasks.length > 0) {
    remainingTasks.forEach(t => console.log(`  - ${t.type}`));
  }
  console.log();
  
  // Verify result
  console.log('=== VERIFICATION ===');
  if (remainingTasks.length === 0 && room302After.housekeepingStatus === 'CLEAN') {
    console.log('✅ PASS: Room is CLEAN after completing all tasks');
  } else if (remainingTasks.length > 0) {
    console.log(`⚠️  Room has ${remainingTasks.length} pending tasks, status is ${room302After.housekeepingStatus}`);
    console.log('   This is CORRECT - room stays in higher priority status until all tasks done');
  } else {
    console.log(`❌ FAIL: Expected CLEAN, got ${room302After.housekeepingStatus}`);
  }
}

test().catch(err => {
  console.error('❌ Test error:', err.message);
  console.error(err.stack);
});
