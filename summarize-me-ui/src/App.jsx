// src/App.jsx
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import styles from './App.module.css';
import Footer from './components/Footer/Footer.jsx';

// Import komponen
import FullPageLoader from './components/FullPageLoader/FullPageLoader.jsx';
import FloatingFeedback from './components/FloatingFeedback/FloatingFeedback.jsx';

// Lazy load pages
const HomePage = React.lazy(() => import('./pages/HomePage.jsx'));
const AuthPage = React.lazy(() => import('./pages/AuthPage.jsx'));
const LandingPage = React.lazy(() => import('./pages/LandingPage.jsx'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage.jsx'));

// Komponen ProtectedRoute
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Komponen untuk redirect jika sudah login
function AuthRoute({ user, children }) {
  if (user) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

function AppContent({ user, isSidebarOpen, handleToggleSidebar }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={styles.appContainer}>
      <main className={styles.mainContentArea}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <AuthRoute user={user}>
                <AuthPage />
              </AuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoute user={user}>
                <AuthPage />
              </AuthRoute>
            }
          />

          <Route
            path="/lupa-password"
            element={
              <AuthRoute user={user}>
                <ForgotPasswordPage />
              </AuthRoute>
            }
          />

          <Route path="/reset-kata-sandi" element={<ResetPasswordPage />} />  

          <Route
            path="/app"
            element={
              <ProtectedRoute user={user}>
                <HomePage isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} user={user} />
              </ProtectedRoute>
            }
          />

          <Route path="/home" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </main>

      <Footer user={user} isSidebarOpen={isSidebarOpen} />
      {user && !isAuthPage && <FloatingFeedback />}
    </div>
  );
}

function App() {
  const { user, isLoading } = useAuth();

  // ✅ PERBAIKAN 2: State sidebar dengan cleanup proper
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Initialize dari window width, tapi handle SSR
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024;
    }
    return false;
  });

  // ✅ PERBAIKAN 3: Handle window resize dengan proper cleanup
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Loading state saat cek autentikasi
  if (isLoading) {
    return <FullPageLoader variant="dual" size="large" text="Memuat Sesi..." />;
  }

  return (
    <Router>
      <Suspense fallback={<FullPageLoader variant="dual" size="large" text="Memuat Halaman..." />}>
        <AppContent user={user} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} />
      </Suspense>
    </Router>
  );
}

export default App;