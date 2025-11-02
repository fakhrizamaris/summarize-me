// src/components/HistorySidebar/HistorySIdebar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../config/firebaseConfig.js'; 
import { 
  collection, query, orderBy, limit, startAfter, getDocs, doc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.jsx';
import styles from './HistorySidebar.module.css';

// --- 1. PASTIKAN ANDA MENG-IMPORT KOMPONEN BARU ---
import ConfirmModal from '../ConfirmModal/ConfirmModal'; //
import Notification from '../Notification/Notification'; //
import { 
  IoDocumentTextOutline, 
  IoPencil, 
  IoTrashOutline, 
  IoFolderOpenOutline, 
  IoClose,
  IoAdd,
  IoSearchCircle,
  IoSearchSharp
} from 'react-icons/io5';


// Helper untuk format tanggal (ini dari file Anda)
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
const PAGE_SIZE = 20;

function HistorySidebar({ user, onSelectSummary, isSidebarOpen, onToggle }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // --- 2. PASTIKAN STATE BARU INI ADA ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  // ... (fungsi loadHistory tetap sama) ...
  const loadHistory = useCallback(async (initialLoad = false) => {
    if (!user?.uid || !db) return;

    if (initialLoad) {
      setLoading(true);
      setHistory([]);
      setLastVisibleDoc(null);
      setHasMore(true);
      setError('');
    } else {
      if (!hasMore || loadingMore) return;
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
  }, [user?.uid, lastVisibleDoc, hasMore, loadingMore]);

  // ... (fungsi useEffect tetap sama) ...
  useEffect(() => {
    if (user?.uid) {
      loadHistory(true); 
    } else {
      setHistory([]);
      setLoading(false);
      setLastVisibleDoc(null);
      setHasMore(true);
      setSearchQuery('');
      setError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // --- 3. PASTIKAN SEMUA FUNGSI BARU INI ADA ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, visible: true });
    // Dihapus otomatis oleh komponen Notifikasi
  };

  // Ini yang dipanggil tombol
  const startDelete = (e, item) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowConfirmModal(true);
  };

  // Ini yang dipanggil modal
  const confirmDelete = async () => {
    if (!itemToDelete) return; 
    
    const { id: itemId, fileName } = itemToDelete;

    if (!db || !appId || !user?.uid || !itemId) {
      console.error("Gagal menghapus: Path Firestore tidak lengkap.", { db: !!db, appId, uid: user?.uid, itemId });
      showNotification("Gagal menghapus: Error konfigurasi.", "error");
      setShowConfirmModal(false);
      setItemToDelete(null);
      return;
    }

    try {
      const docRef = doc(db, "artifacts", appId, "users", user.uid, "summaries", itemId);
      await deleteDoc(docRef);
      setHistory(prev => prev.filter(item => item.id !== itemId));
      onSelectSummary({ id: itemId }, true); 
      showNotification(`Riwayat "${fileName || 'Tanpa Nama'}" berhasil dihapus.`, 'success');
    } catch (err) {
      console.error("Gagal menghapus item: ", err);
      showNotification(`Gagal menghapus item: ${err.message}`, "error");
    } finally {
      setShowConfirmModal(false);
      setItemToDelete(null);
    }
  };

  // ... (fungsi startEditing, handleRename, handleEditBlur tetap sama) ...
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
      const oldHistory = [...history];
      const updatedItem = { ...history.find(h => h.id === itemId), fileName: newName };
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
        showNotification("Gagal mengubah nama item.", "error");
        setHistory(oldHistory);
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

  const filteredHistory = searchQuery ? history.filter((item) => item.fileName?.toLowerCase().includes(searchQuery.toLowerCase())) : history;

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
    
    const listToRender = filteredHistory;

    return (
      <ul className={styles.historyList}>
        {listToRender.map((item) => (
          <li 
            key={item.id} 
            className={styles.historyItem} 
            onClick={() => {
              if (editingId !== item.id) { 
                onSelectSummary(item, false);
                if (window.innerWidth < 1024) onToggle();
              }
            }}
            tabIndex={0} 
          >
            <span className={styles.itemIcon}><IoDocumentTextOutline /></span>
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
                <button onClick={(e) => startEditing(e, item)} className={styles.actionBtn} aria-label="Ubah nama">
                  <IoPencil />
                </button>
                {/* --- 4. INI ADALAH PERBAIKAN DARI ERROR SEBELUMNYA --- */}
                <button onClick={(e) => startDelete(e, item)} className={styles.actionBtn} aria-label="Hapus">
                  <IoTrashOutline />
                </button>
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
          {/* <button className={styles.closeBtn} onClick={onToggle}>
            <IoClose size={22} />
          </button> */}
          <span className={styles.titleIcon}>
            <IoFolderOpenOutline />
          </span>
          Riwayat Ringkasan
        </h3>
        <button onClick={onToggle} className={styles.closeBtn} aria-label="Tutup sidebar">
          <IoClose size={26} />
        </button>
      </div>

      <div className={styles.searchContainer}>
        <IoSearchSharp className={styles.searchIcon} />
        <input type="search" placeholder="Cari riwayat..." className={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className={styles.sidebarContent}>
        {renderContent()}

        {hasMore && !loading && !searchQuery && (
          <button className={styles.loadMoreBtn} onClick={() => loadHistory(false)} disabled={loadingMore}>
            {loadingMore ? <LoadingSpinner variant="default" size="small" /> : 'Muat Lebih Banyak'}
          </button>
        )}
      </div>

      {/* --- 5. INI BAGIAN PENTING YANG MUNGKIN HILANG --- */}
      {/* Pastikan ini di-render agar modal bisa muncul */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus riwayat "${itemToDelete?.fileName || 'ini'}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {notification.visible && <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ ...notification, visible: false })} />}
    </aside>
  );
}

export default HistorySidebar;