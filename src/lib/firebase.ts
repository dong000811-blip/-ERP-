import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// HARDCODED CONFIGURATION for Vercel troubleshooting
const firebaseConfig = {
  apiKey: "AIzaSyDf4iJA5g4iAO0U8Y4a1DK0TwQxLiR3hFk",
  authDomain: "shelter-erp.firebaseapp.com",
  projectId: "shelter-erp",
  storageBucket: "shelter-erp.firebasestorage.app",
  messagingSenderId: "530592332450",
  appId: "1:530592332450:web:2f04da7818533d1c13f5fb",
  measurementId: "G-S02XJ1XYTX",
};

console.log("Firebase Config Mode: HARDCODED");

const NAVER_MAPS_KEY_ID = "aiiii8qhjj";

console.log("Naver Maps Key ID integrated:", !!NAVER_MAPS_KEY_ID);

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

// Set persistence explicitly to browserLocalPersistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set to local.");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });
