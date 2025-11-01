// src/components/UserNavbar/UserNavbar.jsx
import React, { useState, useEffect, useRef } from 'react'; // <-- PERBAIKAN 2: Impor state, effect, ref
import styles from './UserNavbar.module.css';
import { IoMenu, IoClose } from 'react-icons/io5';

// ... (Komponen DefaultProfileIcon tetap sama) ...
const DefaultProfileIcon = () => (
   <svg
     xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24"
     fill="currentColor"
     className={styles.navAvatar}
   >
     <path
       fillRule="evenodd"
       d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
       clipRule="evenodd"
     />
   </svg>
 );

function UserNavbar({ user, onLogout, onToggleSidebar, isSidebarOpen }) {
  // PERBAIKAN 2: State untuk menu profile dropdown
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null); // Ref untuk deteksi klik di luar

  // PERBAIKAN 2: Logika untuk menutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);


  if (!user) return null; 

  return (
    <nav className={`${styles.navbar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.navContent}>
        <div className={styles.navLeft}>
          <button onClick={onToggleSidebar} className={styles.toggleBtn} aria-label="Toggle sidebar">
            {isSidebarOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
          </button>

          <div className={styles.logo}>
            <span className={styles.logoText}>SummarizeMe</span>
          </div>
        </div>

        {/* PERBAIKAN 2: Modifikasi navRight menjadi container menu */}
        <div className={styles.navRight} ref={profileMenuRef}>
          {/* Tombol Avatar yang mentrigger dropdown */}
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className={styles.profileAvatarButton} aria-label="Buka menu profil">
            {user.photoURL ? <img src={user.photoURL} alt="Profile" className={styles.navAvatar} referrerPolicy="no-referrer" /> : <DefaultProfileIcon />}
          </button>

          {/* Dropdown Menu Modern */}
          <div className={`${styles.profileDropdown} ${isProfileMenuOpen ? styles.open : ''}`}>
            <div className={styles.dropdownHeader}>
              Signed in as
              <strong>{user.displayName || user.email || 'User'}</strong>
            </div>
            <button
              onClick={() => {
                setIsProfileMenuOpen(false); // Tutup menu
                onLogout(); // Jalankan logout
              }}
              className={`${styles.dropdownItem} ${styles.logoutBtn}`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default UserNavbar;