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
import { saveUserSession, verifyAndGetAutoSession, PersistedUserSession } from './lib/autoAuth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | PersistedUserSession | any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [autoLoggedInMessage, setAutoLoggedInMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("App initializing, setting up auth listener and IP session check...");
    let isMounted = true;

    const checkAuthAndAutoLogin = async (firebaseUser: User | null) => {
      if (firebaseUser) {
        console.log("Firebase Auth active user detected:", firebaseUser.email);
        await saveUserSession({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
        if (isMounted) {
          setCurrentUser(firebaseUser);
          setIsInitializing(false);
        }
      } else {
        console.log("No active Firebase user, checking IP / local session auto-login...");
        const result = await verifyAndGetAutoSession();
        if (result.valid && result.session) {
          console.log("Auto-login restored for IP/Device session:", result.session.lastLoginIp);
          if (isMounted) {
            setCurrentUser(result.session);
            setAutoLoggedInMessage(`동일 IP(${result.session.lastLoginIp})에서 자동 로그인되었습니다.`);
            setIsInitializing(false);
          }
        } else {
          console.log("Auto-login not available or session expired:", result.reason);
          if (isMounted) {
            setCurrentUser(null);
            setIsInitializing(false);
          }
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      checkAuthAndAutoLogin(user);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold">동일 IP/기기 자동 로그인 세션 확인 중...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={(user, ip) => {
      setCurrentUser(user);
      if (ip) {
        setAutoLoggedInMessage(`동일 IP(${ip}) 연결이 기억되었습니다.`);
      }
    }} />;
  }

  return (
    <FirestoreProvider overrideUser={currentUser}>
      <ShelterProvider>
        {autoLoggedInMessage && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm animate-fade-in z-50 sticky top-0">
            <span>✨ {autoLoggedInMessage} 로그인 절차 없이 안전하게 자동 접속되었습니다.</span>
            <button 
              onClick={() => setAutoLoggedInMessage(null)}
              className="ml-3 text-white/80 hover:text-white underline text-[10px]"
            >
              닫기
            </button>
          </div>
        )}
        <ShelterDashboard />
      </ShelterProvider>
    </FirestoreProvider>
  );
}
