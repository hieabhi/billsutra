const axios = require('axios');

const BACKEND_URL = 'https://billsutra-backend-119258942950.us-central1.run.app';

async function testBackend() {
  console.log('Testing live backend at:', BACKEND_URL);
  console.log('='.repeat(60));
  
  try {
    // Test 1: Root endpoint
    console.log('\n1. Testing root endpoint...');
    const rootRes = await axios.get(BACKEND_URL);
    console.log('✅ Root:', rootRes.data);
  } catch (error) {
    console.log('❌ Root failed:', error.message);
  }
  
  try {
    // Test 2: Public health check
    console.log('\n2. Testing public health check...');
    const healthRes = await axios.get(`${BACKEND_URL}/api/public-health-check`);
    console.log('✅ Health:', healthRes.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
  
  try {
    // Test 3: Rooms endpoint (should fail without auth)
    console.log('\n3. Testing rooms endpoint (without auth)...');
    const roomsRes = await axios.get(`${BACKEND_URL}/api/rooms`);
    console.log('✅ Rooms (no auth):', roomsRes.data);
  } catch (error) {
    console.log('❌ Rooms (no auth) failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Expected: 401 (Unauthorized)');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Backend tests complete.');
}

testBackend();
