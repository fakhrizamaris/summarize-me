// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebaseConfig';
import { useAuth } from './hooks/useAuth'; // Import hook

// Import halaman dari lokasi baru
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';

// Impor CSS Module jika ingin styling App container
import styles from './App.module.css'; // Buat file App.module.css jika perlu

function App() {
  const { user, isLoading } = useAuth(); // Gunakan hook

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Tidak perlu navigate, perubahan state `user` akan handle redirect
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Tampilkan loading spinner global saat status auth belum jelas
  if (isLoading) {
    return (
      <div className={styles.initialLoadingContainer}> {/* Gunakan class CSS */}
        <LoadingSpinner />
        <p>Memuat aplikasi...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className={styles.appContainer}> {/* Optional container */}
        <Routes>
          {/* Rute Halaman Utama */}
          {/* Perhatikan: HomePage sekarang menerima user langsung */}
          <Route path="/" element={<HomePage user={user} onLogout={handleLogout} />} />

          {/* Rute Login */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />}
          />

          {/* Rute Register */}
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" />}
          />

          {/* Fallback redirect ke home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Footer dipindah ke sini */}
        <footer className={styles.footer}>
          <p>
            Dibuat oleh{' '}
            <a href="https://github.com/fakhrizamaris" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              Fakhri Djamaris (GitHub)
            </a>
            {' | '}
            <a href="https://www.linkedin.com/in/fakhri-djamaris" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
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