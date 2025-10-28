// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './config/firebaseConfig'; // [cite: fakhrizamaris/summarize-me/summarize-me-534b62be55a4969aab39405b2ef61d0fa675d49a/summarize-me-ui/src/config/firebaseConfig.js]
import { signOut, onAuthStateChanged } from 'firebase/auth';

// Impor halaman-halaman
import HomePage from './HomePage'; // [cite: fakhrizamaris/summarize-me/summarize-me-534b62be55a4969aab39405b2ef61d0fa675d49a/summarize-me-ui/src/HomePage.jsx]
import AuthPage from './AuthPage'; // [cite: fakhrizamaris/summarize-me/summarize-me-534b62be55a4969aab39405b2ef61d0fa675d49a/summarize-me-ui/src/AuthPage.jsx]
import LoadingSpinner from './components/LoadingSpinner'; // Pastikan path benar


function InitialLoadingScreen() {
  return (
    <div className="initial-loading-container"> {/* Gunakan class CSS */}
      <LoadingSpinner />
      <p>Memuat aplikasi...</p>
    </div>
  );
}

// Helper component untuk cek auth state di route "/"
function HomePageWrapper({ onLogout }) {
    const [user, setUser] = useState(auth.currentUser);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (isLoading) return <InitialLoadingScreen />;
    return <HomePage user={user} onLogout={onLogout} />;
}

// Helper component untuk redirect dari /login atau /register jika sudah login
function AuthRedirectWrapper({ children }) {
     const [user, setUser] = useState(auth.currentUser);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (isLoading) return <div>Loading...</div>; // Atau spinner loading

    // Jika sudah login, redirect ke home
    return user ? <Navigate to="/" replace /> : children;
}


function App() {
   const handleLogout = async () => {
     try {
       await signOut(auth);
     } catch (error) {
       console.error("Error during logout:", error);
     }
   };

  return (
    <Router>
      {/* Tambahkan div container utama jika diperlukan untuk styling global */}
      {/* <div style={styles.appContainer}> */}
        <Routes>

          {/* Rute Halaman Utama (/) */}
          <Route path="/" element={<HomePageWrapper onLogout={handleLogout} />} />

          {/* Rute Halaman Login (/login) */}
          <Route
            path="/login"
            element={
              <AuthRedirectWrapper>
                 {/* Beri tahu AuthPage untuk mode 'login' */}
                <AuthPage mode="login" />
              </AuthRedirectWrapper>
            }
          />

          {/* --- RUTE BARU Halaman Register (/register) --- */}
          <Route
            path="/register"
            element={
              <AuthRedirectWrapper>
                {/* Beri tahu AuthPage untuk mode 'register' */}
                <AuthPage mode="register" />
              </AuthRedirectWrapper>
            }
          />
          {/* ------------------------------------------- */}


          {/* Rute fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

        {/* --- FOOTER KREDIT BARU --- */}
        <footer style={styles.footer}>
          <p>
            Dibuat oleh {' '}
            <a href="https://github.com/fakhrizamaris" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
              Fakhri Djamaris (GitHub)
            </a>
            {' | '}
            <a href="https://www.linkedin.com/in/fakhri-djamaris" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
              Fakhri Djamaris (LinkedIn)
            </a>
          </p>
          <p style={styles.footerAppname}>
            SummarizeMe &copy; 2024
          </p>
        </footer>
        {/* --------------------------- */}
      {/* </div> */}
    </Router>
  );
}

// Tambahkan objek styles jika belum ada (minimal untuk footer)
const styles = {
    footer: {
        marginTop: 'auto', // Push footer ke bawah
        padding: '1.5rem 1rem',
        backgroundColor: 'rgba(25, 25, 40, 0.8)',
        textAlign: 'center',
        fontSize: '0.85em',
        color: '#aaa',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    },
    footerLink: {
        color: '#8c8cff',
        textDecoration: 'none',
        transition: 'color 0.2s ease',
    },
    footerAppname: {
        marginTop: '0.5rem',
        fontSize: '0.75em',
        color: '#777',
    }
};

export default App;