// src/components/FloatingShapes/FloatingShapes.jsx
import React from 'react';
import styles from './FloatingShapes.module.css'; // <-- Import

function FloatingShapes() {
  return (
    // Gunakan className
    <div className={styles.floatingContainer}>
      <div className={`${styles.shape} ${styles.shape1}`}></div>
      <div className={`${styles.shape} ${styles.shape2}`}></div>
      <div className={`${styles.shape} ${styles.shape3}`}></div>
      <div className={`${styles.shape} ${styles.shape4}`}></div>
    </div>
  );
}

export default FloatingShapes;