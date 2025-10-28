// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Import komponen Router
import { auth } from './config/firebaseConfig'; // Hanya perlu auth
import { signOut, onAuthStateChanged } from 'firebase/auth'; //

// Impor halaman-halaman
import HomePage from './HomePage';
import AuthPage from './AuthPage';

function PrivateRoute({ children }) {
    const [user, setUser] = useState(undefined); // undefined = loading
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>; // Atau spinner
    }

    // Jika sudah loading dan TIDAK ada user, redirect ke /login
    return user ? children : <Navigate to="/login" replace />;
    // 'replace' agar halaman dashboard tidak masuk history browser saat belum login
}


function App() {
  // State user dan loading dipindahkan ke dalam PrivateRoute atau context nanti
  // const [user, setUser] = useState(null);
  // const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Fungsi logout (bisa ditaruh di context atau dilewatkan)
   const handleLogout = async () => {
     try {
       await signOut(auth); //
       // Navigasi ke home akan otomatis karena user jadi null
     } catch (error) {
       console.error("Error during logout:", error);
     }
   };

  // useEffect(() => { ... onAuthStateChanged ... }, []); // Dipindahkan ke PrivateRoute

  // if (isLoadingUser) { ... } // Dipindahkan

  return (
    <Router> {/* Bungkus semua dengan Router */}
      <Routes> {/* Definisikan rute-rute */}
        
        {/* Rute Halaman Utama (/) */}
        {/* Tampilkan HomePage, berikan user (jika ada) dan fungsi logout */}
         <Route path="/" element={
             <HomePageWrapper onLogout={handleLogout} /> // Gunakan wrapper untuk ambil user
         } />

        {/* Rute Halaman Login (/login) */}
        <Route path="/login" element={
            // Jika SUDAH login, jangan tampilkan halaman login, redirect ke home
             <AuthRedirectWrapper>
                <AuthPage />
             </AuthRedirectWrapper>
         } />

        {/* Contoh Rute Terproteksi (misal /dashboard jika dipisah) */}
        {/* <Route path="/dashboard" element={
            <PrivateRoute>
                <DashboardPage user={auth.currentUser} onLogout={handleLogout} />
            </PrivateRoute>
        } /> */}

        {/* Rute fallback jika halaman tidak ditemukan */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
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

    if (isLoading) return <div>Loading...</div>;
    // Berikan user (bisa null) dan onLogout ke HomePage
    return <HomePage user={user} onLogout={onLogout} />;
}

// Helper component untuk redirect dari /login jika sudah login
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

    if (isLoading) return <div>Loading...</div>;

    // Jika sudah login, redirect ke home
    return user ? <Navigate to="/" replace /> : children;
}


export default App;