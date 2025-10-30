// src/components/LoadingSpinner.jsx
import React from 'react';
import styles from './LoadingSpinner.module.css'; // <-- 1. Impor CSS Module

function LoadingSpinner() {
  // 2. Render div dengan class name dari CSS Module
  return <div className={styles.spinner}></div>;
}

export default LoadingSpinner;