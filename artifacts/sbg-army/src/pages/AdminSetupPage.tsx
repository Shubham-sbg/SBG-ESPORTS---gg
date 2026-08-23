import { useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

const SETUP_CODE = import.meta.env.VITE_SETUP_CODE as string;

type Step = 'code' | 'create' | 'success' | 'error';

export default function AdminSetupPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const checkCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === SETUP_CODE) {
      setStep('create');
      setMsg('');
    } else {
      setMsg('Invalid setup code. Please try again.');
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (password.length < 8) { setMsg('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setMsg('Passwords do not match.'); return; }
    setLoading(true);

    try {
      // Step 1: Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered') ||
            signUpError.message.toLowerCase().includes('already been registered')) {
          // User exists in Auth — try to sign in and set role
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (signInError) {
            setMsg('This email is already registered. Please use the correct password or reset it at /login.');
            setLoading(false);
            return;
          }
          if (signInData.user) {
            await upsertAdminRole(signInData.user.id, email.trim().toLowerCase());
            return;
          }
        }
        setMsg(signUpError.message);
        setLoading(false);
        return;
      }

      if (!signUpData.user) {
        setMsg('Account creation failed. Please try again.');
        setLoading(false);
        return;
      }

      // Step 2: Insert admin role
      await upsertAdminRole(signUpData.user.id, email.trim().toLowerCase());

      // Check if email confirmation is needed
      if (!signUpData.session) {
        setNeedsConfirm(true);
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        setMsg('Connection error — cannot reach Supabase. Make sure your Supabase project is active.');
      } else {
        setMsg(msg);
      }
      setLoading(false);
    }
  };

  const upsertAdminRole = async (userId: string, userEmail: string) => {
    const { error: roleError } = await supabase.from('users').upsert({
      id: userId,
      email: userEmail,
      username: 'sbg_admin',
      role: 'admin',
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (roleError) {
      // Role table might not exist yet — still show success since Auth account was created
      setMsg(`Auth account created! But role table error: ${roleError.message}. Run the SQL migration first, then try again.`);
      setLoading(false);
      return;
    }

    setStep('success');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto mb-5 rounded-2xl flex items-center justify-center font-black text-2xl text-white"
            style={{ background: 'linear-gradient(135deg, #ff6b00, #e94560)', boxShadow: '0 0 40px #ff6b0044' }}>
            SBG
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white mb-1">${ADMIN_BRAND_NAME}</h1>
          <p className="text-xs text-orange-400 tracking-[0.3em] uppercase">Admin Account Setup</p>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 backdrop-blur-sm">

          {/* ── STEP 1: Enter setup code ── */}
          {step === 'code' && (
            <form onSubmit={checkCode} className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white mb-1">🔑 Enter Setup Code</h2>
                <p className="text-xs text-gray-500">This is a one-time admin setup. Enter the secret code from your .env file.</p>
              </div>
              {msg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">⚠ {msg}</div>
              )}
              <div>
                <label className="label">Setup Code</label>
                <input
                  type="password"
                  className="inp"
                  placeholder="Enter setup code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase bg-orange-500 text-black hover:bg-orange-400 transition-colors">
                VERIFY CODE →
              </button>
            </form>
          )}

          {/* ── STEP 2: Create admin account ── */}
          {step === 'create' && (
            <form onSubmit={createAdmin} className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white mb-1">🛡️ Create Admin Account</h2>
                <p className="text-xs text-gray-500">This account will have full admin access to the control panel.</p>
              </div>
              {msg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-relaxed">⚠ {msg}</div>
              )}
              <div>
                <label className="label">Admin Email</label>
                <input
                  type="email"
                  className="inp"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="label">Password (min 8 characters)</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="inp pr-12"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
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
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { ok: password.length >= 8, label: '8+ characters' },
                    { ok: /[A-Z]/.test(password), label: 'Uppercase letter' },
                    { ok: /[0-9]/.test(password), label: 'Number' },
                    { ok: /[^A-Za-z0-9]/.test(password), label: 'Special character' },
                  ].map(r => (
                    <div key={r.label} className={`text-xs flex items-center gap-1 ${r.ok ? 'text-green-400' : 'text-gray-600'}`}>
                      <span>{r.ok ? '✓' : '○'}</span> {r.label}
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase bg-orange-500 text-black hover:bg-orange-400 transition-colors disabled:opacity-50">
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ADMIN ACCOUNT →'}
              </button>
            </form>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-3xl">
                ✅
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-2">Admin Account Created!</h2>
                {needsConfirm ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm text-left">
                      <p className="font-bold mb-1">📧 Email Confirmation Required</p>
                      <p>Check <strong>{email}</strong> for a confirmation email from Supabase.</p>
                      <p className="mt-1 text-xs text-gray-400">After confirming, come back and login at /login</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Your admin account is ready. You can now log in.</p>
                )}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-black text-sm tracking-widest uppercase bg-orange-500 text-black hover:bg-orange-400 transition-colors">
                GO TO LOGIN →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-5 tracking-widest">
          ONE-TIME SETUP · PROTECTED BY SETUP CODE
        </p>
      </div>
    </div>
  );
}
