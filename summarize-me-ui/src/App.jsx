// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebaseConfig';
import { useAuth } from './hooks/useAuth';

// Import halaman
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import FullPageLoader from './components/FullPageLoader/FullPageLoader'; // <-- GANTI IMPORT
// import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner'; // <-- Hapus ini

// Import CSS Module
import styles from './App.module.css';

function App() {
  const { user, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Tampilkan loading saat memeriksa status auth
  if (isLoading) {
    // === PERBAIKAN: Gunakan FullPageLoader untuk loading awal ===
    return <FullPageLoader text="Memeriksa autentikasi..." variant="pulse" />
  }

  return (
    <Router>
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
    </Router>
  );
}

export default App;