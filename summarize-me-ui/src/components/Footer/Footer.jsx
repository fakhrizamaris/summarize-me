import React from 'react';
import styles from './Footer.module.css';
import { IoLogoGithub } from 'react-icons/io5'; // Menggunakan react-icon

function Footer({ user, isSidebarOpen }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`
        ${styles.footerContainer} 
        ${user && isSidebarOpen ? styles.sidebarOpen : ''}
      `}
    >
      <p>
        <span>&copy; {currentYear} Summarize.me</span>
        <span>&bull;</span>
        <span>
          Dibuat oleh
          <a
            href="https://github.com/fakhrizamaris" // Ganti jika link-nya beda
            target="_blank"
            rel="noopener noreferrer"
            className={styles.creditLink}
          >
            <IoLogoGithub /> Fakhri Djamaris
          </a>
        </span>
      </p>
    </footer>
  );
}

export default Footer;
