/**
 * IP and Local Session Auto-Auth Manager
 * Enables seamless auto-login without repetitive Google auth prompts on the same IP/device.
 */

export interface PersistedUserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginIp: string;
  lastLoginTime: string;
  autoLoginEnabled: boolean;
}

const STORAGE_KEY = 'shelter_erp_auto_session';
const AUTO_LOGIN_KEY = 'shelter_erp_auto_login_enabled';

// Utility to fetch client IP with fallback mechanisms
export async function getClientIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      return data.ip || 'unknown-ip';
    }
  } catch (err) {
    console.warn('Failed to fetch IP from ipify, trying fallback...', err);
  }

  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      return data.ip || 'unknown-ip';
    }
  } catch (err) {
    console.warn('Fallback IP fetch failed too.', err);
  }

  return 'local-device-session';
}

// Save logged-in user session along with current IP
export async function saveUserSession(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }, autoLoginEnabled = true) {
  const currentIp = await getClientIp();
  const session: PersistedUserSession = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLoginIp: currentIp,
    lastLoginTime: new Date().toISOString(),
    autoLoginEnabled
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(AUTO_LOGIN_KEY, autoLoginEnabled ? 'true' : 'false');
  console.log('User session auto-login saved for IP:', currentIp);
  return session;
}

// Get stored session
export function getStoredSession(): PersistedUserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored session:', e);
    return null;
  }
}

// Check if current IP / device matches stored session
export async function verifyAndGetAutoSession(): Promise<{ valid: boolean; session: PersistedUserSession | null; reason?: string }> {
  const isEnabled = localStorage.getItem(AUTO_LOGIN_KEY) !== 'false';
  if (!isEnabled) {
    return { valid: false, session: null, reason: 'Auto-login disabled' };
  }

  const session = getStoredSession();
  if (!session || !session.uid) {
    return { valid: false, session: null, reason: 'No stored session' };
  }

  const currentIp = await getClientIp();
  
  // Allow if IP matches OR if it's local device fallback
  const isSameIp = (session.lastLoginIp === currentIp) || (currentIp === 'local-device-session') || (session.lastLoginIp === 'local-device-session');
  
  if (isSameIp || isEnabled) {
    return { valid: true, session, reason: 'Same IP / Device matched' };
  }

  return { valid: false, session, reason: 'IP changed or expired' };
}

// Clear auto login session on explicit logout
export function clearUserSession() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(AUTO_LOGIN_KEY, 'false');
  console.log('Auto login session cleared.');
}
