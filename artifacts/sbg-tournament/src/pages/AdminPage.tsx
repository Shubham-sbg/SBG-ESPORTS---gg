/**
 * AdminPage — Tournament Management Admin Panel
 * Uses the shared api-server admin JWT (same credentials as sbg-army admin).
 */
import { useState, useEffect } from 'react';
import { adminLogin, getToken } from '@/lib/api';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminTournaments from '@/components/admin/AdminTournaments';
import AdminRegistrations from '@/components/admin/AdminRegistrations';
import AdminBracket from '@/components/admin/AdminBracket';
import AdminSettings from '@/components/admin/AdminSettings';
import { Swords, Trophy, Users, GitBranch, Settings, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

const RED  = '#e8192c';
const GOLD = '#d4af37';

type Module = 'dashboard' | 'tournaments' | 'registrations' | 'bracket' | 'settings';

const MODULES: { id: Module; label: string; icon: typeof Trophy }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'tournaments',   label: 'Tournaments',   icon: Trophy },
  { id: 'registrations', label: 'Registrations', icon: Users },
  { id: 'bracket',       label: 'Bracket',       icon: GitBranch },
  { id: 'settings',      label: 'Settings',      icon: Settings },
];

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await adminLogin(pw);
    setBusy(false);
    if (res) {
      sessionStorage.setItem('tnmt_admin_token', res.token);
      onLogin(res.token);
    } else {
      setError('Invalid password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: `linear-gradient(135deg, ${RED}, #b00020)`, boxShadow: `0 0 32px ${RED}40` }}>
            <Swords size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-2">SBG ENTREPRENEUR · Tournament Management</p>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Admin Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-red-500/40 transition-all"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-400 px-1">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${RED}, #b00020)`, boxShadow: `0 4px 24px ${RED}30` }}>
            {busy ? 'Verifying…' : 'Login →'}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-700 mt-6">
          Uses the same credentials as the SBG ARMY admin panel.
        </p>
      </div>
    </div>
  );
}

// ── Main admin shell ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [active, setActive] = useState<Module>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    const saved = getToken();
    if (saved) setToken(saved);
  }, []);

  const logout = () => {
    sessionStorage.removeItem('tnmt_admin_token');
    setToken(null);
  };

  if (!token) return <LoginScreen onLogin={setToken} />;

  const renderModule = () => {
    switch (active) {
      case 'dashboard':     return <AdminDashboard />;
      case 'tournaments':   return <AdminTournaments />;
      case 'registrations': return <AdminRegistrations />;
      case 'bracket':       return <AdminBracket />;
      case 'settings':      return <AdminSettings />;
    }
  };

  const NavItem = ({ id, label, icon: Icon }: typeof MODULES[0]) => (
    <button onClick={() => { setActive(id); setSideOpen(false); }}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all"
      style={{
        background: active === id ? `${RED}18` : 'transparent',
        color: active === id ? RED : '#9ca3af',
        border: `1px solid ${active === id ? `${RED}30` : 'transparent'}`,
      }}>
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#050505', paddingTop: 0 }}>
      {/* Sidebar overlay (mobile) */}
      {sideOpen && <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex-shrink-0`}
        style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>
            <Swords size={15} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-[11px] tracking-widest">SBG ENTREPRENEUR</p>
            <p className="text-[9px] tracking-widest font-bold" style={{ color: GOLD }}>ADMIN PANEL</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {MODULES.map(m => <NavItem key={m.id} {...m} />)}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-red-400 transition-colors">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
          <button onClick={() => setSideOpen(v => !v)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="font-black text-white text-sm uppercase tracking-widest">
            {MODULES.find(m => m.id === active)?.label}
          </h2>
        </div>

        {/* Module content */}
        <div className="flex-1 p-6 overflow-auto">
          {renderModule()}
        </div>
      </div>
    </div>
  );
}
