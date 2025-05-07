// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, Database, connectDatabaseEmulator } from 'firebase/database';
import { FirebaseApp } from 'firebase/app';

// Add debug flags
const isFirebaseDebug = process.env.REACT_APP_ENABLE_FIREBASE_DEBUG === 'true';
const isLocalEmulator = process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true';

if (isFirebaseDebug) {
  console.log("Firebase debugging enabled");
  if (isLocalEmulator) {
    console.log("Using local Firebase emulators");
  }
}

// Add this troubleshooting code
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    // Try all possible database URLs until one works
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || 
                 "https://crash-game-3fb3a-default-rtdb.asia-southeast1.firebasedatabase.app/" ||
                 "https://crash-game-3fb3a-default-rtdb.firebaseio.com/" ||
                 "https://crash-game-3fb3a.firebaseio.com/"
  };
  
  console.log("Using database URL:", firebaseConfig.databaseURL);

// Log config for debugging (with sensitive information masked)
if (isFirebaseDebug) {
  const debugConfig = {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? "***" : undefined,
    appId: firebaseConfig.appId ? "***" : undefined
  };
  console.log("Firebase Config:", debugConfig);
}

// Initialize Firebase variables with explicit types
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let database: Database;

try {
  console.log("Initializing Firebase app...");
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
  
  auth = getAuth(app);
  firestore = getFirestore(app);
  database = getDatabase(app);
  
  // Connect to emulators if in development mode
  if (isLocalEmulator && process.env.NODE_ENV === 'development') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectDatabaseEmulator(database, 'localhost', 9000);
    console.log("Connected to local Firebase emulators");
  }
  
  console.log("Firebase services initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error; // Re-throw to make the error visible
}

// Firebase initialization status for other components to check
export const isFirebaseInitialized = Boolean(app && auth && database);

// Export the variables after initialization
export { app, auth, firestore, database };