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
import { APIProvider } from '@vis.gl/react-google-maps';

const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

  const content = (
    <FirestoreProvider>
      <ShelterProvider>
        <ShelterDashboard />
      </ShelterProvider>
    </FirestoreProvider>
  );

  if (API_KEY) {
    return (
      <APIProvider apiKey={API_KEY} libraries={['places']}>
        {content}
      </APIProvider>
    );
  }

  return content;
}
