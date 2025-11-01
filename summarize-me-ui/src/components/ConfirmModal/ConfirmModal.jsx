import React from 'react';
import styles from './ConfirmModal.module.css';
import { IoWarningOutline, IoClose } from 'react-icons/io5';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
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
    </div>
  );
}

export default ConfirmModal;
