// Test: Housekeeping Duplicate Prevention
// Verifies that only ONE active task per room per type can exist

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
  console.log('✅ Logged in, token:', token ? token.substring(0, 20) + '...' : 'NONE');
}

async function testDuplicatePrevention() {
  console.log('\n=== TESTING DUPLICATE PREVENTION ===\n');
  console.log('Current token:', token ? token.substring(0, 20) + '...' : 'NONE');
  
  // Get all housekeeping tasks
  let tasks = await request('GET', '/housekeeping');
  
  if (!Array.isArray(tasks)) {
    console.error('❌ FAILED: Response is not an array');
    console.error('Response:', tasks);
    return;
  }
  
  const initialCount = tasks.length;
  console.log(`Initial task count: ${initialCount}`);
  
  // Find Room 302's current pending cleaning task
  const room302Tasks = tasks.filter(t => t.roomNumber === '302' && t.type === 'CLEANING' && t.status === 'PENDING');
  console.log(`Room 302 PENDING CLEANING tasks: ${room302Tasks.length}`);
  
  if (room302Tasks.length !== 1) {
    console.log('❌ FAILED: Should have exactly 1 pending cleaning task after cleanup');
    return;
  }
  
  const existingTaskId = room302Tasks[0]._id;
  console.log(`Existing task ID: ${existingTaskId}`);
  
  // Try to create a duplicate CLEANING task for Room 302
  console.log('\n--- Attempting to create duplicate CLEANING task ---');
  const newTask = await request('POST', '/housekeeping', {
    roomNumber: '302',
    type: 'CLEANING',
    status: 'PENDING',
    priority: 'MEDIUM',
    description: 'Duplicate test - should not create'
  });
  
  console.log('Response:', JSON.stringify(newTask, null, 2));
  console.log(`Returned task ID: ${newTask._id || newTask.id || newTask.taskId || 'NONE'}`);
  
  // Verify it returned the existing task, not a new one
  const returnedId = newTask._id || newTask.id || newTask.taskId;
  if (returnedId === existingTaskId) {
    console.log('✅ PASS: Duplicate prevented - returned existing task');
  } else {
    console.log('❌ FAILED: Created duplicate task instead of returning existing');
    return;
  }
  
  // Get all tasks again and verify count didn't increase
  tasks = await request('GET', '/housekeeping');
  const finalCount = tasks.length;
  
  console.log(`Final task count: ${finalCount}`);
  
  if (finalCount === initialCount) {
    console.log('✅ PASS: Task count unchanged - no duplicate created');
  } else {
    console.log(`❌ FAILED: Task count increased from ${initialCount} to ${finalCount}`);
    return;
  }
  
  // Test HIGH priority upgrade
  console.log('\n--- Testing priority upgrade on existing task ---');
  const upgradedTask = await request('POST', '/housekeeping', {
    roomNumber: '302',
    type: 'CLEANING',
    status: 'PENDING',
    priority: 'HIGH',
    description: 'URGENT: VIP guest arriving soon',
    nextArrivalTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  });
  
  if (upgradedTask._id === existingTaskId && upgradedTask.priority === 'HIGH') {
    console.log('✅ PASS: Existing task upgraded to HIGH priority');
    console.log(`   Description updated: ${upgradedTask.description}`);
  } else {
    console.log('❌ FAILED: Priority upgrade did not work correctly');
    return;
  }
  
  // Test that different task type CAN be created (MAINTENANCE)
  console.log('\n--- Testing different task type (MAINTENANCE) ---');
  const maintenanceTask = await request('POST', '/housekeeping', {
    roomNumber: '302',
    type: 'MAINTENANCE',
    status: 'PENDING',
    priority: 'MEDIUM',
    description: 'Fix leaky faucet'
  });
  
  if (maintenanceTask._id !== existingTaskId && maintenanceTask.type === 'MAINTENANCE') {
    console.log('✅ PASS: Different task type (MAINTENANCE) created successfully');
    console.log(`   New task ID: ${maintenanceTask._id}`);
  } else {
    console.log('❌ FAILED: Should allow different task types for same room');
    return;
  }
  
  // Verify Room 302 now has 1 CLEANING + 1 MAINTENANCE
  tasks = await request('GET', '/housekeeping');
  
  const room302Cleaning = tasks.filter(t => t.roomNumber === '302' && t.type === 'CLEANING' && t.status === 'PENDING');
  const room302Maintenance = tasks.filter(t => t.roomNumber === '302' && t.type === 'MAINTENANCE' && t.status === 'PENDING');
  
  console.log(`\nRoom 302 final state:`);
  console.log(`  CLEANING (PENDING): ${room302Cleaning.length}`);
  console.log(`  MAINTENANCE (PENDING): ${room302Maintenance.length}`);
  
  if (room302Cleaning.length === 1 && room302Maintenance.length === 1) {
    console.log('✅ PASS: Correct - 1 active task per type allowed');
  } else {
    console.log('❌ FAILED: Should have 1 CLEANING and 1 MAINTENANCE task');
    return;
  }
  
  console.log('\n=== ALL TESTS PASSED ===');
  console.log('✅ Duplicate prevention working as per industry standards');
  console.log('✅ Priority upgrade working correctly');
  console.log('✅ Multiple task types per room allowed');
}

async function run() {
  try {
    await login();
    await testDuplicatePrevention();
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

run();
