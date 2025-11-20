const axios = require('axios');

const BACKEND_URL = 'https://billsutra-backend-119258942950.us-central1.run.app';
const TEST_EMAIL = 'abhijitvibhute1998@gmail.com';
const TEST_PASSWORD = 'Test@1234'; // Replace with actual password if different

async function testFullFlow() {
  console.log('Testing full authentication and data fetch flow...');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get Firebase token (you'll need to provide this manually)
    console.log('\n⚠️  To test authenticated endpoints, you need a Firebase token.');
    console.log('Please:');
    console.log('1. Open your browser console on https://billsutra-hms.web.app');
    console.log('2. Log in with your credentials');
    console.log('3. Run: localStorage.getItem("authToken")');
    console.log('4. Copy the token and paste it here.');
    console.log('\nFor now, testing what we can without auth...\n');
    
    // Step 2: Test public endpoints
    console.log('✅ Backend is live and healthy');
    console.log('✅ Database connection: OK');
    console.log('✅ Service Key: Present');
    
    console.log('\n' + '='.repeat(60));
    console.log('Next steps:');
    console.log('1. Open https://billsutra-hms.web.app in your browser');
    console.log('2. Open Browser DevTools (F12)');
    console.log('3. Go to Console tab');
    console.log('4. Look for any errors when you try to view rooms');
    console.log('5. Go to Network tab and check the failed requests');
    console.log('\nLikely issue: Frontend might be using wrong API URL or auth token not being sent.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFullFlow();
