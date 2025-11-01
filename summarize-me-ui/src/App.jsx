// fakhrizamaris/summarize-me/summarize-me-7ba45f561c515ef95fb7899363fcf68c76c9f33f/summarize-me-ui/src/App.jsx

// --- PERBAIKAN 1: Tambahkan 'useState' ke import ---
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

// Komponen ProtectedRoute
function ProtectedRoute({ user, children }) {
  const location = useLocation();
  if (!user) {
    // Redirect ke AuthPage, simpan lokasi asal
    return <AuthPage targetPath={location.pathname + location.search} />;
  }
  return children;
}

// --- PERBAIKAN 2: Terima props 'isSidebarOpen' dan 'handleToggleSidebar' ---
function AppContent({ isSidebarOpen, handleToggleSidebar }) {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = location.pathname === '/login';

  return (
    // --- PERBAIKAN 3: Hapus tag <Router> yang berlebihan di sini ---
    <div className={styles.appContainer}>
      <main className={styles.mainContentArea}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                {/* Kita teruskan props-nya lagi ke HomePage */}
                <HomePage 
                  isSidebarOpen={isSidebarOpen} 
                  onToggleSidebar={handleToggleSidebar} 
                />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <AuthPage />} 
          />
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
  const { user, loadingAuth, errorAuth } = useAuth();

  // State untuk sidebar (dipindahkan ke sini)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loadingAuth) {
    // Ganti 'loadingAuth' dengan 'loading' jika Anda menamakannya 'loading' di useAuth
    return <FullPageLoader variant="dual" size="large" text="Memuat Sesi..." />;
  }

  if (errorAuth) {
    console.error('Auth Error:', errorAuth);
    return (
      <div className={styles.errorFallback}>
        <h2>Terjadi Kesalahan Autentikasi</h2>
        <p>{errorAuth.message || 'Tidak dapat terhubung ke layanan autentikasi. Silakan refresh halaman.'}</p>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<FullPageLoader variant="dual" size="large" text="Memuat Halaman..." />}>
        {/* Kirim state dan handler sebagai props ke AppContent */}
        <AppContent 
          isSidebarOpen={isSidebarOpen} 
          handleToggleSidebar={handleToggleSidebar} 
        />
      </Suspense>
    </Router>
  );
}

export default App;