import React, { useState } from 'react';
// PERBAIKAN: Path salah, harusnya ../../
import { db } from '../../config/firebaseConfig.js'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './FloatingFeedback.module.css'; // .css
import axios from 'axios';

function FloatingFeedback({user}) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim() === '') return;

    setIsLoading(true);
    try {

      // 1. Dapatkan token otentikasi
      const token = await auth.currentUser.getIdToken();
      
      // 2. Siapkan data
      const data = {
        email: user.email,
        comment: comment
      };
      
      // 3. Panggil Go API Anda
      await axios.post(`${API_BASE_URL}/api/feedback`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Simpan ke koleksi 'project_feedback'
      await addDoc(collection(db, 'project_feedback'), {
          comment: comment,
          createdAt: serverTimestamp(),
          page: window.location.href, // Catat halaman tempat user memberi feedback
          userAgent: navigator.userAgent,

          // --- TAMBAHAN BARU ---
          // Jika user login, simpan emailnya, jika tidak, simpan 'Anonymous'
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
      // Biarkan modal sukses terbuka selama 2 detik
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
      }, 2000);
    }
  };

  return (
    <div className={styles.container}>
      {/* Tombol Melayang */}
      <button 
        className={styles.feedbackButton} 
        onClick={() => setIsOpen(true)}
        aria-label="Beri Masukan"
      >
        💬
      </button>

      {/* Modal/Form Feedback */}
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
              // Tampilan Sukses
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