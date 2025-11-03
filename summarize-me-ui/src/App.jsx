// src/App.jsx
import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  const location = window.location.pathname;
  const isAuthPage = location === '/login' || location === '/register';

  return (
    <div className={styles.appContainer}>
      <main className={styles.mainContentArea}>
        <Routes>
          {/* RUTE 1: Landing Page (Publik) */}
          <Route path="/" element={<LandingPage />} />

          {/* RUTE 2: Login Page */}
          <Route
            path="/login"
            element={
              <AuthRoute user={user}>
                <AuthPage />
              </AuthRoute>
            }
          />

          {/* RUTE 3: Register Page */}
          <Route
            path="/register"
            element={
              <AuthRoute user={user}>
                <AuthPage />
              </AuthRoute>
            }
          />

          {/* RUTE 4: Dashboard/App (Protected) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute user={user}>
                <HomePage isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />
              </ProtectedRoute>
            }
          />

          {/* RUTE 5: Redirect /home ke /app untuk backward compatibility */}
          <Route path="/home" element={<Navigate to="/app" replace />} />

          {/* RUTE 6: 404 - Not Found */}
          <Route
            path="*"
            element={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '100vh',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <h1 style={{ fontSize: '4em', marginBottom: '0.2em' }}>404</h1>
                <p style={{ fontSize: '1.2em', marginBottom: '2em', opacity: 0.8 }}>Halaman tidak ditemukan</p>
                <a
                  href="/"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                >
                  Kembali ke Beranda
                </a>
              </div>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <Footer user={user} isSidebarOpen={isSidebarOpen} />

      {/* Floating Feedback - hanya tampil jika login dan bukan di auth page */}
      {user && !isAuthPage && <FloatingFeedback />}
    </div>
  );
}

function App() {
  const { user, isLoading } = useAuth();

  // State untuk sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 1024 : false);

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
