import React, { useState } from 'react';
// === PERBAIKAN 1: Import auth dan db ===
import { auth, db } from '../../config/firebaseConfig.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import styles from './FloatingFeedback.module.css';
import { useAuth } from '../../hooks/useAuth';

// === PERBAIKAN 2: Import API_BASE_URL ===
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
function getLocalISOString() {
  const date = new Date();

  // Buat bagian YYYY-MM-DD
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // Buat bagian HH:mm:ss
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  // Gabungkan semuanya dengan format YYYY-MM-DD/HH:MM:SS
  return `${year}-${month}-${day}/${hours}:${minutes}:${seconds}`;
}

function FloatingFeedback({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [error, setError] = useState(false);
  const { currentUser } = useAuth(); //

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      setError(true);
      // --- MODIFIKASI DISINI ---
      setErrorMessage('Feedback minimal 10 karakter.');
      return;
    }

    setIsLoading(true);
    setError(false);
    setIsSuccess(false);
    setErrorMessage('');
    try {
      // === PERBAIKAN 3: Gunakan auth yang sudah di-import ===
      const token = await auth.currentUser.getIdToken();
      const timestampLokal = getLocalISOString();
      const data = {
        email: user.email,
        comment: comment,
      };

      // Kirim ke Go API
      await axios.post(`${API_BASE_URL}/api/feedback`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Simpan juga ke Firestore (opsional, untuk backup)
      await addDoc(collection(db, 'project_feedback'), {
        comment: comment,
        createdAt: timestampLokal,
        page: window.location.href,
        userAgent: navigator.userAgent,
        userEmail: user ? user.email : 'Anonymous',
        userId: user ? user.uid : 'N/A',
      });

      setIsSuccess(true);
      setComment('');
    } catch (error) {
      console.error('Gagal mengirim feedback: ', error); //
      setError(true);
      setErrorMessage('Terjadi kesalahan. Gagal mengirim feedback, silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
      }, 2000);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.feedbackButton} onClick={() => setIsOpen(true)} aria-label="Beri Masukan">
        💬
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)}></div>
          <div className={styles.modal}>
            {!isSuccess ? (
              <form onSubmit={handleSubmit}>
                <h3 className={styles.title}>Beri Masukan</h3>
                <p className={styles.subtitle}>Ada ide atau menemukan bug? Beri tahu kami!</p>
                <textarea className={styles.textarea} placeholder="Komentar Anda..." value={comment} onChange={(e) => setComment(e.target.value)} disabled={isLoading} />
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                <div className={styles.actions}>
                  <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} disabled={isLoading}>
                    Batal
                  </button>
                  <button type="submit" className={styles.submitButton} disabled={isLoading || comment.trim() === ''}>
                    {isLoading ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.successView}>
                <div className={styles.successIcon}>✅</div>
                <h3 className={styles.title}>Terima Kasih!</h3>
                <p className={styles.subtitle}>Feedback Anda telah terkirim.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default FloatingFeedback;
