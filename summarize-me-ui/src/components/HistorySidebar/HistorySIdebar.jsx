// src/components/HistorySidebar/HistorySidebar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../config/firebaseConfig';
import { 
  collection, query, orderBy, limit, startAfter, getDocs, doc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './HistorySidebar.module.css';

// ... (Fungsi formatDate tetap sama) ...
const formatDate = (timestamp) => {
  if (!timestamp) return '...';
  return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const PAGE_SIZE = 20; // Jumlah item per halaman

function HistorySidebar({ user, onSelectSummary, isSidebarOpen, onToggle }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true); // Loading awal
  const [loadingMore, setLoadingMore] = useState(false); // Loading untuk "load more"
  const [error, setError] = useState('');
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null); // Untuk pagination
  const [hasMore, setHasMore] = useState(true); // Apakah ada data lagi
  const [searchQuery, setSearchQuery] = useState(''); // Untuk search

  // --- Fungsi baru untuk memuat riwayat ---
  const loadHistory = useCallback(async (initialLoad = false) => {
    if (!user?.uid || !db) return;

    if (initialLoad) {
      setLoading(true);
      setHistory([]);
      setLastVisibleDoc(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const historyCollectionRef = collection(db, "artifacts", appId, "users", user.uid, "summaries");
      let q;

      // Buat query dasar
      const baseQuery = [
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      ];

      // Tambahkan 'startAfter' jika BUKAN initial load dan ada doc terakhir
      if (!initialLoad && lastVisibleDoc) {
        q = query(historyCollectionRef, ...baseQuery, startAfter(lastVisibleDoc));
      } else {
        q = query(historyCollectionRef, ...baseQuery);
      }

      const querySnapshot = await getDocs(q);
      
      const newSummaries = [];
      querySnapshot.forEach((doc) => {
        newSummaries.push({ id: doc.id, ...doc.data() });
      });

      // Update state
      setHistory(prev => initialLoad ? newSummaries : [...prev, ...newSummaries]);
      
      // Simpan dokumen terakhir untuk query berikutnya
      if (querySnapshot.docs.length > 0) {
        setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      // Jika hasil lebih sedikit dari page size, berarti sudah habis
      if (querySnapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
    } catch (err) {
      console.error("Gagal mengambil history: ", err);
      setError("Gagal memuat history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.uid, lastVisibleDoc]); // Dependensi

  // Efek untuk memuat data saat user berubah
  useEffect(() => {
    if (user?.uid) {
      loadHistory(true); // Lakukan initial load
    } else {
      // Bersihkan state jika logout
      setHistory([]);
      setLoading(true);
      setLastVisibleDoc(null);
      setHasMore(true);
    }
  }, [user?.uid]); // Hanya jalankan ulang jika user ID berubah

  // --- Fungsi Manajemen Riwayat ---

  const handleDelete = async (e, itemId) => {
    e.stopPropagation(); // Hentikan event klik pada item
    if (!window.confirm("Apakah Anda yakin ingin menghapus riwayat ini?")) {
      return;
    }
    
    try {
      // Hapus dari Firestore
      const docRef = doc(db, "artifacts", appId, "users", user.uid, "summaries", itemId);
      await deleteDoc(docRef);
      // Hapus dari state lokal
      setHistory(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Gagal menghapus item: ", err);
      alert("Gagal menghapus item.");
    }
  };

  const handleRename = async (e, item) => {
    e.stopPropagation();
    const newName = prompt("Masukkan nama file baru:", item.fileName);

    if (newName && newName.trim() !== '' && newName !== item.fileName) {
      try {
        // Update di Firestore
        const docRef = doc(db, "artifacts", appId, "users", user.uid, "summaries", item.id);
        await updateDoc(docRef, {
          fileName: newName.trim()
        });
        // Update di state lokal
        setHistory(prev => prev.map(h => 
          h.id === item.id ? { ...h, fileName: newName.trim() } : h
        ));
      } catch (err) {
        console.error("Gagal mengubah nama: ", err);
        alert("Gagal mengubah nama item.");
      }
    }
  };

  // --- Render ---

  // Filter history berdasarkan search query
  const filteredHistory = history.filter(item => 
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {filteredHistory.map((item) => (
          <li 
            key={item.id} 
            className={styles.historyItem} 
            onClick={() => {
              onSelectSummary(item);
              if (window.innerWidth < 1024) onToggle();
            }}
            tabIndex={0} 
          >
            <span className={styles.itemIcon}>📄</span>
            <div className={styles.itemDetails}>
              <span className={styles.itemFileName}>{item.fileName || 'Tanpa Nama'}</span>
              <span className={styles.itemDate}>{formatDate(item.createdAt)}</span>
            </div>
            {/* Tombol Aksi (Rename & Delete) */}
            <div className={styles.itemActions}>
              <button onClick={(e) => handleRename(e, item)} className={styles.actionBtn} aria-label="Ubah nama">✏️</button>
              <button onClick={(e) => handleDelete(e, item)} className={styles.actionBtn} aria-label="Hapus">🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <aside className={`${styles.sidebarContainer} ${!isSidebarOpen ? styles.closed : ''}`}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>
          <span className={styles.titleIcon}>🗂️</span>
          Riwayat Ringkasan
        </h3>
        <button onClick={onToggle} className={styles.closeBtn} aria-label="Tutup sidebar">
          ✕
        </button>
      </div>

      {/* --- Fitur Search --- */}
      <div className={styles.searchContainer}>
        <input 
          type="search"
          placeholder="Cari riwayat..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.sidebarContent}>
        {renderContent()}
        
        {/* --- Fitur Pagination --- */}
        {hasMore && !loading && !searchQuery && (
          <button 
            className={styles.loadMoreBtn}
            onClick={() => loadHistory(false)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
          </button>
        )}
      </div>
    </aside>
  );
}

export default HistorySidebar;