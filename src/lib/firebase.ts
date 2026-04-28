import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import firebaseConfig from "../../firebase-applet-config.json";

// Safeguard: Check if critical config members are present
const requiredFields: (keyof typeof firebaseConfig)[] = ['apiKey', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  const msg = `CRITICAL: Firebase configuration is missing required fields: ${missingFields.join(", ")}`;
  console.error(msg, firebaseConfig);
  if (typeof window !== 'undefined') {
    alert(msg);
  }
}

// Debug: Log the config being used (redacted sensitive parts if necessary, but here we want to be sure)
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
}, (firebaseConfig as any).firestoreDatabaseId || "(default)");

console.log("Firestore instance created for database:", (firebaseConfig as any).firestoreDatabaseId || "(default)");

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
