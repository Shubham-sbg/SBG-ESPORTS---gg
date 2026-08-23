import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidSession(true);
      else setError('Invalid or expired reset link. Please request a new one.');
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setDone(true);
        setTimeout(() => navigate('/sbg-admin'), 3000);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="h-16 w-16 mx-auto mb-5 rounded-2xl flex items-center justify-center font-black text-2xl text-white"
            style={{ background: 'linear-gradient(135deg, #ff6b00, #e94560)', boxShadow: '0 0 40px #ff6b0044' }}>
            SBG
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white mb-1">{PUBLIC_BRAND_NAME}</h1>
          <p className="text-xs text-gray-500 tracking-[0.3em] uppercase">Password Reset</p>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 backdrop-blur-sm">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
              {!validSession && (
                <a href="/player-login" className="ml-auto text-orange-400 hover:underline whitespace-nowrap">Back to Login</a>
              )}
            </div>
          )}

          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-3xl">
                ✅
              </div>
              <h2 className="text-lg font-black text-white">Password Updated!</h2>
              <p className="text-sm text-gray-400">Your password has been changed successfully. Redirecting to login…</p>
            </div>
          ) : validSession ? (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white mb-1">Set New Password</h2>
                <p className="text-xs text-gray-500">Choose a strong password with at least 8 characters.</p>
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="inp pr-12"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="inp"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>

              {password && (
                <div className="space-y-1">
                  {[
                    { ok: password.length >= 8, label: 'At least 8 characters' },
                    { ok: /[A-Z]/.test(password), label: 'One uppercase letter' },
                    { ok: /[0-9]/.test(password), label: 'One number' },
                    { ok: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
                  ].map(r => (
                    <div key={r.label} className={`text-xs flex items-center gap-2 ${r.ok ? 'text-green-400' : 'text-gray-600'}`}>
                      <span>{r.ok ? '✓' : '○'}</span> {r.label}
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'UPDATING...' : 'UPDATE PASSWORD →'}
              </button>
            </form>
          ) : null}
        </div>

        <p className="text-center text-xs text-gray-700 mt-6 tracking-widest">
          PROTECTED BY SUPABASE AUTHENTICATION
        </p>
      </div>
    </div>
  );
}
