import { useState, useEffect } from 'react';

interface LoginAttempt {
  id: string;
  identifier: string;
  ip: string;
  success: boolean;
  failReason?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ip?: string;
  createdAt: string;
}

export default function AdminSecurityLogs() {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'login' | 'audit'>('login');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = '' || '' || '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [attemptsRes, auditRes] = await Promise.all([
        fetch('/api/security/login-attempts', { credentials: "include", headers }).catch(() => null),
        fetch('/api/security/audit-logs', { credentials: "include", headers }).catch(() => null),
      ]);
      if (attemptsRes?.ok) setLoginAttempts(await attemptsRes.json());
      if (auditRes?.ok) setAuditLogs(await auditRes.json());
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('login')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'login' ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            🔐 LOGIN ATTEMPTS
          </button>
          <button onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'audit' ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            📋 AUDIT LOGS
          </button>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-black hover:text-white transition-colors disabled:opacity-50">
          {loading ? '⟳ Loading...' : '↻ REFRESH'}
        </button>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Attempts', value: loginAttempts.length, color: '#ff6b00', icon: '🔐' },
          { label: 'Successful', value: loginAttempts.filter(a => a.success).length, color: '#10b981', icon: '✅' },
          { label: 'Failed', value: loginAttempts.filter(a => !a.success).length, color: '#e94560', icon: '❌' },
          { label: 'Audit Events', value: auditLogs.length, color: '#00d4ff', icon: '📋' },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span>{s.icon}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Login Attempts Table */}
      {activeTab === 'login' && (
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 bg-white/3 border-b border-white/5 grid grid-cols-12 gap-3 text-xs font-black text-gray-500 tracking-widest uppercase">
            <div className="col-span-3">IDENTIFIER</div>
            <div className="col-span-2 hidden sm:block">IP ADDRESS</div>
            <div className="col-span-2 text-center">STATUS</div>
            <div className="col-span-3 hidden md:block">REASON</div>
            <div className="col-span-2">TIME</div>
          </div>
          {loginAttempts.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <div className="text-4xl mb-3">🔐</div>
              <p>No login attempts recorded yet.</p>
              <p className="text-xs mt-1 text-gray-700">Login attempts will appear here when the PostgreSQL backend is connected.</p>
            </div>
          )}
          {loginAttempts.map((attempt) => (
            <div key={attempt.id} className="grid grid-cols-12 gap-3 px-5 py-3 border-t border-white/5 items-center hover:bg-white/3 transition-colors text-sm">
              <div className="col-span-3 font-bold text-white truncate">{attempt.identifier}</div>
              <div className="col-span-2 hidden sm:block text-gray-500 text-xs">{attempt.ip || '—'}</div>
              <div className="col-span-2 text-center">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${attempt.success ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {attempt.success ? '✅ OK' : '❌ FAIL'}
                </span>
              </div>
              <div className="col-span-3 hidden md:block text-xs text-gray-600">{attempt.failReason || '—'}</div>
              <div className="col-span-2 text-xs text-gray-600">{new Date(attempt.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Logs Table */}
      {activeTab === 'audit' && (
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 bg-white/3 border-b border-white/5 grid grid-cols-12 gap-3 text-xs font-black text-gray-500 tracking-widest uppercase">
            <div className="col-span-3">ACTION</div>
            <div className="col-span-2">ENTITY</div>
            <div className="col-span-3 hidden sm:block">DETAILS</div>
            <div className="col-span-2 hidden md:block">IP</div>
            <div className="col-span-2">TIME</div>
          </div>
          {auditLogs.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <div className="text-4xl mb-3">📋</div>
              <p>No audit logs recorded yet.</p>
              <p className="text-xs mt-1 text-gray-700">Admin actions will be logged here when PostgreSQL backend is connected.</p>
            </div>
          )}
          {auditLogs.map((log) => (
            <div key={log.id} className="grid grid-cols-12 gap-3 px-5 py-3 border-t border-white/5 items-center hover:bg-white/3 transition-colors">
              <div className="col-span-3 font-bold text-orange-400 text-xs">{log.action}</div>
              <div className="col-span-2 text-xs text-gray-500">{log.entityType || '—'}</div>
              <div className="col-span-3 hidden sm:block text-xs text-gray-600 truncate">{log.details || '—'}</div>
              <div className="col-span-2 hidden md:block text-xs text-gray-600">{log.ip || '—'}</div>
              <div className="col-span-2 text-xs text-gray-600">{new Date(log.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
