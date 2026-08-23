import { useEffect, useRef, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { loginPlayer } from '@/lib/playerAuth';
import { verifyPlayerSession } from '@/lib/playerAuth';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

export default function PlayerLoginPage() {
  const { db, loading } = useDatabase();
  const tracked = useRef(false);
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    applyTheme(db.settings);
    if (!tracked.current) { tracked.current = true; }
  }, [db.settings]);

  useEffect(() => {
    if (!loading) {
      verifyPlayerSession().then(u => { if (u) window.location.href = '/player-dashboard'; });
    }
  }, [loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.emailOrUsername.trim() || !form.password) {
      setError('Please enter your email/username and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const result = await playerLogin(form.emailOrUsername, form.password);
      if (!result.success) {
        setError(result.error || 'Login failed.');
        return;
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/player-dashboard'; }, 800);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabaseConfigured || db.settings.googleLoginEnabled === false) {
      setError('Google login is not available. Please use email and password.');
      return;
    }
    setGoogleLoading(true);
    setError('');
    const result = await googleLogin();
    if (!result.success) {
      setError(result.error || 'Google login failed. Ensure Google OAuth is enabled in Supabase settings.');
      setGoogleLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail.trim()) { setError('Please enter your email.'); return; }
    setAuthLoading(true);
    const result = await forgotPassword(forgotEmail.trim());
    setAuthLoading(false);
    if (result.success) {
      setForgotSent(true);
    } else {
      setError(result.error || 'Failed to send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-24 pb-20 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
              👤 Player Login
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Login to your {PUBLIC_BRAND_NAME} player account</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-8 space-y-5">
            {success ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white font-bold">Login successful! Redirecting...</p>
              </div>
            ) : forgotMode ? (
              <>
                <div>
                  <h2 className="text-lg font-black text-white mb-1">Reset Password</h2>
                  <p className="text-xs text-gray-500">We'll send a reset link to your email.</p>
                </div>
                {forgotSent ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">📧</div>
                    <p className="text-green-400 font-bold text-sm">Reset link sent!</p>
                    <p className="text-gray-500 text-xs mt-1">Check your inbox and follow the instructions.</p>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className="label">Email Address</label>
                      <input className="inp" type="email" placeholder="your@email.com" value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)} required />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" disabled={authLoading}
                      className="w-full py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black bg-orange-500 hover:bg-orange-400 disabled:opacity-50 transition-all">
                      {authLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                )}
                <button onClick={() => { setForgotMode(false); setError(''); setForgotSent(false); }}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  ← Back to Login
                </button>
              </>
            ) : (
              <>
                {supabaseConfigured && db.settings.googleLoginEnabled !== false && (
                  <>
                    <button onClick={handleGoogle} disabled={googleLoading}
                      className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                      {googleLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.3C29.3 35.3 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C41.3 35.3 44 30 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg>
                      )}
                      Continue with Google
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-gray-500">or</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                  </>
                )}

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="label">Email or Username</label>
                    <input className="inp" placeholder="your@email.com or username" value={form.emailOrUsername}
                      onChange={e => setForm(f => ({ ...f, emailOrUsername: e.target.value }))} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="label !mb-0">Password</label>
                      <button type="button" onClick={() => setForgotMode(true)}
                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input className="inp pr-12" type={showPass ? 'text' : 'password'} placeholder="Enter password"
                        value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button type="submit" disabled={authLoading}
                    className="w-full py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black bg-orange-500 hover:bg-orange-400 disabled:opacity-50 transition-all"
                    style={{ background: 'var(--sbg-primary, #ff6b00)' }}>
                    {authLoading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-500">
                  No account?{' '}
                  <a href="/player-register" className="text-orange-400 hover:underline font-semibold">Register here</a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
