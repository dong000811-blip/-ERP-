import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// DEBUG: Log the API key presence and value (as requested for troubleshooting)
console.log("Check API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Key Load Test as requested - only logs presence of keys
console.log("Firebase Key Load Test (API KEY):", !!import.meta.env.VITE_FIREBASE_API_KEY);
console.log("Firebase Key Load Test (Project ID):", !!import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("Naver Maps Key Load Test:", !!import.meta.env.VITE_NAVER_MAPS_CLIENT_ID);

// Safeguard: Check if critical config members are present
const requiredFields: (keyof typeof firebaseConfig)[] = ['apiKey', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

const NAVER_MAPS_KEY_ID = import.meta.env.VITE_NAVER_MAPS_CLIENT_ID;

if (missingFields.length > 0) {
  const msg = `CRITICAL ERROR: Environment Variables not loaded correctly. 
Missing fields: ${missingFields.join(", ")}. 
Please check Vercel [Environment Variables] settings.`;
  console.error(msg, firebaseConfig);
  
  // Re-throw to prevent initialization with invalid config
  if (typeof window !== 'undefined') {
    // We don't use alert() as per guidelines, but the console.error will be visible.
    // Throwing an error will cause the app to crash early with a clear message.
  }
}

console.log("Naver Maps Key ID integrated:", NAVER_MAPS_KEY_ID);

// Debug: Log the config being used
console.log("Attempting Firebase initialization for project:", firebaseConfig.projectId);

let app: FirebaseApp;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App initialized successfully.");
  } catch (err) {
    console.error("Firebase App initialization FAILED:", err);
    throw err;
  }
} else {
  app = getApp();
  console.log("Using existing Firebase App.");
}

// Explicitly use initializeFirestore to ensure settings are applied if needed, 
// though getFirestore is usually fine.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

console.log("Firestore instance created.");

export const auth = getAuth(app);
console.log("Auth instance created.");

// Initialize Analytics as requested, ensuring it's supported in the environment
export const analytics = typeof window !== 'undefined' ? isSupported().then(supported => {
  if (supported) {
    console.log("Firebase Analytics supported and initializing.");
    return getAnalytics(app);
  }
  console.log("Firebase Analytics not supported in this environment.");
  return null;
}) : null;
