// src/App.jsx
import React, { useState, useEffect } from 'react'; // <-- PERBAIKAN: Impor useEffect
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebaseConfig';
import { useAuth } from './hooks/useAuth';

// Import halaman
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import FullPageLoader from './components/FullPageLoader/FullPageLoader';
import FloatingFeedback from './components/FloatingFeedback/FloatingFeedback';

// Import CSS Module
import styles from './App.module.css';

function AppContent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate(); 
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // === PERBAIKAN 1: Pindahkan state dan fungsi toggle ke sini ===
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
  // === AKHIR PERBAIKAN 1 ===

  const handleLogout = async () => {
    setIsLoggingOut(true); 
    try {
      await signOut(auth);
      setTimeout(() => {
        navigate('/login'); 
        setIsLoggingOut(false); 
      }, 1500);
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false); 
    }
  };

  if (isLoading) {
    return <FullPageLoader text="Memeriksa autentikasi..." variant="dual" size="large" />
  }
  if (isLoggingOut) {
    return <FullPageLoader text="Anda sedang logout..." variant="dual" />
  }

  return (
    <div className={styles.appContainer}>
      <Routes>
        {/* Rute Halaman Utama */}
        <Route 
          path="/" 
          // === PERBAIKAN 2: Kirim state dan fungsi toggle ke HomePage ===
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

      {/* Footer Global */}
      {/* === PERBAIKAN 3: Sembunyikan footer jika !user & tambahkan class === */}
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
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;