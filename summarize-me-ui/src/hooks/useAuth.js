// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig'; // Pastikan path benar

export function useAuth() {
  const [user, setUser] = useState(null); // Mulai dengan null
  const [isLoading, setIsLoading] = useState(true); // Mulai loading

  useEffect(() => {
    // onAuthStateChanged mengembalikan fungsi unsubscribe
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Changed:", currentUser ? currentUser.uid : 'No user');
      setUser(currentUser);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
       console.log("Unsubscribing auth listener");
       unsubscribe();
    }
  }, []); // Dependency array kosong agar hanya jalan sekali saat mount

  return { user, isLoading };
}