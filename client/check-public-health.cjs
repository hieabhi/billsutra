const axios = require('axios');

const API_URL = 'https://billsutra-backend-119258942950.us-central1.run.app/api/public-health-check';

async function checkHealth() {
  console.log('Checking public health endpoint...');
  try {
    const response = await axios.get(API_URL);
    console.log('Response:', response.data);
    if (response.data.db_connected) {
      console.log('✅ Database connected successfully!');
      return true;
    } else {
      console.log('❌ Database connection failed:', response.data.db_error);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
    return false;
  }
}

// Poll every 10 seconds
const interval = setInterval(async () => {
  const success = await checkHealth();
  if (success) {
    clearInterval(interval);
    console.log('Deployment verified. You can now check the frontend.');
  }
}, 10000);

checkHealth();
