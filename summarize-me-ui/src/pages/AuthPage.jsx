// src/pages/AuthPage.jsx
// FILE INI DIBUAT ULANG KARENA FILE ASLI ANDA RUSAK (BERISI KODE HistorySidebar)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebaseConfig.js';
import styles from './AuthPage.module.css';
import FloatingShapes from '../components/FloatingShapes/FloatingShapes.jsx';

// Icon Google sederhana (SVG)
const GoogleIcon = () => (
  <svg className={styles.googleIcon} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 20.9 7.7 23 12 23z"></path>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"></path>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 3.1 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
    <path fill="none" d="M1 1h22v22H1z"></path>
  </svg>
);

// Spinner untuk tombol
const ButtonSpinner = ({ light = false }) => (
  <div className={light ? styles.buttonSpinnerLight : styles.buttonSpinner}></div>
);

function AuthPage({ mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const isLogin = mode === 'login';
  const title = isLogin ? 'Login ke Akun Anda' : 'Buat Akun Baru';
  const submitText = isLogin ? 'Login' : 'Daftar';
  const switchText = isLogin ? "Belum punya akun?" : "Sudah punya akun?";
  const switchLinkText = isLogin ? "Daftar di sini" : "Login di sini";
  const switchPath = isLogin ? '/register' : '/login';

  // Handler untuk submit form email/password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(mapAuthError(err.code));
      console.error(err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk login Google
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      setError(mapAuthError(err.code));
      console.error(err.code, err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Terjemahan error Firebase
  const mapAuthError = (code) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email atau password salah.';
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar.';
      case 'auth/weak-password':
        return 'Password harus terdiri dari minimal 6 karakter.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/popup-closed-by-user':
        return 'Popup login Google ditutup. Silakan coba lagi.';
      default:
        return 'Terjadi kesalahan. Silakan coba lagi.';
    }
  };

  return (
    <>
      <FloatingShapes />
      <div className={styles.authContainer}>
        <h2>{title}</h2>

        {/* Tombol Google */}
        <button 
          className={styles.googleButton} 
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <ButtonSpinner />
          ) : (
            <>
              <GoogleIcon />
              <span>{isLogin ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
            </>
          )}
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine}></span>
          <span className={styles.dividerText}>atau</span>
          <span className={styles.dividerLine}></span>
        </div>
        
        {/* Form Email/Password */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || googleLoading}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || googleLoading}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          
          {error && <p className={styles.errorMessage}>{error}</p>}

          {/* Opsi (hanya di halaman login) */}
          {isLogin && (
            <div className={styles.optionsContainer}>
              <label className={styles.rememberMeContainer}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className={styles.checkboxLabel}>Ingat saya</span>
              </label>
              <a href="#" className={styles.forgotPassword}>Lupa Password?</a>
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || googleLoading}
          >
            {loading ? <ButtonSpinner light={true} /> : submitText}
          </button>
        </form>

        <p className={styles.switchText}>
          {switchText}{' '}
          <Link to={switchPath} className={styles.switchLink}>
            {switchLinkText}
          </Link>
        </p>
      </div>
    </>
  );
}

export default AuthPage;
