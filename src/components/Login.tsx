import React from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { LogIn } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    // provider.setCustomParameters({ prompt: 'select_account' }); // Removed to allow auto-login if already signed in to Google

    try {
      await signInWithPopup(auth, provider);
      console.log("Login successful");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error("Login failed with code:", error.code);
        console.error("Error message:", error.message);
        
        switch (error.code) {
          case 'auth/unauthorized-domain':
            alert("인증되지 않은 도메인입니다. 파이어베이스 콘솔 > 인증 > 설정 > 승인된 도메인에 현재 접속 주소를 추가해 주세요.");
            break;
          case 'auth/popup-closed-by-user':
            // No alert needed for manual closure
            break;
          case 'auth/cancelled-by-user':
            break;
          case 'auth/api-key-not-valid':
            alert("API 키가 유효하지 않습니다. 설정을 확인해 주세요.");
            break;
          default:
            alert(`로그인 오류가 발생했습니다 (${error.code}). 콘솔 로그를 확인해 주세요.`);
        }
      } else {
        console.error("Unexpected login error:", error);
        alert("알 수 없는 로그인 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-8 border border-slate-100">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-indigo-600" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Shelter Management ERP</h1>
          <p className="text-slate-500 text-sm">보호소 통합 관리 시스템에 오신 것을 환영합니다.</p>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 hover:border-indigo-100 hover:bg-slate-50 rounded-2xl transition-all group"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-slate-700">Google 계정으로 시작하기</span>
        </button>
        
        <p className="text-[0.625rem] text-slate-400">
          계속 진행함으로써 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
