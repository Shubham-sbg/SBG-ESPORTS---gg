/**
 * AdminGuard (SBG PRO) — Same JWT-based auth as SBG ARMY.
 *
 * Auth flow:
 *  1. On mount: read JWT from sessionStorage, verify via GET /api/admin/verify.
 *     Server validates signature + expiry — client cannot forge access.
 *  2. Login form calls POST /api/admin/login (bcrypt on server) → receives JWT.
 *  3. JWT stored in sessionStorage (tab-only, 8h TTL enforced server-side).
 *  4. Logout clears token; no client-side role trust.
 *
 * Uses the same API server as SBG ARMY — one login, all sites.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOKEN_KEY = 'sbg_admin_token';
// API server always serves /api at root — never prefix with the app sub-path.
const BASE = '';

export const WRITE_ROLES = ['super_admin', 'admin'];
export const ADMIN_ROLES = [
  'super_admin', 'admin', 'tournament_admin', 'media_admin',
  'content_editor', 'moderator', 'viewer',
];

interface AdminSession {
  email: string;
  name: string;
  role: string;
  token: string;
}

function getStoredToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function saveToken(token: string) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
}
function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
}

async function verifyToken(token: string): Promise<AdminSession | null> {
  try {
    const res = await fetch(`${BASE}/api/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; email: string; name: string; role: string };
    if (!data.success || !ADMIN_ROLES.includes(data.role)) return null;
    return { email: data.email, name: data.name, role: data.role, token };
  } catch {
    return null;
  }
}

async function refreshJwt(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/admin/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; token?: string };
    return data.success && data.token ? data.token : null;
  } catch { return null; }
}

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

type AuthState = 'checking' | 'login' | 'granted';

interface Props { children: React.ReactNode }

// ── Login Form ────────────────────────────────────────────────────────────────
function AdminLoginForm({ onGranted }: { onGranted: (s: AdminSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, password }),
      });
      const data = await res.json();
      if (data.success && data.token && ADMIN_ROLES.includes(data.role)) {
        saveToken(data.token);
        onGranted({ email: data.email, name: data.name, role: data.role, token: data.token });
      } else {
        setError(data.error ?? 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060611 0%, #0d0d1a 50%, #060611 100%)' }}>
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,107,0,0.5), transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mx-auto mb-6 flex items-center justify-center"
            style={{ width: 96, height: 96 }}
          >
            <div className="h-24 w-24 rounded-2xl flex items-center justify-center font-black text-3xl text-white relative z-10"
              style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c00 50%, #e55e00 100%)', boxShadow: '0 0 60px rgba(255,107,0,0.5)' }}>
              PRO
            </div>
            <div className="absolute -inset-2 rounded-2xl border animate-ping pointer-events-none"
              style={{ borderColor: 'rgba(255,107,0,0.35)', animationDuration: '2s' }} />
          </motion.div>
          <h1 className="text-3xl font-orbitron font-black text-white mb-2 tracking-widest">SBG PRO</h1>
          <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-3" style={{ color: '#ff6b00' }}>
            ENTERPRISE PLATFORM
          </p>
          <p className="text-[9px] text-slate-600 tracking-[0.4em] uppercase font-bold">ADMIN PANEL · AUTHORIZED ACCESS ONLY</p>
        </div>

        <div className="relative border rounded-2xl p-8 backdrop-blur-sm shadow-[0_25px_80px_rgba(0,0,0,0.9)]"
          style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,107,0,0.12)' }}>
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,107,0,0.25), transparent)' }} />

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span>⚠</span><span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <h2 className="text-base font-black text-white mb-1 tracking-widest uppercase font-orbitron">Sign In</h2>
              <p className="text-xs text-slate-600 font-inter">Use your SBG admin credentials.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(255,107,0,0.7)' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sbgarmy.com" required autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm font-inter placeholder-slate-700 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase mb-2"
                  style={{ color: 'rgba(255,107,0,0.7)' }}>Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••" required autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm font-inter placeholder-slate-700 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,107,0,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 text-lg">
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-black tracking-widest uppercase text-white font-orbitron transition-all duration-200 disabled:opacity-50 hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #ff6b00, #e55e00)', boxShadow: loading ? 'none' : '0 0 30px rgba(255,107,0,0.3)' }}>
              {loading ? 'Verifying…' : 'Access Control Center'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[10px] text-slate-700 tracking-widest uppercase font-bold font-inter">
          SBG PRO Enterprise · Internal Access Only
        </p>
      </motion.div>
    </div>
  );
}

// ── Verifying ─────────────────────────────────────────────────────────────────
function Verifying() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#060611' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
          style={{ borderColor: '#ff6b00', borderTopColor: 'transparent' }} />
        <p className="text-xs font-black tracking-[0.4em] text-slate-600 uppercase font-inter">Verifying access…</p>
      </div>
    </div>
  );
}

// ── Main Guard ────────────────────────────────────────────────────────────────
export default function AdminGuard({ children }: Props) {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    (async () => {
      const token = getStoredToken();
      if (token) {
        const s = await verifyToken(token);
        if (s) { setSession(s); setAuthState('granted'); return; }
        clearToken();
      }
      setAuthState('login');
    })();
  }, []);

  // Auto-refresh JWT
  useEffect(() => {
    if (authState !== 'granted') return;
    const doRefresh = async () => {
      const current = getStoredToken();
      if (!current) return;
      const newToken = await refreshJwt(current);
      if (newToken) {
        saveToken(newToken);
        setSession(prev => prev ? { ...prev, token: newToken } : prev);
      } else {
        clearToken();
        setSession(null);
        setAuthState('login');
      }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') doRefresh(); };
    document.addEventListener('visibilitychange', onVisible);
    const id = window.setInterval(doRefresh, REFRESH_INTERVAL_MS);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [authState]);

  const handleLogout = useCallback(() => {
    clearToken();
    setSession(null);
    setAuthState('login');
  }, []);

  const handleGranted = useCallback((s: AdminSession) => {
    setSession(s);
    setAuthState('granted');
  }, []);

  if (authState === 'checking') return <Verifying />;
  if (authState === 'login') return <AdminLoginForm onGranted={handleGranted} />;

  // Expose logout + session to AdminPage
  if (typeof window !== 'undefined') {
    (window as any).__sbgAdminLogout = handleLogout;
    (window as any).__sbgAdminSession = session;
  }

  return <>{children}</>;
}
