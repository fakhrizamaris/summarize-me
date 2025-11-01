import React, { useEffect } from 'react';
import ReactDOM from 'react-dom'; // 1. Import ReactDOM
import styles from './Notification.module.css';
import { IoCheckmarkCircle, IoCloseCircle, IoClose } from 'react-icons/io5';

// 2. Simpan elemen portal di luar fungsi
const portalRoot = document.getElementById('portal-root');

function Notification({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = type === 'success' ? IoCheckmarkCircle : IoCloseCircle;

  // 3. Bungkus seluruh JSX dengan ReactDOM.createPortal()
  return ReactDOM.createPortal(
    <div className={`${styles.notification} ${styles[type]}`}>
      <Icon className={styles.icon} />
      <p className={styles.message}>{message}</p>
      <button onClick={onClose} className={styles.closeBtn}>
        <IoClose />
      </button>
    </div>,
    portalRoot // 4. Tentukan tujuannya
  );
}

export default Notification;
