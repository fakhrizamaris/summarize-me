// src/components/LoadingSpinner/LoadingSpinner.jsx
import React from 'react';
import styles from './LoadingSpinner.module.css';

function LoadingSpinner({ variant = 'default', size = 'medium', text = '' }) {
  const sizeClass = styles[`size-${size}`];
  
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`${styles['spinner-dots']} ${sizeClass}`}>
            <div></div>
            <div></div>
            <div></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${styles['spinner-pulse']} ${sizeClass}`}>
            <div></div>
            <div></div>
          </div>
        );
      
      case 'gradient':
        return (
          <div className={`${styles['spinner-gradient']} ${sizeClass}`}>
            <div></div>
          </div>
        );
      
      case 'dual':
        return (
          <div className={`${styles['spinner-dual']} ${sizeClass}`}>
            <div></div>
            <div></div>
          </div>
        );
      
      default:
        return <div className={`${styles.spinner} ${sizeClass}`}></div>;
    }
  };

  return (
    <div className={styles.container}>
      {renderSpinner()}
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}

export default LoadingSpinner;