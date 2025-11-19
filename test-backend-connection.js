import fetch from 'node-fetch';

const BACKEND_URL = 'https://billsutra-backend-119258942950.us-central1.run.app';

console.log('🧪 Testing backend connection...\n');

// Test 1: Check if backend is accessible
console.log('Test 1: Backend health check');
try {
  const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
    method: 'GET'
  });
  
  console.log('Status:', response.status);
  const data = await response.text();
  console.log('Response:', data);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n---\n');

// Test 2: Try to fetch rooms without auth (should fail with 401)
console.log('Test 2: Fetch rooms without auth (should return 401)');
try {
  const response = await fetch(`${BACKEND_URL}/api/rooms`, {
    method: 'GET'
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n---\n');

// Test 3: Check backend logs for Firebase initialization
console.log('Test 3: Basic GET request to see if backend responds');
try {
  const response = await fetch(BACKEND_URL, {
    method: 'GET'
  });
  
  console.log('Status:', response.status);
  const data = await response.text();
  console.log('Response:', data.substring(0, 200));
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n✅ Tests complete');
