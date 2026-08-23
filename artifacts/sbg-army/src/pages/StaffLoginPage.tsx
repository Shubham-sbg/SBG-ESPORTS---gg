import { useState } from 'react';
import { useLocation } from 'wouter';
import { createStaffSession, ADMIN_MODULES } from '@/lib/auth';
import type { AdminModule } from '@/lib/auth';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

export default function StaffLoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Always authenticate via the server — the client DB has passwords scrubbed for security.
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let data: {
        success: boolean; error?: string;
        token?: string; role?: 'admin' | 'staff';
        name?: string; email?: string; allowedModules?: string[];
      };

      try {
        data = await res.json();
      } catch {
        setError('Server returned an unexpected response. Please try again.');
        return;
      }

      if (!data.success) {
        setError(data.error ?? 'Invalid credentials.');
        return;
      }

      const role = data.role ?? 'staff';
      const name = data.name ?? '';
      const serverEmail = data.email ?? email.trim();
      const allowedModules: AdminModule[] =
        role === 'admin'
          ? ADMIN_MODULES as AdminModule[]
          : (data.allowedModules?.filter((m): m is AdminModule => m !== '*') ?? []);

      // Persist staff session token for future authenticated API calls
      if (data.token) {
      }

      createStaffSession(serverEmail, role, allowedModules, name);
      navigate('/staff-dashboard');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', 'Barlow Condensed', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: '16px',
        padding: '40px 32px',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👔</div>
          <h1 style={{ color: '#00d4ff', fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '3px' }}>
            STAFF LOGIN
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '8px 0 0', letterSpacing: '1px' }}>
            {ADMIN_BRAND_NAME} — Staff Portal
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#00d4ff', fontSize: '11px', letterSpacing: '2px', marginBottom: '8px' }}>
              STAFF EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#00d4ff', fontSize: '11px', letterSpacing: '2px', marginBottom: '8px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(233, 69, 96, 0.15)', border: '1px solid rgba(233,69,96,0.5)',
              borderRadius: '8px', padding: '12px 16px', color: '#e94560',
              fontSize: '13px', marginBottom: '16px', textAlign: 'center',
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: loading ? 'rgba(0,212,255,0.3)' : 'linear-gradient(135deg, #00d4ff, #0090c0)',
              border: 'none', color: '#000', fontSize: '15px', fontWeight: 700,
              letterSpacing: '2px', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px',
            }}
          >
            {loading && (
              <span style={{
                width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.4)',
                borderTopColor: '#000', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
            )}
            {loading ? 'VERIFYING...' : 'LOGIN'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', textDecoration: 'none' }}>
            ← Back to Website
          </a>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
