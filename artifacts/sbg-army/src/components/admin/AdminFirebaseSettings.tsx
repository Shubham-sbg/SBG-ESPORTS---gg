import { useState, useEffect } from 'react';

const GOLD = '#d4af37';

interface AdminSession {
  email: string;
  name: string;
  role: string;
}

function getAdminSession(): AdminSession | null {
  try {
    return (window as unknown as Record<string, unknown>).__sbgAdminSession as AdminSession | null ?? null;
  } catch {
    return null;
  }
}

function getTokenExpiry(): string {
  try {
    const token = '';
    if (!token) return 'N/A';
    const parts = token.split('.');
    if (parts.length !== 3) return 'N/A';
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) return 'N/A';
    const diff = payload.exp * 1000 - Date.now();
    if (diff < 0) return 'EXPIRED';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  } catch {
    return 'N/A';
  }
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="text-xs font-black text-gray-500 uppercase tracking-widest w-36">{label}</div>
      <div className={`flex-1 text-sm text-gray-300 truncate mx-4 ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
      <button onClick={copy} className="text-[10px] font-bold px-2 py-1 rounded transition-colors"
        style={{ color: copied ? GOLD : 'rgba(107,114,128,1)', background: copied ? 'rgba(212,175,55,0.1)' : '' }}>
        {copied ? 'COPIED' : 'COPY'}
      </button>
    </div>
  );
}

function AuthLog() {
  const [events, setEvents] = useState<{ time: string; event: string; email: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('sbg_auth_log');
    const parsed: { time: string; event: string; email: string }[] = stored ? JSON.parse(stored) : [];
    setEvents(parsed.reverse().slice(0, 20));

    const session = getAdminSession();
    const entry = {
      time: new Date().toLocaleString(),
      event: 'Admin Panel View — Auth Settings',
      email: session?.email || 'unknown',
    };
    const updated = [entry, ...parsed].slice(0, 50);
    localStorage.setItem('sbg_auth_log', JSON.stringify(updated));
  }, []);

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      {events.length === 0 ? (
        <p className="text-sm text-gray-600">No events logged yet.</p>
      ) : (
        events.map((e, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 text-xs">
            <span className="text-gray-600 whitespace-nowrap">{e.time}</span>
            <span className="text-gray-400 flex-1">{e.event}</span>
            <span className="text-gray-600 truncate max-w-[140px]">{e.email}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminFirebaseSettings() {
  const session = getAdminSession();
  const expiry = getTokenExpiry();

  // Firebase config state
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [measurementId, setMeasurementId] = useState('');
  const [serviceAccount, setServiceAccount] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Firestore & system health states
  const [health, setHealth] = useState<{
    connected: boolean;
    lastSync: string | null;
    lastWrite: string | null;
    lastError: string | null;
    databaseId: string;
    projectId: string;
    dbConnected: boolean;
  } | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Fetch Firebase config from the site settings API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/settings/firebase');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        
        if (data.apiKey) setApiKey(data.apiKey);
        if (data.authDomain) setAuthDomain(data.authDomain);
        if (data.projectId) setProjectId(data.projectId);
        if (data.storageBucket) setStorageBucket(data.storageBucket);
        if (data.messagingSenderId) setMessagingSenderId(data.messagingSenderId);
        if (data.appId) setAppId(data.appId);
        if (data.measurementId) setMeasurementId(data.measurementId);
        if (data.serviceAccount) setServiceAccount(data.serviceAccount);
      } catch (err: any) {
        setError(err.message || 'Error loading Firebase settings');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Fetch Firestore health state for super_admin
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const token = '';
        const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/admin/firestore-health', { credentials: "include",
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch {}
    };
    if (session?.role === 'super_admin') {
      fetchHealth();
    }
  }, [session]);

  const handleFullSync = async () => {
    setSyncingAll(true);
    setSyncMessage('');
    try {
      const token = '';
      const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/admin/firestore-sync-all', { credentials: "include",
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage('Database projection fully synchronized.');
        // Refresh health status
        const resH = await fetch((import.meta.env.VITE_API_URL || "") + '/api/admin/firestore-health', { credentials: "include",
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resH.ok) setHealth(await resH.json());
      } else {
        setSyncMessage(data.error || 'Failed to sync database projections.');
      }
    } catch {
      setSyncMessage('Failed to trigger database projection sync.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSaveFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    // Validate service account JSON if populated
    if (serviceAccount.trim()) {
      try {
        JSON.parse(serviceAccount);
      } catch {
        setError('Invalid Service Account JSON format. Please verify spelling, brackets, and quotes.');
        setSaving(false);
        return;
      }
    }

    try {
      const token = '';
      const payload = {
        settings: [
          { key: "firebase.apiKey", value: apiKey, section: "firebase", label: "API Key", type: "string" },
          { key: "firebase.authDomain", value: authDomain, section: "firebase", label: "Auth Domain", type: "string" },
          { key: "firebase.projectId", value: projectId, section: "firebase", label: "Project ID", type: "string" },
          { key: "firebase.storageBucket", value: storageBucket, section: "firebase", label: "Storage Bucket", type: "string" },
          { key: "firebase.messagingSenderId", value: messagingSenderId, section: "firebase", label: "Messaging Sender ID", type: "string" },
          { key: "firebase.appId", value: appId, section: "firebase", label: "App ID", type: "string" },
          { key: "firebase.measurementId", value: measurementId, section: "firebase", label: "Measurement ID", type: "string" },
          { key: "firebase.serviceAccount", value: serviceAccount, section: "firebase", label: "Service Account JSON", type: "password" }
        ]
      };

      const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/settings/bulk', { credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save Firebase configuration');
      }

      setSuccess('Firebase settings saved successfully. System status holds healthy connections.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (!confirm('Sign out of admin panel?')) return;
    try { fetch((import.meta.env.VITE_API_URL || "") + '/api/admin/logout', { credentials: 'include' }).catch(() => {}); } catch {}
    const guardLogout = (window as unknown as Record<string, unknown>).__sbgAdminLogout;
    if (typeof guardLogout === 'function') (guardLogout as () => void)();
    window.location.href = '/sbg-admin';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-widest">AUTH & FIREBASE SETTINGS</h2>
        <p className="text-xs text-gray-500 mt-1">
          Configure Firebase Web SDK for the front-end, Google Service Accounts for the backend, and view admin session state.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white/3 border rounded-xl p-4 text-center"
          style={{ borderColor: session ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
          <div className="text-2xl mb-2">{session ? '🔐' : '🔓'}</div>
          <div className="text-xs font-black uppercase tracking-widest mb-1"
            style={{ color: session ? '#10b981' : '#f87171' }}>
            {session ? 'AUTHENTICATED' : 'NOT SIGNED IN'}
          </div>
          <div className="text-xs text-gray-600">JWT Session</div>
        </div>

        <div className="bg-white/3 border border-gold/15 rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">🔑</div>
          <div className="font-black text-sm text-white mb-1 uppercase tracking-widest">
            {session?.role ?? '—'}
          </div>
          <div className="text-xs text-gray-600">Admin Role</div>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">⏱️</div>
          <div className="font-black text-sm text-gold mb-1">{expiry}</div>
          <div className="text-xs text-gray-600">Token Expires In</div>
        </div>
      </div>

      {/* Firestore & System Database Health Panel (Visible to Super Admin) */}
      {session?.role === 'super_admin' && health && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              📊 Database & Firestore Sync Health
            </h3>
            <button 
              onClick={handleFullSync} 
              disabled={syncingAll}
              className="text-[10px] font-black uppercase tracking-widest bg-gold/10 text-gold border border-gold/20 px-3 py-1.5 rounded-lg hover:bg-gold/20 disabled:opacity-50 transition-all"
            >
              {syncingAll ? '🔄 SYNCING...' : '⚡ FORCE FULL SYNC'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Firestore Service</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${health.connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                <span className="text-xs font-black text-gray-200">{health.connected ? 'ONLINE' : 'UNAVAILABLE'}</span>
              </div>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Primary DB</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${health.dbConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                <span className="text-xs font-black text-gray-200">{health.dbConnected ? 'POSTGRESQL' : 'SQLITE FALLBACK'}</span>
              </div>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Last Sync Status</span>
              <div className="text-xs font-mono font-bold text-gray-300 mt-1 truncate">
                {health.lastSync ? new Date(health.lastSync).toLocaleTimeString() : 'NEVER'}
              </div>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Last Sync Document</span>
              <div className="text-xs font-mono text-gray-400 mt-1 truncate">
                {health.lastWrite || '—'}
              </div>
            </div>
          </div>

          {health.lastError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 font-mono">
              <strong>Synchronization Error:</strong> {health.lastError}
            </div>
          )}

          {syncMessage && (
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 text-xs text-gold font-bold">
              {syncMessage}
            </div>
          )}
        </div>
      )}

      {/* Firebase Config Editor */}
      <div className="bg-white/3 border border-gold/15 rounded-2xl p-5">
        <h3 className="text-xs font-black text-gold uppercase tracking-widest mb-4 flex items-center gap-2">
          🔥 Firebase Credentials Manager
        </h3>

        {loading ? (
          <p className="text-xs text-gray-500">Loading settings from secure store...</p>
        ) : (
          <form onSubmit={handleSaveFirebase} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">API Key</label>
                <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} 
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Auth Domain</label>
                <input type="text" value={authDomain} onChange={e => setAuthDomain(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold/50" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Project ID</label>
                <input type="text" value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Storage Bucket</label>
                <input type="text" value={storageBucket} onChange={e => setStorageBucket(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Messaging Sender ID</label>
                <input type="text" value={messagingSenderId} onChange={e => setMessagingSenderId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold/50" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">App ID</label>
                <input type="text" value={appId} onChange={e => setAppId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Measurement ID (Optional)</label>
                <input type="text" value={measurementId} onChange={e => setMeasurementId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold/50" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Service Account JSON</label>
              <textarea value={serviceAccount} onChange={e => setServiceAccount(e.target.value)} rows={6}
                className="w-full font-mono text-xs bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-gold/50"
                placeholder='{ "type": "service_account", "project_id": "...", "private_key": "..." }' />
            </div>

            {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
            {success && <p className="text-xs text-emerald-400 font-bold">{success}</p>}

            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-gold text-black rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2">
              {saving ? '⚙️ SAVING...' : '💾 SAVE CONFIGURATION'}
            </button>
          </form>
        )}
      </div>

      {/* Current session */}
      {session && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Current Admin Session</h3>
          <div className="space-y-0 divide-y divide-white/5">
            <InfoRow label="Name" value={session.name} />
            <InfoRow label="Email" value={session.email} />
            <InfoRow label="Role" value={session.role} />
            <InfoRow label="Auth Method" value="Local bcrypt + JWT" />
          </div>
          <button onClick={handleLogout}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors">
            🔒 SIGN OUT
          </button>
        </div>
      )}

      {/* Auth system info */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Authentication System</h3>
        <InfoRow label="Method" value="bcrypt password hash + signed JWT" />
        <InfoRow label="Token TTL" value="8 hours (server-enforced)" />
        <InfoRow label="Storage" value="sessionStorage (tab-scoped)" />
        <InfoRow label="Verify endpoint" value="/api/admin/verify" mono />
        <InfoRow label="Login endpoint" value="/api/admin/login" mono />
        <div className="mt-4 p-3 rounded-xl text-xs text-gray-600"
          style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
          🔒 Admin credentials are stored server-side as bcrypt hashes. JWTs are signed with SESSION_SECRET and verified on every request.
          No client-side trust — the server validates every action.
        </div>
      </div>

      {/* Staff management note */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Admin Accounts</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Manage admin accounts and roles in the <span className="text-gold font-black">User Roles</span> section of the sidebar.
          New admin accounts are created via the first-time setup flow or the staff manager.
        </p>
      </div>

      {/* Audit log */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Session Audit Log</h3>
        <AuthLog />
      </div>
    </div>
  );
}
