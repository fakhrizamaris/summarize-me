// src/components/FeatureCard/FeatureCard.jsx
import React from 'react';
import styles from './FeatureCard.module.css';

// Terima style gradient sebagai prop untuk fleksibilitas
function FeatureCard({ icon, title, description, gradientStyle }) {
  return (
    <div className={styles.featureCard} style={{ background: gradientStyle }}>
      <div className={styles.featureIconBox}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </div>
  );
}

export default FeatureCard;