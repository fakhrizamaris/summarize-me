// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../config/firebaseConfig'; // Path diupdate
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

// Import CSS Module
import styles from './AuthPage.module.css';

// Terima prop 'mode' ("login" atau "register")
function AuthPage({ mode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoginView, setIsLoginView] = useState(mode === 'login');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Loading khusus Google

  // Efek untuk mengubah mode jika prop 'mode' berubah
  useEffect(() => {
    setIsLoginView(mode === 'login');
    setError(''); // Reset error
    setEmail(''); setPassword(''); setConfirmPassword(''); // Reset input
  }, [mode]);

  const handleEmailPasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginView) {
        // Proses Login
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        // Proses Register
        if (password !== confirmPassword) {
          setError("Konfirmasi password tidak cocok.");
          setIsLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/');
      }
    } catch (err) {
      console.error("Firebase Auth Error:", err.code, err.message);
      let friendlyMessage = "Terjadi kesalahan. Silakan coba lagi.";
      // ... (kode terjemahan error tetap sama) ...
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

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      console.error("Google Login Error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError("Gagal login dengan Google. Silakan coba lagi.");
      }
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || isGoogleLoading;

  return (
    // Gunakan className dari CSS Module
    <div className={styles.authContainer}>
      <h2>{isLoginView ? 'Login ke SummarizeMe' : 'Buat Akun Baru'}</h2>

      <form onSubmit={handleEmailPasswordSubmit} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Alamat Email"
          required
          className={styles.input} // Ganti style jadi className
          disabled={isSubmitDisabled}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className={styles.input} // Ganti style jadi className
          disabled={isSubmitDisabled}
        />

        {!isLoginView && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Konfirmasi Password"
            required
            className={styles.input} // Ganti style jadi className
            disabled={isSubmitDisabled}
          />
        )}

        {isLoginView && (
            <div className={styles.optionsContainer}> {/* Ganti style jadi className */}
                <div className={styles.rememberMeContainer}> {/* Ganti style jadi className */}
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className={styles.checkbox} // Ganti style jadi className
                        disabled={isSubmitDisabled}
                    />
                    <label htmlFor="rememberMe" className={styles.checkboxLabel}> {/* Ganti style jadi className */}
                        Ingat Saya
                    </label>
                </div>
                {/* <a href="#" className={styles.forgotPassword}>Lupa Password?</a> */} {/* Jika ada, gunakan className */}
            </div>
        )}

        {error && <p className={styles.errorMessage}>{error}</p>} {/* Ganti style jadi className */}

        {/* Gunakan className, hapus style inline opacity */}
        <button type="submit" className={styles.submitButton} disabled={isSubmitDisabled}>
          {isLoading ? 'Memproses...' : (isLoginView ? 'Login' : 'Daftar Akun')}
        </button>
      </form>

      <p className={styles.switchText}> {/* Ganti style jadi className */}
        {isLoginView ? 'Belum punya akun? ' : 'Sudah punya akun? '}
        <Link to={isLoginView ? '/register' : '/login'} className={styles.switchLink}> {/* Ganti style jadi className */}
          {isLoginView ? 'Daftar di sini' : 'Login di sini'}
        </Link>
      </p>

      <div className={styles.divider}> {/* Ganti style jadi className */}
        <span className={styles.dividerLine}></span>
        <span className={styles.dividerText}>atau</span>
        <span className={styles.dividerLine}></span>
      </div>

      {/* Gunakan className, hapus style inline opacity */}
      <button onClick={handleGoogleLogin} className={styles.googleButton} disabled={isSubmitDisabled}>
        {isGoogleLoading ? (
            <span className={styles.buttonSpinner}></span> 
        ) : (
            <svg className={styles.googleIcon} viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.8v3.8h5.5c-.3 1.3-1.6 3.2-5.5 3.2-3.3 0-6-2.7-6-6s2.7-6 6-6c1.8 0 3 .8 3.8 1.5l2.9-2.9C18.1 1.6 15.3 0 11.55 0 5.15 0 0 5.15 0 11.55S5.15 23.1 11.55 23.1c6.1 0 10.9-4.2 10.9-11.1 0-.6-.1-1-.2-1.2z"></path></svg> /* Ganti style jadi className */
        )}
        Lanjutkan dengan Google
      </button>

    </div>
  );
}

// Hapus objek styles yang besar di sini
// const styles = { ... };

export default AuthPage;
