// src/hooks/useAuth.js
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { initSessionTracking, cleanupSessionTracking, isSessionValid, clearSession, updateLastActivity } from '../utils/sessionManager';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionCheckIntervalRef = useRef(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    console.log('🔄 useAuth mounted');

    // Inisialisasi session tracking HANYA sekali
    if (isFirstMount.current) {
      initSessionTracking();
      isFirstMount.current = false;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔐 Auth State Changed:', currentUser ? currentUser.uid : 'No user');

      if (currentUser) {
        // User login, cek session validity
        if (!isSessionValid()) {
          console.log('⏰ Session expired, logging out...');
          auth.signOut();
          clearSession();
          setUser(null);
        } else {
          // Session valid, update activity
          updateLastActivity();
          setUser(currentUser);
        }
      } else {
        // User logout
        clearSession();
        setUser(null);
      }

      setIsLoading(false);
    });

    // Cek session setiap 1 menit (HANYA SEKALI)
    if (!sessionCheckIntervalRef.current) {
      sessionCheckIntervalRef.current = setInterval(() => {
        if (auth.currentUser && !isSessionValid()) {
          console.log('⏰ Session expired (periodic check), logging out...');
          auth.signOut();
          clearSession();
        }
      }, 60000); // Setiap 1 menit
    }

    // Cleanup
    return () => {
      console.log('🧹 useAuth cleanup');
      unsubscribe();

      // HANYA cleanup interval, JANGAN cleanup session tracking
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, []); // ← Dependency array KOSONG agar hanya run sekali

  // Cleanup session tracking saat component unmount (saat app benar-benar close)
  useEffect(() => {
    return () => {
      cleanupSessionTracking();
    };
  }, []);

  return { user, isLoading };
}
