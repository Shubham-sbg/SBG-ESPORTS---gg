import { useEffect, useRef, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { registerPlayer } from '@/lib/playerAuth';
import { verifyPlayerSession } from '@/lib/playerAuth';
import Combobox from '@/components/shared/Combobox';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const GAMES = ['FREE FIRE', 'BGMI', 'VALORANT', 'COD MOBILE', 'PUBG MOBILE', 'APEX LEGENDS', 'OTHER'];

export default function PlayerRegisterPage() {
  const { db } = useDatabase();
  const tracked = useRef(false);
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', username: '', uid: '',
    game: 'FREE FIRE', whatsapp: '', country: 'India',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    applyTheme(db.settings);
    if (!tracked.current) { tracked.current = true; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/player-dashboard';
    });
  }, [db.settings]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password || !form.username.trim() || !form.uid.trim() || !form.whatsapp.trim()) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      const result = await registerPlayer({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim(),
        uid: form.uid.trim(),
        game: form.game,
        whatsapp: form.whatsapp.trim(),
        country: form.country.trim(),
      });
      if (!result.success) { setError(result.error || 'Registration failed.'); return; }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/player-dashboard'; }, 1500);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
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
      setError(result.error || 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  const inp = 'inp';
  const label = 'label';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-xl my-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
              🎮 Create Account
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Join {PUBLIC_BRAND_NAME}</h1>
            <p className="text-gray-400 text-sm">Create your player profile to register for tournaments and shop</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-8 space-y-5">
            {success ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-black text-2xl text-white mb-2">Account Created!</h3>
                <p className="text-gray-400 text-sm">Welcome to {PUBLIC_BRAND_NAME}. Redirecting to your dashboard...</p>
              </div>
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
                      Sign up with Google
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-gray-500">or register with email</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                  </>
                )}

                <form onSubmit={submit} className="space-y-5">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Account Credentials</p>
                  </div>

                  <div className="col-span-2">
                    <label className={label}>Email Address *</label>
                    <input className={inp} type="email" placeholder="your@email.com" value={form.email}
                      onChange={e => set('email', e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={label}>Password *</label>
                      <div className="relative">
                        <input className={`${inp} pr-10`} type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                          value={form.password} onChange={e => set('password', e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          {showPass ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={label}>Confirm Password *</label>
                      <input className={inp} type="password" placeholder="Repeat password" value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)} required />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Player Profile</p>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={label}>Username *</label>
                      <input className={inp} placeholder="Choose a username" value={form.username}
                        onChange={e => set('username', e.target.value)} required />
                    </div>
                    <div>
                      <label className={label}>Game UID *</label>
                      <input className={inp} placeholder="Your in-game UID" value={form.uid}
                        onChange={e => set('uid', e.target.value)} required />
                    </div>
                    <div>
                      <label className={label}>Preferred Game</label>
                      <Combobox className={inp} value={form.game} onChange={e => set('game', e.target.value)}>
                        {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                      </Combobox>
                    </div>
                    <div>
                      <label className={label}>WhatsApp *</label>
                      <input className={inp} placeholder="+91 9876543210" value={form.whatsapp}
                        onChange={e => set('whatsapp', e.target.value)} required />
                    </div>
                    <div>
                      <label className={label}>Country</label>
                      <input className={inp} placeholder="India" value={form.country}
                        onChange={e => set('country', e.target.value)} />
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black disabled:opacity-50 transition-all"
                    style={{ background: 'var(--sbg-primary, #ff6b00)' }}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Already registered?{' '}
                    <a href="/player-login" className="text-orange-400 hover:underline font-semibold">Login here</a>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
