// src/components/FloatingFeedback/FloatingFeedback.jsx

import React, { useState } from 'react';
// Import yang Anda perlukan untuk logika
import { auth, db } from '../../config/firebaseConfig.js';
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';
// Import untuk UI dan state
import styles from './FloatingFeedback.module.css';
import { useAuth } from '../../hooks/useAuth';
import {
  IoChatbubbleEllipsesOutline,
  IoClose,
  IoSendOutline,
  IoCheckmarkCircleOutline, // Icon untuk sukses
} from 'react-icons/io5';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.jsx'; // Untuk loading

// Import API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fungsi helper Anda (saya salin dari kode Anda)
function getLocalISOString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day}/${hours}:${minutes}:${seconds}`;
}

function FloatingFeedback() {
  const { user } = useAuth(); // Ambil user dari hook
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState(''); // (comment)
  const [isSending, setIsSending] = useState(false); // (isLoading)
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState(''); // (errorMessage)

  // Sembunyikan jika belum login
  if (!user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (feedbackText.trim().length < 10) {
      setMessage('Feedback minimal 10 karakter.');
      return;
    }

    setIsSending(true);
    setMessage('');
    setIsSuccess(false);

    try {
      // 1. LOGIKA ANDA: Dapatkan Token
      const token = await auth.currentUser.getIdToken();
      const timestampLokal = getLocalISOString();
      const data = {
        email: user.email,
        comment: feedbackText,
      };

      // 2. LOGIKA ANDA: Kirim ke Go API
      await axios.post(`${API_BASE_URL}/api/feedback`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 3. LOGIKA ANDA: Simpan ke Firestore
      await addDoc(collection(db, 'project_feedback'), {
        comment: feedbackText,
        createdAt: timestampLokal,
        page: window.location.href,
        userAgent: navigator.userAgent,
        userEmail: user.email,
        userId: user.uid,
      });

      // Sukses
      setIsSuccess(true);
      setFeedbackText('');

      // Tutup modal setelah 2 detik (seperti kode Anda)
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false); // Reset untukSesi berikutnya
      }, 2000);
    } catch (error) {
      console.error('Gagal mengirim feedback: ', error);
      setMessage('Terjadi kesalahan. Gagal mengirim feedback, silakan coba lagi nanti.');
    } finally {
      setIsSending(false);
    }
  };

  // Fungsi untuk menutup modal (mereset state)
  const handleCloseModal = () => {
    if (isSending) return; // Jangan tutup saat mengirim
    setIsOpen(false);
    setMessage('');
    setIsSuccess(false); // Reset sukses
    // Jangan reset feedbackText, agar user tidak kehilangan ketikannya
  };

  return (
    <div className={styles.feedbackContainer}>
      {/* --- Tombol FAB (Tampilan Baru) --- */}
      <button className={styles.feedbackButton} onClick={() => setIsOpen(true)} aria-label="Beri Masukan">
        <IoChatbubbleEllipsesOutline size={24} />
      </button>

      {/* --- Modal (Tampilan Baru) --- */}
      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={handleCloseModal} />
          <div className={styles.feedbackModal}>
            {!isSuccess ? (
              /* --- TAMPILAN FORM --- */
              <form onSubmit={handleSubmit}>
                <div className={styles.modalHeader}>
                  <h3>Beri Masukan</h3>
                  <button type="button" onClick={handleCloseModal} className={styles.closeBtn} disabled={isSending}>
                    <IoClose size={22} />
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p>Ada ide atau menemukan bug? Beri tahu saya!</p>
                  <textarea className={styles.textarea} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Tulis masukan Anda di sini..." rows={5} required minLength={10} disabled={isSending} />
                  {message && <p className={styles.error}>{message}</p>}
                  <button type="submit" className={styles.submitBtn} disabled={isSending || feedbackText.trim().length < 10}>
                    {isSending ? (
                      <LoadingSpinner variant="default" size="small" />
                    ) : (
                      <>
                        Kirim <IoSendOutline size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* --- TAMPILAN SUKSES (Dari Logika Anda) --- */
              <div className={styles.successView}>
                <IoCheckmarkCircleOutline size={48} className={styles.successIcon} />
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
