// src/config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics"; // Uncomment jika dipakai

// Gunakan environment variables Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Opsional
};

// Validasi sederhana (opsional)
if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing. Make sure VITE_FIREBASE_API_KEY is set in your .env file.");
}


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const analytics = getAnalytics(app); // Uncomment jika dipakai
const googleProvider = new GoogleAuthProvider();

// Sesuaikan ekspor jika analytics tidak dipakai
export { auth, /* analytics, */ googleProvider };