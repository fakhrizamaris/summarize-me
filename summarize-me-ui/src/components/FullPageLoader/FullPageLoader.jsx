// src/components/FullPageLoader/FullPageLoader.jsx
import React from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './FullPageLoader.module.css';

function FullPageLoader({ text = 'Memuat...', variant = 'gradient' }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <LoadingSpinner variant={variant} size="large" />
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
}

export default FullPageLoader;