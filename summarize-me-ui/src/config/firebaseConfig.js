// Impor fungsi 'initializeApp' dari library firebase
import { initializeApp } from "firebase/app"; 
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBWPMqlh_TXupl6acRDjV8qdQ0NkSukPxE",
  authDomain: "summarizeme-project.firebaseapp.com",
  projectId: "summarizeme-project",
  storageBucket: "summarizeme-project.firebasestorage.app",
  messagingSenderId: "23978195141",
  appId: "1:23978195141:web:67bcc2ffc05176b42fd8ac",
  measurementId: "G-7G8F5VTCVV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

// Ekspor 'auth' dan 'googleProvider' agar bisa kita pakai di file lain
export { auth, analytics, googleProvider };