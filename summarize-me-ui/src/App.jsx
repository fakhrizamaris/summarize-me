// src/App.jsx
import React, { useState, useEffect } from 'react';
// Menggunakan HashRouter untuk mengatasi masalah refresh 404 di hosting statis
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebaseConfig.js'; // PERBAIKAN: .js
import { useAuth } from './hooks/useAuth.js'; // PERBAIKAN: .js

// Import halaman dan komponen
import HomePage from './pages/HomePage.jsx'; // PERBAIKAN: .jsx
import AuthPage from './pages/AuthPage.jsx'; // PERBAIKAN: .jsx
import FullPageLoader from './components/FullPageLoader/FullPageLoader.jsx'; // PERBAIKAN: .jsx
import FloatingFeedback from './components/FloatingFeedback/FloatingFeedback.jsx'; // PERBAIKAN: .jsx

// Import CSS Module
import styles from './App.module.css'; // PERBAIKAN: .css

// Komponen AppContent untuk menggunakan hook navigasi
function AppContent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate(); 
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State untuk sidebar, dipindahkan ke sini agar bisa diakses footer
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Efek untuk menutup sidebar saat logout
  useEffect(() => {
    if (!user) {
      setIsSidebarOpen(false); // Selalu tutup sidebar saat logout
    }
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true); 
    try {
      await signOut(auth);
      // Tunda navigasi agar animasi terlihat
      setTimeout(() => {
        navigate('/'); 
        setIsLoggingOut(false); 
      }, 1500); // 1.5 detik
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false); 
    }
  };

  // Loader saat cek auth
  if (isLoading) {
    return <FullPageLoader text="Memeriksa autentikasi..." variant="dual" size="large" />
  }

  // Loader saat proses logout
  if (isLoggingOut) {
    return <FullPageLoader text="Anda sedang logout..." variant="dual" />
  }

  return (
    <div className={styles.appContainer}>
      <Routes>
        {/* Rute Halaman Utama */}
        <Route 
          path="/" 
          // Kirim state dan fungsi toggle ke HomePage
          element={<HomePage 
            user={user} 
            onLogout={handleLogout}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />} 
        />

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

      {/* Footer Global (Bergeser saat sidebar terbuka) */}
      {/* Footer hanya tampil jika user login */}
      {user && (
        <footer className={`${styles.footer} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
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
      )}
      
      {/* Komponen Feedback Melayang */}
      <FloatingFeedback user={user} />
    </div>
  );
}

// App utama sekarang hanya merender Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

