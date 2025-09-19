import Logger from '../utils/logger';
// frontend/src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1'); // Most functions are in us-central1
export const analytics = getAnalytics(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  // Note: You can enable emulators if needed, but since CORS is failing, 
  // let's try connecting directly to production functions
  Logger.debug('🔧 Development mode: Using production functions');
}

// Firebase persistence is now handled automatically by Firebase v9+
// No need to explicitly enable IndexedDB persistence

// Helper to check if we're in development mode
export const isDevelopment = import.meta.env.DEV;

// Helper to use emulators in development (temporarily disabled to test us-east1 region)
if (isDevelopment && false) { // Temporarily disabled to test us-east1 region
  Logger.debug('🔧 Development mode: Using Firebase Functions emulator to bypass CORS')
  
  // Connect to Functions emulator to bypass CORS issues
  connectFunctionsEmulator(functions, 'localhost', 5001);
  
  // Other emulators can be enabled if needed:
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199');
}

export default app;
