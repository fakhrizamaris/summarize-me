// src/components/HistorySidebar/HistorySidebar.jsx
import React, { useState, useEffect, useCallback } from 'react';
// PERBAIKAN: Path import diperbaiki
import { db } from '../../config/firebaseConfig.js'; 
import { 
  collection, query, orderBy, limit, startAfter, getDocs, doc, deleteDoc, updateDoc 
} from 'firebase/firestore';
// PERBAIKAN: Path import diperbaiki
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.jsx';
// PERBAIKAN: Path import diperbaiki
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

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const PAGE_SIZE = 20; // Memuat 20 item per halaman

function HistorySidebar({ user, onSelectSummary, isSidebarOpen, onToggle }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true); // Loading awal
  const [loadingMore, setLoadingMore] = useState(false); // Loading untuk "load more"
  const [error, setError] = useState('');
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null); // Untuk pagination
  const [hasMore, setHasMore] = useState(true); // Apakah ada data lagi
  const [searchQuery, setSearchQuery] = useState(''); // Untuk search
  const [editingId, setEditingId] = useState(null); // ID item yg sedang diedit
  const [editText, setEditText] = useState(''); // Teks untuk input edit

  // Fungsi untuk memuat riwayat (dengan pagination)
  const loadHistory = useCallback(async (initialLoad = false) => {
    if (!user?.uid || !db) return;

    if (initialLoad) {
      setLoading(true);
      setHistory([]);
      setLastVisibleDoc(null);
      setHasMore(true);
      setError(''); // Reset error saat load awal
    } else {
      if (!hasMore || loadingMore) return; // Jangan muat lagi jika sudah habis atau sedang memuat
      setLoadingMore(true);
    }

    try {
      const historyCollectionRef = collection(db, "artifacts", appId, "users", user.uid, "summaries");
      
      const constraints = [
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      ];

      if (!initialLoad && lastVisibleDoc) {
        constraints.push(startAfter(lastVisibleDoc));
      }

      const q = query(historyCollectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const newSummaries = [];
      querySnapshot.forEach((doc) => {
        newSummaries.push({ id: doc.id, ...doc.data() });
      });

      setHistory(prev => initialLoad ? newSummaries : [...prev, ...newSummaries]);
      
      if (querySnapshot.docs.length > 0) {
        setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      if (querySnapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
    } catch (err) {
      console.error("Gagal mengambil history: ", err);
      setError("Gagal memuat history. Pastikan Anda telah membuat indeks di Firestore.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.uid, lastVisibleDoc, hasMore, loadingMore]); // Sertakan semua dependensi

  // Efek untuk memuat data awal saat user berubah
  useEffect(() => {
    if (user?.uid) {
      loadHistory(true); 
    } else {
      // Bersihkan state jika logout
      setHistory([]);
      setLoading(false); // Berhenti loading jika tidak ada user
      setLastVisibleDoc(null);
      setHasMore(true);
      setSearchQuery('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Hanya jalankan ulang jika user ID berubah

  // --- Fungsi Manajemen Riwayat ---

  const handleDelete = async (e, itemId) => {
    e.stopPropagation(); 
    
    // Konfirmasi kustom (gantilah window.confirm jika Anda mau)
    const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus riwayat ini?");
    if (!isConfirmed) {
      return;
    }
    
    try {
      const docRef = doc(db, "artifacts", appId, "users", user.uid, "summaries", itemId);
      await deleteDoc(docRef);
      setHistory(prev => prev.filter(item => item.id !== itemId));
      onSelectSummary({ id: itemId }, true); // Beri tahu parent bahwa item ini dihapus
    } catch (err) {
      console.error("Gagal menghapus item: ", err);
      alert("Gagal menghapus item.");
    }
  };

  const startEditing = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditText(item.fileName);
  };

  const handleRename = async (e, itemId) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const newName = editText.trim();
      if (!newName || !editingId) {
        setEditingId(null); 
        return;
      }

      const oldHistory = [...history]; // Salin riwayat lama
      const updatedItem = { ...history.find(h => h.id === itemId), fileName: newName };
      
      // Update UI dulu
      setHistory(prev => prev.map(h => 
        h.id === itemId ? updatedItem : h
      ));
      onSelectSummary(updatedItem, false); 
      setEditingId(null); 
      setEditText('');

      try {
        const docRef = doc(db, "artifacts", appId, "users", user.uid, "summaries", itemId);
        await updateDoc(docRef, { fileName: newName });
      } catch (err) {
        console.error("Gagal mengubah nama: ", err);
        alert("Gagal mengubah nama item.");
        setHistory(oldHistory); // Kembalikan jika gagal
      }
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditText('');
    }
  };
  
  const handleEditBlur = () => {
    setEditingId(null);
    setEditText('');
  };

  // --- Render ---

  // Filter HANYA JIKA ada searchQuery
  const filteredHistory = searchQuery 
    ? history.filter(item => 
        item.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history; // Jika tidak ada query, tampilkan semua

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner variant="dots" size="medium" text="Memuat riwayat..." />;
    }
    if (error) {
      return <p className={styles.errorText}>{error}</p>;
    }
    if (history.length === 0) {
      return <p className={styles.emptyText}>Belum ada riwayat.</p>;
    }
     if (filteredHistory.length === 0 && searchQuery) {
      return <p className={styles.emptyText}>Tidak ada hasil untuk "{searchQuery}".</p>;
    }
    
    const listToRender = filteredHistory; // Tampilkan hasil filter

    return (
      <ul className={styles.historyList}>
        {listToRender.map((item) => (
          <li 
            key={item.id} 
            className={styles.historyItem} 
            onClick={() => {
              if (editingId !== item.id) { 
                onSelectSummary(item, false); // false = jangan reset
                if (window.innerWidth < 1024) onToggle(); // Tutup di mobile
              }
            }}
            tabIndex={0} 
          >
            <span className={styles.itemIcon}>📄</span>
            <div className={styles.itemDetails}>
              {editingId === item.id ? (
                <input
                  type="text"
                  className={styles.editInput}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => handleRename(e, item.id)}
                  onBlur={handleEditBlur} 
                  autoFocus
                  onClick={(e) => e.stopPropagation()} 
                />
              ) : (
                <>
                  <span className={styles.itemFileName}>{item.fileName || 'Tanpa Nama'}</span>
                  <span className={styles.itemDate}>{formatDate(item.createdAt)}</span>
                </>
              )}
            </div>
            {editingId !== item.id && (
              <div className={styles.itemActions}>
                <button onClick={(e) => startEditing(e, item)} className={styles.actionBtn} aria-label="Ubah nama">✏️</button>
                <button onClick={(e) => handleDelete(e, item)} className={styles.actionBtn} aria-label="Hapus">🗑️</button>
              </div>
            )}
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
        
        {/* Tampilkan hanya jika: ada item lagi, tidak sedang loading, dan tidak sedang mencari */}
        {hasMore && !loading && !searchQuery && ( 
          <button 
            className={styles.loadMoreBtn}
            onClick={() => loadHistory(false)} // 'false' berarti BUKAN initial load
            disabled={loadingMore}
          >
            {loadingMore ? <LoadingSpinner variant="default" size="small" /> : 'Muat Lebih Banyak'}
          </button>
        )}
      </div>
    </aside>
  );
}

export default HistorySidebar;

