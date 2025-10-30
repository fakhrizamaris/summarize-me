// src/components/HistorySidebar/HistorySidebar.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './HistorySidebar.module.css';

// Helper untuk format tanggal
const formatDate = (timestamp) => {
  if (!timestamp) return '...';
  // Mengubah Firestore Timestamp ke Date, lalu format ke 'id-ID'
  return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Ambil appId dari global variable (jika ada)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

function HistorySidebar({ user, onSelectSummary }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Path ke koleksi private user
    const historyCollectionRef = collection(db, "artifacts", appId, "users", user.uid, "summaries");
    const q = query(historyCollectionRef, orderBy("createdAt", "desc")); // Urutkan terbaru di atas

    // Gunakan onSnapshot untuk update real-time (jika ada ringkasan baru)
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const summaries = [];
        querySnapshot.forEach((doc) => {
          summaries.push({ id: doc.id, ...doc.data() });
        });
        setHistory(summaries);
        setLoading(false);
      }, 
      (err) => {
        console.error("Gagal mengambil history: ", err);
        setError("Gagal memuat history.");
        setLoading(false);
      }
    );

    // Cleanup subscription saat komponen di-unmount
    return () => unsubscribe();

  }, [user?.uid]); // Hanya jalankan ulang jika user ID berubah

  const renderContent = () => {
    if (loading) {
      // Gunakan spinner yang sudah ada
      return <LoadingSpinner variant="dots" size="small" text="Memuat history..." />;
    }
    if (error) {
      return <p className={styles.errorText}>{error}</p>;
    }
    if (history.length === 0) {
      return <p className={styles.emptyText}>Belum ada riwayat ringkasan.</p>;
    }
    
    // Tampilkan daftar history
    return (
      <ul className={styles.historyList}>
        {history.map((item) => (
          <li 
            key={item.id} 
            className={styles.historyItem} 
            onClick={() => onSelectSummary(item)} // Kirim data item ke HomePage
            tabIndex={0} // untuk aksesibilitas
          >
            <span className={styles.itemIcon}>📄</span>
            <div className={styles.itemDetails}>
              <span className={styles.itemFileName}>{item.fileName || 'Tanpa Nama'}</span>
              <span className={styles.itemDate}>{formatDate(item.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <aside className={styles.sidebarContainer}>
      <h3 className={styles.sidebarTitle}>
        Riwayat Ringkasan
      </h3>
      <div className={styles.sidebarContent}>
        {renderContent()}
      </div>
    </aside>
  );
}

export default HistorySidebar;