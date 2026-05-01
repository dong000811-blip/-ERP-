/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ShelterDashboard from './components/ShelterDashboard';
import Login from './components/Login';
import { ShelterProvider } from './context/ShelterContext';
import { FirestoreProvider } from './FirestoreContext';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    console.log("App initializing, setting up auth listener...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed. User:", user ? user.email : "none");
      setCurrentUser(user);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <FirestoreProvider>
      <ShelterProvider>
        <ShelterDashboard />
      </ShelterProvider>
    </FirestoreProvider>
  );
}
