import React, { useState } from 'react';
// === PERBAIKAN 1: Import auth dan db ===
import { auth, db } from '../../config/firebaseConfig.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import styles from './FloatingFeedback.module.css';

// === PERBAIKAN 2: Import API_BASE_URL ===
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function FloatingFeedback({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim() === '') return;

    setIsLoading(true);
    try {
      // === PERBAIKAN 3: Gunakan auth yang sudah di-import ===
      const token = await auth.currentUser.getIdToken();
      
      const data = {
        email: user.email,
        comment: comment
      };
      
      // Kirim ke Go API
      await axios.post(`${API_BASE_URL}/api/feedback`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Simpan juga ke Firestore (opsional, untuk backup)
      await addDoc(collection(db, 'project_feedback'), {
        comment: comment,
        createdAt: serverTimestamp(),
        page: window.location.href,
        userAgent: navigator.userAgent,
        userEmail: user ? user.email : 'Anonymous',
        userId: user ? user.uid : 'N/A'
      });

      setIsSuccess(true);
      setComment('');
    } catch (error) {
      console.error("Gagal mengirim feedback: ", error);
      alert("Gagal mengirim feedback. Coba lagi nanti.");
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
      <button 
        className={styles.feedbackButton} 
        onClick={() => setIsOpen(true)}
        aria-label="Beri Masukan"
      >
        💬
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)}></div>
          <div className={styles.modal}>
            {!isSuccess ? (
              <form onSubmit={handleSubmit}>
                <h3 className={styles.title}>Beri Masukan</h3>
                <p className={styles.subtitle}>
                  Ada ide atau menemukan bug? Beri tahu kami!
                </p>
                <textarea
                  className={styles.textarea}
                  placeholder="Komentar Anda..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isLoading}
                />
                <div className={styles.actions}>
                  <button 
                    type="button" 
                    className={styles.closeButton} 
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={isLoading || comment.trim() === ''}
                  >
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