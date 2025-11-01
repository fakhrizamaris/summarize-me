import React, { useEffect } from 'react';
import styles from './Notification.module.css';
import { IoCheckmarkCircle, IoCloseCircle, IoClose } from 'react-icons/io5';

function Notification({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Otomatis hilang setelah 4 detik

    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = type === 'success' ? IoCheckmarkCircle : IoCloseCircle;

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <Icon className={styles.icon} />
      <p className={styles.message}>{message}</p>
      <button onClick={onClose} className={styles.closeBtn}>
        <IoClose />
      </button>
    </div>
  );
}

export default Notification;
