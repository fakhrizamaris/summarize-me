// src/hooks/useAuth.js
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { initSessionTracking, cleanupSessionTracking, isSessionValid, clearSession, updateLastActivity } from '../utils/sessionManager';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionCheckIntervalRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {

    if (isInitialized.current) {
  
      return;
    }

    console.log('🔄 useAuth mounted');
    isInitialized.current = true;

    initSessionTracking();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔐 Auth State Changed:', currentUser ? currentUser.uid : 'No user');

      if (currentUser) {
       
        if (!isSessionValid()) {
          console.log('⏰ Session expired, logging out...');
          auth.signOut();
          clearSession();
          setUser(null);
        } else {
         
          updateLastActivity();
          setUser(currentUser);
        }
      } else {
        clearSession();
        setUser(null);
      }

      setIsLoading(false);
    });

    sessionCheckIntervalRef.current = setInterval(() => {
      if (auth.currentUser && !isSessionValid()) {
        console.log('⏰ Session expired (periodic check), logging out...');
        auth.signOut();
        clearSession();
      }
    }, 60000);


    return () => {
      console.log('🧹 useAuth cleanup');
      unsubscribe();

      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }

      cleanupSessionTracking();
      isInitialized.current = false; 
    };
  }, []);

  return { user, isLoading };
}
