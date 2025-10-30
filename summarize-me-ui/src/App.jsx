// src/App.jsx
import React, { useState } from 'react'; // <-- PERBAIKAN 1: Impor useState
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'; // <-- PERBAIKAN 2: Impor useNavigate
import { signOut } from 'firebase/auth';
import { auth } from './config/firebaseConfig';
import { useAuth } from './hooks/useAuth';

// Import halaman
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import FullPageLoader from './components/FullPageLoader/FullPageLoader'; 

// Import CSS Module
import styles from './App.module.css';

// === PERBAIKAN 3: Buat komponen 'AppContent' baru ===
// Ini diperlukan agar kita bisa menggunakan hook 'useNavigate' di dalam <Router>
function AppContent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate(); // <-- Hook navigasi

  // State baru untuk mengontrol loader saat logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true); // <-- Tampilkan loader "dual"
    try {
      await signOut(auth);
      // Tunggu 1.5 detik agar animasi terlihat
      setTimeout(() => {
        navigate('/'); // Arahkan ke halaman login
        setIsLoggingOut(false); // Sembunyikan loader
      }, 1500);
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false); // Sembunyikan loader jika gagal
    }
  };

  // Tampilkan loading saat memeriksa status auth
  if (isLoading) {
    return <FullPageLoader text="Memeriksa autentikasi..." variant="gradient" />
  }

  // Tampilkan loading "dual" saat proses logout
  if (isLoggingOut) {
    return <FullPageLoader text="Anda sedang logout..." variant="dual" />
  }

  return (
    <div className={styles.appContainer}>
      <Routes>
        {/* Rute Halaman Utama */}
        <Route 
          path="/" 
          element={<HomePage user={user} onLogout={handleLogout} />} 
        />

        {/* Rute Login - redirect ke home jika sudah login */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />}
        />

        {/* Rute Register - redirect ke home jika sudah login */}
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" />}
        />

        {/* Fallback redirect ke home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Footer Global */}
      <footer className={styles.footer}>
        <p>
          Dibuat oleh{' '}
          <a 
            href="https://github.com/fakhrizamaris" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.footerLink}
          >
            Fakhri Djamaris (GitHub)
          </a>
          {' | '}
          <a 
            href="https://www.linkedin.com/in/fakhri-djamaris" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.footerLink}
          >
            Fakhri Djamaris (LinkedIn)
          </a>
        </p>
        <p className={styles.footerAppname}>
          SummarizeMe &copy; 2025
        </p>
      </footer>
    </div>
  );
}


// === PERBAIKAN 4: Ubah fungsi App utama ===
// Bungkus AppContent dengan <Router> di sini
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;