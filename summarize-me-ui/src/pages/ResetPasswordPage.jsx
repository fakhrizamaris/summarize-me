import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { auth } from '../config/firebaseConfig';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import styles from './AuthPage.module.css'; // Menggunakan style Anda
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import FullPageLoader from '../components/FullPageLoader/FullPageLoader';
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';

function ResetPasswordPage() {
  const [pageState, setPageState] = useState('loading'); // loading | invalid | valid | success
  const [oobCode, setOobCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text: '...' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams] = useSearchParams();

  // Langkah 1: Verifikasi kode saat halaman dimuat
  useEffect(() => {
    const code = searchParams.get('oobCode'); // 'oobCode' adalah nama parameter dari Firebase

    if (!code) {
      setPageState('invalid');
      setMessage({ type: 'error', text: 'Link reset tidak valid atau kode hilang.' });
      return;
    }

    setOobCode(code); // Simpan kodenya untuk nanti

    verifyPasswordResetCode(auth, code)
      .then((email) => {
        setPageState('valid');
      })
      .catch((error) => {
        setPageState('invalid');
        setMessage({ type: 'error', text: 'Link reset tidak valid atau telah kadaluwarsa. Silakan minta link baru.' });
      });
  }, [searchParams]);

  // Langkah 2: Tangani submit form password baru
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password dan konfirmasi tidak cocok.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal harus 6 karakter.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsSubmitting(false);
      setPageState('success'); // Ubah status halaman
    } catch (error) {
      setIsSubmitting(false);
      setMessage({ type: 'error', text: 'Gagal mengubah password. Silakan coba lagi.' });
    }
  };

  // ----- Tampilan (Render) -----

  // Tampilan saat memverifikasi kode
  if (pageState === 'loading') {
    return <FullPageLoader text="Memverifikasi link..." variant="dual" />;
  }

  // Tampilan jika link tidak valid atau sukses
  if (pageState === 'invalid' || pageState === 'success') {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <h2 className={styles.authTitle}>{pageState === 'success' ? 'Password Diubah' : 'Link Tidak Valid'}</h2>
        </div>

        {pageState === 'success' ? (
          <div className={styles.successMessage}>
            <IoCheckmarkCircleOutline className={styles.successIcon} />
            <span>Password Anda telah berhasil diubah.</span>
          </div>
        ) : (
          <div className={styles.errorMessage}>
            <IoAlertCircleOutline className={styles.errorIcon} />
            <span>{message ? message.text : 'Terjadi kesalahan.'}</span>
          </div>
        )}

        <div className={styles.switchMode} style={{ borderTop: 'none', paddingTop: 0 }}>
          <Link to="/login" className={styles.switchButton}>
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  // Tampilan utama jika kode valid (pageState === 'valid')
  return (
    <div className={styles.authContainer}>
      <div className={styles.authHeader}>
        <h2 className={styles.authTitle}>Atur Password Baru</h2>
        <p className={styles.authSubtitle}>Masukkan password baru Anda di bawah ini.</p>
      </div>

      {/* Menampilkan pesan error/sukses di dalam form */}
      {message && message.type === 'success' && (
        <div className={styles.successMessage}>
          <IoCheckmarkCircleOutline className={styles.successIcon} />
          <span>{message.text}</span>
        </div>
      )}
      {message && message.type === 'error' && (
        <div className={styles.errorMessage}>
          <IoAlertCircleOutline className={styles.errorIcon} />
          <span>{message.text}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="password">
            Password Baru
          </label>
          <div className={styles.passwordWrapper}>
            <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
            <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="confirmPassword">
            Konfirmasi Password Baru
          </label>
          <div className={styles.passwordWrapper}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Ulangi password baru"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <button type="button" className={styles.togglePassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner size="small" /> : 'Simpan Password Baru'}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
