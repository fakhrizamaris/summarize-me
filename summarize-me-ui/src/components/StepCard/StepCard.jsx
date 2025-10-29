// src/components/StepCard/StepCard.jsx
import React from 'react';
import styles from './StepCard.module.css';

function StepCard({ number, title, description }) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepNumber}>{number}</div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDesc}>{description}</p>
      {/* Tampilkan panah jika bukan step terakhir (misal, < 3) */}
      {number < 3 && <div className={styles.stepArrow}>→</div>}
    </div>
  );
}

export default StepCard;