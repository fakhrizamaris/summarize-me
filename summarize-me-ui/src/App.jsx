import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
  const location = useLocation();
  if (!user) {
    // Redirect ke AuthPage, simpan lokasi asal
    return <AuthPage targetPath={location.pathname + location.search} />;
  }
  return children;
}

function AppContent({ user, isSidebarOpen, handleToggleSidebar }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';

  return (
    // --- PERBAIKAN 3: Hapus tag <Router> yang berlebihan di sini ---
    <div className={styles.appContainer}>
      <main className={styles.mainContentArea}>
        <Routes>
          {/* RUTE 1: Halaman Publik (Landing Page) di "/"
            Ini TIDAK dibungkus ProtectedRoute. Siapapun bisa lihat.
          */}
          <Route path="/" element={<LandingPage />} />

          {/* RUTE 2: Halaman "Aplikasi" (Dashboard) di "/app"
            INI yang kita lindungi dengan ProtectedRoute.
            Ini akan me-render HomePage Anda (halaman setelah login).
          */}
          <Route
            path="/app"
            element={
              <ProtectedRoute user={user}>
                <HomePage isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />
              </ProtectedRoute>
            }
          />

          {/* RUTE 3: Halaman Login di "/login"
            Perbarui redirect-nya agar mengarah ke "/app" jika sudah login.
          */}
          <Route path="/login" element={user ? <Navigate to="/app" replace /> : <AuthPage />} />
        </Routes>
      </main>

      {/* Footer juga menerima props agar bisa bergerak */}
      <Footer user={user} isSidebarOpen={isSidebarOpen} />

      {/* Tampilkan feedback hanya jika login dan BUKAN di halaman auth */}
      {user && !isAuthPage && <FloatingFeedback />}
    </div>
  );
}

function App() {
  const { user, isLoading } = useAuth();

  // State untuk sidebar (dipindahkan ke sini)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    // Ganti 'loadingAuth' dengan 'loading' jika Anda menamakannya 'loading' di useAuth
    return <FullPageLoader variant="dual" size="large" text="Memuat Sesi..." />;
  }

  return (
    <Router>
      <Suspense fallback={<FullPageLoader variant="dual" size="large" text="Memuat Halaman..." />}>
        {/* Kirim state dan handler sebagai props ke AppContent */}
        <AppContent user={user} isSidebarOpen={isSidebarOpen} handleToggleSidebar={handleToggleSidebar} />
      </Suspense>
    </Router>
  );
}

export default App;
