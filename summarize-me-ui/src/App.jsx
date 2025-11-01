import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js'; 
import styles from './App.module.css';

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

// Komponen AppContent (tempat perbaikan)
function AppContent() {
  const location = useLocation();

  // Ambil user dari hook.
  // Kita perlu ini untuk menentukan apakah FloatingFeedback boleh tampil.
  const { user } = useAuth();

  // Tentukan apakah navbar/feedback harus disembunyikan
  // Sembunyikan jika kita di AuthPage ('/login')
  const isAuthPage = location.pathname === '/login';

  return (
    <>
      <Routes>
        {/* Rute publik (Landing Page) */}
        {/* Catatan: File HomePage.jsx Anda saat ini menampilkan konten 
          berbeda berdasarkan status login (user). 
          Ini berarti HomePage menangani logika publik (landing) 
          dan privat (aplikasi) dalam satu file.
        */}
        <Route path="/" element={<HomePage />} />

        {/* Rute otentikasi (Halaman Login) */}
        <Route path="/login" element={<AuthPage />} />

        {/* Rute yang dilindungi (Contoh: /dashboard) */}
        {/* Jika Anda ingin / (HomePage) dilindungi, pindahkan ke sini */}
        {/* <Route 
          path="/" 
          element={
            <ProtectedRoute user={user}>
              <HomePage />
            </ProtectedRoute>
          } 
        /> */}
      </Routes>

      {/* ==================================================================
        === PERBAIKAN 1: FLOATING FEEDBACK ===
        ==================================================================
        Tambahkan kondisi 'user && !isAuthPage'.
        Ini memastikan FloatingFeedback HANYA muncul jika:
        1. User SUDAH LOGIN (user)
        2. User TIDAK sedang di halaman /login (!isAuthPage)
      */}
      {user && !isAuthPage && <FloatingFeedback />}
    </>
  );
}

function App() {
  const { user, loadingAuth, errorAuth } = useAuth();

  // if (loadingAuth) {
  //   return <FullPageLoader variant="dual" size="large" text="Autentikasi..." />;
  // }

  if (errorAuth) {
    console.error('Auth Error:', errorAuth);
    return (
      <div className={styles.errorFallback}>
        <h2>Terjadi Kesalahan Autentikasi</h2>
        <p>{errorAuth.message || 'Tidak dapat terhubung ke layanan autentikasi. Silakan refresh halaman.'}</p>
      </div>
    );
  }

  // Passing 'user' dan 'loadingAuth' ke AppContent via Context (useAuth)
  // Jadi AppContent bisa mengaksesnya
  return (
    <Router>
      <Suspense fallback={<FullPageLoader variant="dual" size="large" text="Memuat Halaman..." />}>
        <AppContent />
      </Suspense>
    </Router>
  );
}

export default App;
