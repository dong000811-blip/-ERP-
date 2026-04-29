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
    // Check if configuration is loaded correctly
    const isConfigMissing = !import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID;
    if (isConfigMissing) {
      setIsInitializing(false);
      return;
    }

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

  // Explicit check for missing environmental variables to show UI error
  const isConfigMissing = !import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (isConfigMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full bg-red-50 border-2 border-red-100 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
          <h1 className="text-xl font-black text-red-900 mb-4 uppercase tracking-tight">환경 변수 로드 오류</h1>
          <p className="text-sm text-red-700 leading-relaxed font-medium mb-6">
            Vercel의 [Environment Variables] 설정이 빌드 시점에 제대로 주입되지 않았습니다. 
            <br/><br/>
            VITE_FIREBASE_API_KEY 및 VITE_FIREBASE_PROJECT_ID가 
            정확히 입력되었는지 확인하시고, 변경 후에는 반드시 **Vercel에서 다시 배포(Redeploy)**를 진행해야 합니다.
          </p>
          <div className="text-[10px] bg-white/50 p-4 rounded-xl text-left font-mono text-red-400 break-all border border-red-50">
            Detected Origin: {window.location.origin}<br/>
            API_KEY: {import.meta.env.VITE_FIREBASE_API_KEY ? 'Present' : 'MISSING'}<br/>
            PROJECT_ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Present' : 'MISSING'}
          </div>
        </div>
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
