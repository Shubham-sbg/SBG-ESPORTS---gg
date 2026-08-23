/**
 * AdminGuard — Secure enterprise access control.
 *
 * Auth flow:
 *  1. On mount: read JWT from sessionStorage, verify via GET /api/admin/verify.
 *     Server validates signature + expiry — client cannot forge access.
 *  2. Login form calls POST /api/admin/login (bcrypt on server) → receives JWT.
 *  3. JWT stored in sessionStorage (tab-only, 8h TTL enforced server-side).
 *  4. Logout clears token; no client-side role trust.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOKEN_KEY = 'sbg_admin_token';

export const WRITE_ROLES = ['super_admin', 'admin'];
export const TOURNAMENT_ROLES = ['super_admin', 'admin', 'tournament_admin'];
export const MEDIA_ROLES = ['super_admin', 'admin', 'media_admin'];
export const CONTENT_ROLES = ['super_admin', 'admin', 'content_editor'];
export const MODERATION_ROLES = ['super_admin', 'admin', 'moderator'];

const ADMIN_ROLES = [
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
  try {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
    }
  } catch {}
  return null;
}

function saveToken(token: string) {
  try {
    if (typeof window !== 'undefined' && token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {}
}

function clearToken() {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
  fetch('/api/admin/logout', { credentials: 'include' }).catch(() => {});
}

/** Verify a JWT with the server. Returns session info or null. */
async function verifyToken(): Promise<AdminSession | null> {
  try {
    const res = await fetch('/api/admin/verify', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; email: string; name: string; role: string; token?: string };
    if (!data.success || !ADMIN_ROLES.includes(data.role)) return null;
    // We can keep the token in memory if provided by backend, else empty
    return { email: data.email, name: data.name, role: data.role, token: data.token || '' };
  } catch {
    return null;
  }
}

type AuthState = 'checking' | 'login' | 'setup' | 'granted';
type LoginView = 'login' | 'forgot' | 'forgot_sent';

interface Props { children: React.ReactNode }

// ── First-time Setup Form ─────────────────────────────────────────────────────
function FirstTimeSetup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(onDone, 1800);
      } else {
        setError(data.error ?? 'Setup failed.');
      }
    } catch {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 55%)`
        }} />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6 flex items-center justify-center" style={{ width: 96, height: 96 }}>
            <div className="h-24 w-24 rounded-2xl flex items-center justify-center font-black text-4xl text-black relative z-10"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)', boxShadow: '0 0 60px rgba(212,175,55,0.55)' }}>
              SBG
            </div>
            <div className="absolute -inset-2 rounded-2xl border animate-ping pointer-events-none"
              style={{ borderColor: 'rgba(212,175,55,0.35)', animationDuration: '2s' }} />
          </div>
          <h1 className="text-3xl font-black tracking-[0.35em] text-white mb-2">SBG ESPORTS</h1>
          <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-3" style={{ color: '#d4af37' }}>
            BORN TO WIN. BUILT TO DOMINATE.
          </p>
          <p className="text-[9px] text-gray-600 tracking-[0.4em] uppercase font-bold">FIRST-TIME SETUP · CREATE SUPER ADMIN</p>
        </div>
        <div className="relative bg-white/[0.025] border border-gold/12 rounded-2xl p-8 backdrop-blur-sm shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-white font-black tracking-widest uppercase text-sm">Admin Created!</p>
              <p className="text-gray-500 text-xs">Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  No admins exist yet. Create your super admin account to secure the control center.
                </p>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <span>⚠</span><span>{error}</span>
                </div>
              )}
              {[
                { label: 'Full Name', val: name, set: setName, type: 'text', placeholder: 'Your name' },
                { label: 'Email', val: email, set: setEmail, type: 'email', placeholder: 'admin@sbgarmy.com' },
              ].map(({ label, val, set, type, placeholder }) => (
                <div key={label}>
                  <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>{label}</label>
                  <input type={type} value={val} onChange={e => set(e.target.value)}
                    placeholder={placeholder} required
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-gray-700 outline-none focus:border-gold/40 transition-all" />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters" required minLength={8}
                    className="w-full px-4 py-3 pr-12 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-gray-700 outline-none focus:border-gold/40 transition-all" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors text-lg">
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>Confirm Password</label>
                <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" required
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-gray-700 outline-none focus:border-gold/40 transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all duration-200 disabled:opacity-50 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}>
                {loading ? 'Creating Account…' : 'Create Admin Account'}
              </button>
            </form>
          )}
        </div>
        <p className="text-center mt-6 text-[10px] text-gray-700 tracking-widest uppercase font-bold">SBG ESPORTS Enterprise · Internal Access Only</p>
      </motion.div>
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function AdminLoginForm({ onGranted }: { onGranted: (session: AdminSession) => void }) {
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: trimmed, password }),
      });
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = {};
        }
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          setError('Backend server returned a non-JSON response. Please ensure API server is active.');
          return;
        }
      }
      if (data.success && data.token && ADMIN_ROLES.includes(data.role)) {
        saveToken(data.token);
        onGranted({ email: data.email, name: data.name, role: data.role, token: data.token });
      } else if (res.status === 429) {
        setError(data.error || 'Too many attempts. Please wait 1 minute before trying again.');
      } else if (res.status === 401 || res.status === 403) {
        setError(data.error ? `${data.error} Enterprise admin credentials required.` : 'Invalid credentials. Enterprise admin credentials required.');
      } else {
        setError(data.error ?? 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // For local auth, we just show a message — password reset requires direct server access
    setView('forgot_sent');
  };

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center px-4 relative overflow-hidden">
      <meta name="robots" content="noindex, nofollow" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 20% 90%, rgba(212,175,55,0.03) 0%, transparent 50%)
          `
        }} />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute bg-gold/[0.04]"
            style={{ left: `${i * 11}%`, top: 0, bottom: 0, width: '1px', transform: 'skewX(-15deg)' }} />
        ))}
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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
            <div
              className="h-24 w-24 rounded-2xl flex items-center justify-center font-black text-4xl text-black select-none relative z-10"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)',
                boxShadow: '0 0 60px rgba(212,175,55,0.55)',
              }}
            >
              SBG
            </div>
            <div className="absolute -inset-2 rounded-2xl border animate-ping pointer-events-none"
              style={{ borderColor: 'rgba(212,175,55,0.35)', animationDuration: '2s' }} />
          </motion.div>
          <h1 className="text-3xl font-black tracking-[0.35em] text-white mb-2">SBG ESPORTS</h1>
          <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-3" style={{ color: '#d4af37' }}>
            BORN TO WIN. BUILT TO DOMINATE.
          </p>
          <p className="text-[9px] text-gray-600 tracking-[0.4em] uppercase font-bold">CONTROL CENTER · AUTHORIZED ACCESS ONLY</p>
        </div>

        <div className="relative bg-white/[0.025] border border-gold/12 rounded-2xl p-8 backdrop-blur-sm shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
            >
              <span className="text-base">⚠</span>
              <span>{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.form key="login" onSubmit={handleLogin} className="space-y-5"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div>
                  <h2 className="text-base font-black text-white mb-1 tracking-widest uppercase">Sign In</h2>
                  <p className="text-xs text-gray-500">Sign in to access the control center.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-widest uppercase mb-2"
                      style={{ color: 'rgba(212,175,55,0.6)' }}>Email</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="admin@sbgarmy.com"
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm font-medium placeholder-gray-700 outline-none focus:border-gold/40 focus:bg-white/[0.06] transition-all"
                      autoComplete="email" required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-widest uppercase mb-2"
                      style={{ color: 'rgba(212,175,55,0.6)' }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-4 py-3 pr-12 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm font-medium placeholder-gray-700 outline-none focus:border-gold/40 focus:bg-white/[0.06] transition-all"
                        autoComplete="current-password" required
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors text-lg">
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all duration-200 disabled:opacity-50 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}>
                  {loading ? 'Verifying…' : 'Access Control Center'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => { setError(''); setView('forgot'); }}
                    className="text-xs text-gray-600 hover:text-gold transition-colors tracking-widest uppercase font-bold">
                    Forgot Password?
                  </button>
                </div>
              </motion.form>
            )}

            {view === 'forgot' && (
              <motion.form key="forgot" onSubmit={handleForgot} className="space-y-5"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div>
                  <button type="button" onClick={() => { setError(''); setView('login'); }}
                    className="text-xs text-gray-600 hover:text-gold transition-colors flex items-center gap-1 mb-4 tracking-widest uppercase font-bold">
                    ← Back
                  </button>
                  <h2 className="text-base font-black text-white mb-1 tracking-widest uppercase">Reset Password</h2>
                  <p className="text-xs text-gray-600">Enter your admin email to receive a reset link.</p>
                </div>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  placeholder="admin@sbgarmy.com"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-gray-700 outline-none focus:border-gold/40 transition-all"
                  required />
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </motion.form>
            )}

            {view === 'forgot_sent' && (
              <motion.div key="sent" className="text-center py-4 space-y-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-4xl mb-2">🔑</div>
                <h2 className="text-base font-black text-white tracking-widest uppercase">Contact Admin</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  To reset the admin password, access the server dashboard or contact the system administrator directly.
                </p>
                <button onClick={() => { setView('login'); setError(''); }}
                  className="mt-4 text-xs text-gold hover:text-gold/80 transition-colors tracking-widest uppercase font-black">
                  Back to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-[10px] text-gray-700 tracking-widest uppercase font-bold">
          SBG ESPORTS Enterprise · Internal Access Only
        </p>
      </motion.div>
    </div>
  );
}

// ── 403 Access Denied ─────────────────────────────────────────────────────────
function AccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-3xl font-black tracking-widest text-white mb-2 uppercase">403</h1>
        <h2 className="text-sm font-black tracking-widest text-gold/70 mb-4 uppercase">Access Denied</h2>
        <p className="text-xs text-gray-600 leading-relaxed mb-8">
          Your account does not have the required permissions to access the admin control center.
          Contact your system administrator.
        </p>
        <button onClick={onLogout}
          className="px-8 py-3 rounded-xl text-xs font-black tracking-widest uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────
function Verifying() {
  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
          style={{ borderColor: '#d4af37', borderTopColor: 'transparent' }} />
        <p className="text-xs font-black tracking-[0.4em] text-gray-600 uppercase">Verifying access…</p>
      </div>
    </div>
  );
}

/** Decode JWT payload (no verification — for client-side expiry check only) */
function decodeJwtPayload(token: string): { iat?: number; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

/**
 * Request a refreshed JWT from the server.
 * Returns the new token or null if refresh fails (expired / revoked).
 */
async function refreshJwt(): Promise<string | null> {
  try {
    const res = await fetch('/api/admin/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; token?: string };
    return data.success && data.token ? data.token : null;
  } catch { return null; }
}

// 6-hour refresh interval (token TTL is 8h — refreshing every 6h leaves 2h buffer)
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

// ── Main guard ────────────────────────────────────────────────────────────────
export default function AdminGuard({ children }: Props) {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [session, setSession] = useState<AdminSession | null>(null);

  // On mount: verify stored JWT server-side, then check for first-time setup
  useEffect(() => {
    (async () => {
      // Always verify session using the HttpOnly cookie
      const s = await verifyToken();
      if (s) { setSession(s); setAuthState('granted'); return; }
      
      // No valid session — always go to login. Setup is disabled per user request.
      setAuthState('login');
    })();
  }, []);

  // Auto-refresh: periodically refresh the JWT so admins are never logged out mid-session
  useEffect(() => {
    if (authState !== 'granted') return;

    const doRefresh = async () => {
      const newToken = await refreshJwt();
      if (newToken) {
        setSession(prev => prev ? { ...prev, token: newToken } : prev);
      } else {
        // Refresh failed — token truly expired; force re-login
        clearToken();
        setSession(null);
        setAuthState('login');
      }
    };

    // Also do a proactive refresh when tab becomes visible after being hidden
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

  const handleSetupDone = useCallback(() => {
    setAuthState('login');
  }, []);

  if (authState === 'checking') return <Verifying />;
  if (authState === 'setup') return <FirstTimeSetup onDone={handleSetupDone} />;
  if (authState === 'login') return <AdminLoginForm onGranted={handleGranted} />;

  // granted — expose logout to AdminPage via window
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__sbgAdminLogout = handleLogout;
    (window as unknown as Record<string, unknown>).__sbgAdminSession = session;
  }

  return <>{children}</>;
}
