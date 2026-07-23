import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { LogIn, ShieldCheck, Zap, Globe } from 'lucide-react';
import { saveUserSession, getClientIp, getStoredSession, PersistedUserSession } from '../lib/autoAuth';

interface LoginProps {
  onLoginSuccess?: (user: PersistedUserSession | any, ip: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [rememberIp, setRememberIp] = useState(true);
  const [currentIp, setCurrentIp] = useState<string>('조회 중...');
  const [storedSession, setStoredSession] = useState<PersistedUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getClientIp().then(ip => setCurrentIp(ip));
    const session = getStoredSession();
    if (session) {
      setStoredSession(session);
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful:", result.user.email);
      const ip = await getClientIp();
      const session = await saveUserSession({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }, rememberIp);

      if (onLoginSuccess) {
        onLoginSuccess(session, ip);
      }
    } catch (error) {
      setIsLoading(false);
      if (error instanceof FirebaseError) {
        console.error("Login failed with code:", error.code);
        switch (error.code) {
          case 'auth/unauthorized-domain':
            alert("인증되지 않은 도메인입니다. 파이어베이스 콘솔 > 인증 > 설정 > 승인된 도메인에 현재 접속 주소를 추가해 주세요.");
            break;
          case 'auth/popup-closed-by-user':
            break;
          case 'auth/cancelled-by-user':
            break;
          case 'auth/api-key-not-valid':
            alert("API 키가 유효하지 않습니다. 설정을 확인해 주세요.");
            break;
          default:
            alert(`로그인 오류가 발생했습니다 (${error.code}).`);
        }
      } else {
        console.error("Unexpected login error:", error);
        alert("알 수 없는 로그인 오류가 발생했습니다.");
      }
    }
  };

  const handleQuickRestore = async () => {
    if (!storedSession) return;
    setIsLoading(true);
    const ip = await getClientIp();
    await saveUserSession(storedSession, true);
    if (onLoginSuccess) {
      onLoginSuccess(storedSession, ip);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-slate-100 relative overflow-hidden">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-indigo-600" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Shelter Management ERP</h1>
          <p className="text-slate-500 text-sm">보호소 통합 관리 시스템에 오신 것을 환영합니다.</p>
        </div>

        {/* IP 정보 및 자동 접속 안내 패널 */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <Globe size={14} /> 현재 접속 IP
            </span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">{currentIp}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            한 번 로그인하면 **동일 IP 및 기기 환경**에서 매번 구글 로그인창 없이 바로 시스템에 진입할 수 있습니다.
          </p>
        </div>

        {/* 이전 세션이 있는 경우 즉시 접속 버튼 */}
        {storedSession && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-black text-emerald-900">이전 로그인 계정 감지됨</p>
                <p className="text-[11px] text-emerald-700 font-medium truncate">{storedSession.email} ({storedSession.displayName || '사용자'})</p>
              </div>
            </div>
            <button
              onClick={handleQuickRestore}
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Zap size={14} />
              이 계정으로 즉시 자동 진입하기
            </button>
          </div>
        )}

        {/* 구글 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-slate-700">Google 계정으로 로그인</span>
        </button>

        {/* 동일 IP 자동 로그인 옵션 체크박스 */}
        <label className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberIp}
            onChange={(e) => setRememberIp(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>동일 IP/기기 접속 시 로그인 절차 없이 자동 유지</span>
        </label>

        <p className="text-[0.625rem] text-slate-400">
          계속 진행함으로써 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
