// src/config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- 1. IMPORT FUNGSI FIRESTORE
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID && {
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  })
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing. Make sure VITE_FIREBASE_API_KEY is set in your .env file.");
}
// ---------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // <-- 2. INISIALISASI FIRESTORE DB
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

// Ekspor 'auth', 'analytics', 'googleProvider', DAN 'db'
export { auth, analytics, googleProvider, db }; // <-- 3. TAMBAHKAN 'db' DI SINI