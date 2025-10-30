// src/components/HistorySidebar/HistorySidebar.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebaseConfig';
// PERBAIKAN 2 (Loading): Impor 'limit'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './HistorySidebar.module.css';

// Helper untuk format tanggal (Tetap sama)
const formatDate = (timestamp) => {
  if (!timestamp) return '...';
  return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// PERBAIKAN 3 (Toggle): Terima prop 'isSidebarOpen' dan 'onToggle'
function HistorySidebar({ user, onSelectSummary, isSidebarOpen, onToggle }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid || !db) {
      setLoading(false);
      setHistory([]); // Pastikan history kosong jika logout
      return;
    }

    setLoading(true);
    const historyCollectionRef = collection(db, "artifacts", appId, "users", user.uid, "summaries");
    
    // PERBAIKAN 2 (Loading): Tambahkan limit(20) untuk memuat 20 terbaru
    const q = query(historyCollectionRef, orderBy("createdAt", "desc"), limit(20)); 

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

    return () => unsubscribe();

  }, [user?.uid]); 

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner variant="dots" size="small" text="Memuat history..." />;
    }
    if (error) {
      return <p className={styles.errorText}>{error}</p>;
    }
    if (history.length === 0) {
      return <p className={styles.emptyText}>Belum ada riwayat ringkasan.</p>;
    }
    
    return (
      <ul className={styles.historyList}>
        {history.map((item) => (
          <li 
            key={item.id} 
            className={styles.historyItem} 
            // PERBAIKAN 1 (Responsive): Tutup sidebar di mobile saat item diklik
            onClick={() => {
              onSelectSummary(item);
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
            tabIndex={0} 
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
    // PERBAIKAN 3 (Toggle): Tambahkan class 'closed' jika isSidebarOpen false
    <aside className={`${styles.sidebarContainer} ${!isSidebarOpen ? styles.closed : ''}`}>
      <div className={styles.sidebarHeader}> {/* Tambahkan header wrapper */}
        <h3 className={styles.sidebarTitle}>
          <span className={styles.titleIcon}>🗂️</span>
          Riwayat Ringkasan
        </h3>
        {/* PERBAIKAN 3 (Toggle): Tombol Close */}
        <button onClick={onToggle} className={styles.closeBtn} aria-label="Tutup sidebar">
          ✕
        </button>
      </div>
      <div className={styles.sidebarContent}>
        {renderContent()}
      </div>
    </aside>
  );
}

export default HistorySidebar;