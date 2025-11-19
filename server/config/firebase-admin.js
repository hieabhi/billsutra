import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Firebase Admin SDK
try {
  let credential;
  
  // Check if Firebase service account JSON is provided in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Using Firebase service account from environment variable');
  } else {
    // Fallback to application default credentials (for local development)
    credential = admin.credential.applicationDefault();
    console.log('✅ Using Firebase application default credentials');
  }

  admin.initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'billsutra-hms'
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  throw error;
}

export default admin;
