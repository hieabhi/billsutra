import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlwGtAenJBe9FJYplLO4yMpt-Cm1TWmTw",
  authDomain: "billsutra-hms.firebaseapp.com",
  projectId: "billsutra-hms",
  storageBucket: "billsutra-hms.firebasestorage.app",
  messagingSenderId: "119258942950",
  appId: "1:119258942950:web:7567595dc1938b8fceda27",
  measurementId: "G-J9KDM494SX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
