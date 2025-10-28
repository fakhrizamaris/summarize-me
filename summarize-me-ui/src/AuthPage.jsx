// src/AuthPage.jsx
import React from 'react';
import { auth, googleProvider } from './config/firebaseConfig'; // Pastikan path benar
import { signInWithPopup } from 'firebase/auth'; //
import { useNavigate } from 'react-router-dom'; // Hook untuk navigasi

function AuthPage() {
  const navigate = useNavigate(); // Dapatkan fungsi navigasi

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider); // Tunggu login selesai
      // Setelah berhasil, Firebase Auth state akan berubah,
      // dan App.jsx akan otomatis mengarahkan ke halaman utama.
      // Kita bisa juga paksa navigasi jika perlu:
      navigate('/'); // Kembali ke halaman utama setelah login
    } catch (error) {
      console.error("Error during login:", error);
      // Tampilkan pesan error di halaman ini jika perlu
      alert("Login gagal. Silakan coba lagi.");
    }
  };

  return (
    <div style={styles.authContainer}>
      <h2>Login atau Daftar</h2>
      <p style={styles.authText}>Anda perlu masuk dengan akun Google untuk dapat menggunakan fitur ringkasan.</p>
      <button onClick={handleLogin} style={styles.loginButton}>
        Masuk / Daftar dengan Google
      </button>
    </div>
  );
}

// Styling sederhana untuk halaman login
const styles = {
    authContainer: {
        maxWidth: '400px',
        margin: '10vh auto', // Tengah vertikal & horizontal
        padding: '2rem 2.5rem',
        backgroundColor: 'rgba(40, 40, 60, 0.7)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
    },
    authText: {
        opacity: 0.8,
        marginBottom: '2rem',
        fontSize: '0.95em',
        lineHeight: 1.6,
    },
    loginButton: {
        padding: '0.8em 1.5em',
        fontSize: '1em',
        backgroundColor: '#8c8cff',
        color: '#1a1a2e',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
    }
};

export default AuthPage;