// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebaseConfig';
import styles from './AuthPage.module.css';
import FloatingShapes from '../components/FloatingShapes/FloatingShapes';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

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

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Deteksi mode dari URL path
  const isLoginMode = location.pathname === '/login';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Toggle between login and register
  const toggleMode = () => {
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');

    if (isLoginMode) {
      navigate('/register');
    } else {
      navigate('/login');
    }
  };

  // Validate form
  const validateForm = () => {
    if (!email || !password) {
      setError('Email dan password harus diisi');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid');
      return false;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password harus minimal 6 karakter');
      return false;
    }

    // Register-specific validations
    if (!isLoginMode) {
      if (!fullName || fullName.trim().length < 2) {
        setError('Nama lengkap harus diisi minimal 2 karakter');
        return false;
      }

      if (password !== confirmPassword) {
        setError('Password dan konfirmasi password tidak cocok');
        return false;
      }

      if (password.length < 8) {
        setError('Password harus minimal 8 karakter untuk keamanan');
        return false;
      }

      // Password strength check
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        setError('Password harus mengandung huruf besar, huruf kecil, dan angka');
        return false;
      }
    }

    return true;
  };

  // Handler untuk submit form email/password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage('Login berhasil! Mengarahkan...');
        setTimeout(() => navigate('/app'), 1000);
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile dengan nama
        await updateProfile(userCredential.user, {
          displayName: fullName,
        });

        setSuccessMessage('Registrasi berhasil! Mengarahkan...');
        setTimeout(() => navigate('/app'), 1000);
      }
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
    setSuccessMessage('');
    setGoogleLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage('Login berhasil! Mengarahkan...');
      setTimeout(() => navigate('/app'), 1000);
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
        return 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
      case 'auth/wrong-password':
        return 'Password salah. Silakan coba lagi.';
      case 'auth/invalid-credential':
        return 'Email atau password salah.';
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
      case 'auth/weak-password':
        return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/popup-closed-by-user':
        return 'Popup login Google ditutup. Silakan coba lagi.';
      case 'auth/account-exists-with-different-credential':
        return 'Email ini sudah terdaftar dengan metode login berbeda.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
      case 'auth/network-request-failed':
        return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      default:
        return 'Terjadi kesalahan. Silakan coba lagi.';
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Lemah', color: '#ef4444' };
    if (strength <= 3) return { strength, label: 'Sedang', color: '#f59e0b' };
    if (strength <= 4) return { strength, label: 'Kuat', color: '#10b981' };
    return { strength, label: 'Sangat Kuat', color: '#059669' };
  };

  const passwordStrength = !isLoginMode ? getPasswordStrength() : null;

  return (
    <>
      <FloatingShapes />
      <div className={styles.authContainer}>
        {/* Header dengan Tab Switcher */}
        <div className={styles.authHeader}>
          <h2 className={styles.authTitle}>{isLoginMode ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}</h2>
          <p className={styles.authSubtitle}>{isLoginMode ? 'Login untuk melanjutkan ke dashboard' : 'Daftar untuk mulai menggunakan layanan kami'}</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✓</span>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠</span>
            {error}
          </div>
        )}

        {/* Tombol Google */}
        <button className={styles.googleButton} onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
          {googleLoading ? (
            <LoadingSpinner variant="default" size="small" />
          ) : (
            <>
              <GoogleIcon />
              <span>{isLoginMode ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
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
          {/* Full Name (hanya untuk register) */}
          {!isLoginMode && (
            <div className={styles.inputGroup}>
              <label htmlFor="fullName" className={styles.inputLabel}>
                Nama Lengkap
              </label>
              <input id="fullName" type="text" placeholder="Masukkan nama lengkap Anda" className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading || googleLoading} autoComplete="name" />
            </div>
          )}

          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>
              Email
            </label>
            <input id="email" type="email" placeholder="nama@email.com" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading || googleLoading} autoComplete="email" />
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isLoginMode ? 'Masukkan password' : 'Minimal 8 karakter'}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              />
              <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)} disabled={loading || googleLoading}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Password Strength Indicator (hanya untuk register) */}
            {!isLoginMode && password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <span className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password (hanya untuk register) */}
          {!isLoginMode && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.inputLabel}>
                Konfirmasi Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password"
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  autoComplete="new-password"
                />
                <button type="button" className={styles.togglePassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading || googleLoading}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && <span className={styles.inputError}>Password tidak cocok</span>}
            </div>
          )}

          {/* Opsi (hanya di halaman login) */}
          {isLoginMode && (
            <div className={styles.optionsContainer}>
              <label className={styles.rememberMeContainer}>
                <input type="checkbox" className={styles.checkbox} checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className={styles.checkboxLabel}>Ingat saya</span>
              </label>
              <a href="#" className={styles.forgotPassword}>
                Lupa Password?
              </a>
            </div>
          )}

          {/* Terms (hanya untuk register) */}
          {!isLoginMode && (
            <div className={styles.termsContainer}>
              <p className={styles.termsText}>
                Dengan mendaftar, Anda menyetujui{' '}
                <a href="#" className={styles.termsLink}>
                  Syarat & Ketentuan
                </a>{' '}
                dan{' '}
                <a href="#" className={styles.termsLink}>
                  Kebijakan Privasi
                </a>
              </p>
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={loading || googleLoading}>
            {loading ? <LoadingSpinner variant="dual" size="small" /> : isLoginMode ? 'Login' : 'Daftar Sekarang'}
          </button>
        </form>

        {/* Switch Mode */}
        <div className={styles.switchMode}>
          <p className={styles.switchText}>
            {isLoginMode ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button onClick={toggleMode} className={styles.switchButton} disabled={loading || googleLoading}>
              {isLoginMode ? 'Daftar di sini' : 'Login di sini'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

export default AuthPage;
