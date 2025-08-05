"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  credits: number;
  setCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    // This will hold the unsubscribe function for the Firestore listener
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // If a user was previously logged in, we need to unsubscribe from their document listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }

      if (currentUser) {
        // User is signed in, let's listen to their data in real-time
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            // Update credits whenever the document changes
            setCredits(doc.data().credits);
          } else {
            // This can happen if signup is not complete before this listener attaches
            console.log("Listening, but user document doesn't exist yet.");
            setCredits(0); // Default to 0 if doc is not found
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          setCredits(0);
          setLoading(false);
        });

      } else {
        // User is signed out
        setCredits(0);
        setLoading(false);
      }
    });

    // Cleanup function: Unsubscribe from both auth and Firestore listeners when the provider unmounts
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount

  const value = { user, loading, credits, setCredits };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}