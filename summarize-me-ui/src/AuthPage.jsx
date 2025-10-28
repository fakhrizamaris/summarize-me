// src/AuthPage.jsx
import React, { useState } from 'react';
// Import fungsi auth & provider Google
import { auth, googleProvider } from './config/firebaseConfig'; //
// Import fungsi-fungsi autentikasi Firebase
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence, // <-- Impor fungsi persistence
  browserLocalPersistence, // <-- Ingat Saya (default)
  browserSessionPersistence // <-- Jangan Ingat Saya
} from 'firebase/auth'; //
import { useNavigate } from 'react-router-dom';

function AuthPage() {
  const navigate = useNavigate();
  // State untuk input form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // State baru untuk konfirmasi password
  const [confirmPassword, setConfirmPassword] = useState('');
  // State baru untuk checkbox "Ingat Saya"
  const [rememberMe, setRememberMe] = useState(true); // Defaultnya dicentang
  const [isLoginView, setIsLoginView] = useState(true);
  // State untuk pesan error
  const [error, setError] = useState('');
  // State untuk loading
  const [isLoading, setIsLoading] = useState(false);


  // --- Fungsi Login/Register dengan Email/Password ---
  const handleEmailPasswordSubmit = async (event) => {
    event.preventDefault(); // Mencegah form refresh halaman
    setError(''); // Bersihkan error lama
    setIsLoading(true);

    try {
      if (isLoginView) {
        // --- Proses Login ---
        // Atur persistence SEBELUM login
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        // Lanjutkan login
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/'); // Redirect ke home setelah sukses
      } else {
        // --- Proses Register ---
        // Validasi konfirmasi password
        if (password !== confirmPassword) {
          setError("Konfirmasi password tidak cocok.");
          setIsLoading(false);
          return; // Hentikan jika tidak cocok
        }
        // Jika cocok, lanjutkan register
        await createUserWithEmailAndPassword(auth, email, password);
        // Firebase otomatis login setelah register
        navigate('/'); // Redirect ke home setelah sukses
        // Opsional: Simpan data user tambahan ke Firestore di sini jika perlu
      }
    } catch (err) {
      console.error("Firebase Auth Error:", err.code, err.message);
      // Terjemahkan kode error Firebase ke pesan yang lebih ramah
      let friendlyMessage = "Terjadi kesalahan. Silakan coba lagi.";
      if (err.code === 'auth/invalid-email') {
        friendlyMessage = "Format email tidak valid.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = "Email atau password salah.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "Email ini sudah terdaftar. Silakan login.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "Password terlalu lemah (minimal 6 karakter).";
      }
      setError(friendlyMessage);
    } finally {
        setIsLoading(false);
    }
  };

  // --- Fungsi Login dengan Google ---
  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Untuk Google, persistence biasanya diatur secara default atau saat init
      // Jika ingin eksplisit: await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider); //
      navigate('/');
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Gagal login dengan Google. Silakan coba lagi.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={styles.authContainer}>
      <h2>{isLoginView ? 'Login Akun' : 'Daftar Akun Baru'}</h2>

      {/* --- Form Email/Password --- */}
      <form onSubmit={handleEmailPasswordSubmit} style={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Alamat Email"
          required
          style={styles.input}
          disabled={isLoading} // Nonaktifkan saat loading
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 6 karakter)"
          required
          style={styles.input}
          disabled={isLoading} // Nonaktifkan saat loading
        />

        {/* --- Input Konfirmasi Password (Hanya Muncul Saat Register) --- */}
        {!isLoginView && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Konfirmasi Password"
            required
            style={styles.input}
            disabled={isLoading} // Nonaktifkan saat loading
          />
        )}

        {/* --- Checkbox Ingat Saya (Hanya Muncul Saat Login) --- */}
        {isLoginView && (
            <div style={styles.rememberMeContainer}>
                <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={styles.checkbox}
                    disabled={isLoading} // Nonaktifkan saat loading
                />
                <label htmlFor="rememberMe" style={styles.checkboxLabel}>
                    Ingat Saya
                </label>
            </div>
        )}

        {error && <p style={styles.errorMessage}>{error}</p>}

        <button type="submit" style={{...styles.submitButton, opacity: isLoading ? 0.7 : 1}} disabled={isLoading}>
          {isLoading ? 'Memproses...' : (isLoginView ? 'Login' : 'Daftar')}
        </button>
      </form>

      {/* --- Tombol Ganti Mode (Login/Register) --- */}
      <button
        onClick={() => {
            setIsLoginView(!isLoginView);
            setError(''); // Reset error saat ganti mode
            setEmail(''); setPassword(''); setConfirmPassword(''); // Reset input
        }}
        style={styles.toggleButton}
        disabled={isLoading}
      >
        {isLoginView ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Login di sini'}
      </button>

      {/* --- Pemisah "atau" --- */}
      <div style={styles.divider}>
        <span style={styles.dividerLine}></span> {/* Garis kiri */}
        <span style={styles.dividerText}>atau</span>
        <span style={styles.dividerLine}></span> {/* Garis kanan */}
      </div>

      {/* --- Tombol Login Google --- */}
      <button onClick={handleGoogleLogin} style={{...styles.googleButton, opacity: isLoading ? 0.7 : 1}} disabled={isLoading}>
        {/* Tambahkan ikon Google sederhana */}
        <svg style={styles.googleIcon} viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.8v3.8h5.5c-.3 1.3-1.6 3.2-5.5 3.2-3.3 0-6-2.7-6-6s2.7-6 6-6c1.8 0 3 .8 3.8 1.5l2.9-2.9C18.1 1.6 15.3 0 11.55 0 5.15 0 0 5.15 0 11.55S5.15 23.1 11.55 23.1c6.1 0 10.9-4.2 10.9-11.1 0-.6-.1-1-.2-1.2z"></path></svg>
        Lanjutkan dengan Google
      </button>

    </div>
  );
}

// Styling diperbarui untuk form
const styles = {
    authContainer: {
        maxWidth: '400px',
        margin: '10vh auto',
        padding: '2.5rem', // Lebih besar padding
        backgroundColor: 'rgba(30, 30, 50, 0.85)', // Lebih solid
        borderRadius: '16px', // Lebih bulat
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', // Shadow lebih jelas
        backdropFilter: 'blur(8px)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem', // Jarak antar input
        marginBottom: '1rem',
    },
    input: {
        padding: '12px 15px',
        borderRadius: '8px',
        border: '1px solid #556', // Border sedikit lebih jelas
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: '#eee',
        fontSize: '1em',
    },
    errorMessage: {
        color: '#ff8a8a', // Warna error merah muda
        fontSize: '0.9em',
        marginTop: '-0.5rem', // Dekatkan ke input
        marginBottom: '0.5rem',
        textAlign: 'left', // Rata kiri agar lebih rapi
    },
    submitButton: {
        padding: '12px',
        fontSize: '1.05em',
        backgroundColor: '#7a7aff', // Warna utama sedikit diubah
        color: '#fff',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '0.5rem',
        transition: 'background-color 0.2s, opacity 0.2s',
        // disabled style ditangani dengan inline opacity
    },
    toggleButton: {
        background: 'none',
        border: 'none',
        color: '#aaa', // Warna abu-abu
        cursor: 'pointer',
        fontSize: '0.9em',
        marginTop: '0.5rem',
        padding: '5px', // Area klik lebih besar
        textDecoration: 'underline',
    },
    divider: {
        margin: '1.5rem 0',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        color: '#888',
    },
    dividerLine: { // Style untuk garis pemisah
        flex: 1,
        borderBottom: '1px solid #555',
    },
    dividerText: {
        padding: '0 1em',
        fontSize: '0.9em',
    },
    googleButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%', // Full width
        padding: '12px',
        fontSize: '1em',
        backgroundColor: '#fff', // Latar putih
        color: '#333', // Teks gelap
        border: '1px solid #ddd',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s, opacity 0.2s',
        // disabled style ditangani dengan inline opacity
    },
    googleIcon: {
        width: '18px',
        height: '18px',
    },
    rememberMeContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start', // Rata kiri
        gap: '8px', // Jarak checkbox & label
        marginTop: '-0.5rem', // Dekatkan ke input password
        marginBottom: '1rem',
    },
    checkbox: {
        margin: 0,
        width: '16px',
        height: '16px',
        cursor: 'pointer',
    },
    checkboxLabel: {
        fontSize: '0.9em',
        color: '#ccc',
        cursor: 'pointer',
        userSelect: 'none', // Agar teks tidak terseleksi saat klik
    }
};

export default AuthPage;