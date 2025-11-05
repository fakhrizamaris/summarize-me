import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebaseConfig'; // Pastikan auth diimpor
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import styles from './AuthPage.module.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePasswordReset = async (event) => {
    event.preventDefault();

    if (!email) {
      setMessage({
        type: 'error',
        text: 'Silakan masukkan email Anda.',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setIsLoading(false);

      // ▼▼▼ INI PERUBAHAN UTAMA (PESAN SUKSES) ▼▼▼
      setMessage({
        type: 'success',
        text: 'Jika email Anda terdaftar, link reset password telah dikirim ke inbox Anda. Cek juga folder spam/junk.',
      });
    } catch (error) {
      setIsLoading(false);

      // ▼▼▼ INI PERUBAHAN KEDUA (PENANGANAN ERROR) ▼▼▼
      let errorMessage = 'Gagal mengirim email. Coba lagi nanti.';

      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email yang Anda masukkan tidak valid.';
      }
      // Kita tidak lagi mengecek 'auth/user-not-found'

      setMessage({ type: 'error', text: errorMessage });
    }
  };

  return (
    <div className={styles.authContainer}>
      <form className={styles.authForm} onSubmit={handlePasswordReset}>
        <h2 className={styles.authTitle}>Lupa Password</h2>
        <p className={styles.authSubtitle}>Masukkan email Anda untuk mendapatkan link reset password.</p>

        {message && (
          <div
            className={`
              ${styles.authMessage} 
              ${message.type === 'error' ? styles.errorMessage : styles.successMessage}
            `}
          >
            {message.text}
          </div>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.inputLabel}>
            Email
          </label>
          <input id="email" type="email" placeholder="nama@email.com" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>

        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="small" /> : 'Kirim Email Reset'}
        </button>

        <div className={styles.toggleModeContainer}>
          <Link to="/login" className={styles.toggleModeButton}>
            Kembali ke Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
