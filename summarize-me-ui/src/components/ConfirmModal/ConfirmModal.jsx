import React from 'react';
import ReactDOM from 'react-dom'; // 1. Import ReactDOM
import styles from './ConfirmModal.module.css';
import { IoWarningOutline, IoClose } from 'react-icons/io5';

// 2. Simpan elemen portal di luar fungsi
const portalRoot = document.getElementById('portal-root');

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  // 3. Bungkus seluruh JSX dengan ReactDOM.createPortal()
  return ReactDOM.createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <IoWarningOutline className={styles.icon} />
          <h3 className={styles.title}>{title || 'Konfirmasi'}</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <IoClose />
          </button>
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Batal
          </button>
          <button onClick={onConfirm} className={styles.confirmBtn}>
            Hapus
          </button>
        </div>
      </div>
    </div>,
    portalRoot // 4. Tentukan tujuannya
  );
}

export default ConfirmModal;
