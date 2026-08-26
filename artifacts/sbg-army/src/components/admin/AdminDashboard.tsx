import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import type { Database } from '@/lib/database';

const GOLD = '#d4af37';

interface Props {
  db: Database;
  onRefresh: () => void;
}

function StatCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div
      className="relative p-5 rounded-2xl overflow-hidden group cursor-default transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${color}10, ${color}04)`,
        border: `1px solid ${color}25`,
        boxShadow: `0 4px 20px ${color}08`,
      }}
    >
      {/* Glow orb */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{ background: color }} />

      <div className="relative z-10">
        <div className="text-2xl mb-3">{icon}</div>
        <div className="text-2xl font-black mb-1 tracking-tight" style={{ color }}>{value}</div>
        <div className="text-xs font-black text-white uppercase tracking-widest">{label}</div>
        {sub && <div className="text-[10px] text-gray-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, desc, onClick, color = GOLD }: { icon: string; label: string; desc: string; onClick?: () => void; color?: string }) {
  return (
    <button onClick={onClick}
      className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all group-hover:scale-110"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-black text-white text-sm truncate">{label}</p>
          <p className="text-[11px] text-gray-500 truncate">{desc}</p>
        </div>
        <div className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors text-lg">›</div>
      </div>
    </button>
  );
}

export default function AdminDashboard({ db, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const stats = {
    players:      (db.players ?? []).filter(p => p.visible).length,
    totalPlayers: (db.players ?? []).length,
    matches:      (db.matches ?? []).length,
    upcoming:     (db.matches ?? []).filter(m => m.status === 'upcoming').length,
    news:         (db.posts ?? []).filter(p => p.visible).length,
    visitors:     (db.analytics?.totalVisits ?? 0),
    todayVisits:  (db.analytics?.todayVisits ?? 0),
    staff:        (db.staffAccounts ?? []).filter(s => s.active).length,
    tournaments:  (db.tournaments ?? []).length,
    fanMessages:  (db.fan_messages ?? []).filter((m: any) => !m.read).length,
    shopItems:    (db.shop ?? []).filter(s => s.visible).length,
    orders:       (db.orders ?? []).filter((o: any) => o.status === 'waiting').length,
  };

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative p-6 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(255,107,0,0.04) 50%, rgba(0,0,0,0) 100%)',
          border: '1px solid rgba(212,175,55,0.15)',
        }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-400 font-bold tracking-widest uppercase">{greeting} 👋</p>
            <h1 className="text-2xl font-black text-white mt-1 tracking-wider">SBG ESPORTS Control Center</h1>
            <p className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 border"
            style={{ color: GOLD, borderColor: `${GOLD}30`, background: `${GOLD}08` }}>
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'REFRESHING…' : 'REFRESH'}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">📊 PLATFORM OVERVIEW</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Active Players" value={stats.players} color="#d4af37" sub={`${stats.totalPlayers} total`} />
          <StatCard icon="🎮" label="Matches" value={stats.matches} color="#ff6b00" sub={`${stats.upcoming} upcoming`} />
          <StatCard icon="📰" label="Published News" value={stats.news} color="#00d4ff" />
          <StatCard icon="👁️" label="Total Visitors" value={stats.visitors.toLocaleString('en-IN')} color="#9945ff" sub={`${stats.todayVisits} today`} />
          <StatCard icon="👔" label="Active Staff" value={stats.staff} color="#10b981" />
          <StatCard icon="🏆" label="Tournaments" value={stats.tournaments} color="#e94560" />
          <StatCard icon="🛒" label="Shop Items" value={stats.shopItems} color="#f59e0b" sub={`${stats.orders} orders pending`} />
          <StatCard icon="💬" label="Unread Messages" value={stats.fanMessages} color="#60a5fa" />
        </div>
      </div>

      {/* Two columns: Quick actions + Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">⚡ QUICK ACTIONS</h2>
          <div className="space-y-2">
            <QuickAction icon="👥" label="Manage Roster" desc="Add or edit team players" color="#d4af37" />
            <QuickAction icon="📰" label="Write News Post" desc="Publish a new article" color="#00d4ff" />
            <QuickAction icon="🎮" label="Log Match Result" desc="Record a match outcome" color="#ff6b00" />
            <QuickAction icon="🏆" label="Create Tournament" desc="Set up a new event" color="#e94560" />
            <QuickAction icon="🎛️" label="Feature Controls" desc="Toggle sections on/off" color="#9945ff" />
            <QuickAction icon="⚙️" label="Site Settings" desc="Update branding & theme" color="#10b981" />
          </div>
        </div>

        {/* Status panel */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">🔥 SITE STATUS</h2>
          <div className="p-5 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'Site Status',      value: db.settings.maintenanceMode ? 'MAINTENANCE' : 'LIVE', color: db.settings.maintenanceMode ? '#e94560' : '#10b981' },
              { label: 'Theme',            value: db.settings.organizationName || 'SBG ESPORTS',           color: db.settings.primaryColor || GOLD },
              { label: 'Active Staff',     value: `${stats.staff} accounts`,                            color: '#60a5fa' },
              { label: 'Pending Orders',   value: `${stats.orders} orders`,                             color: stats.orders > 0 ? '#f59e0b' : '#10b981' },
              { label: 'Unread Messages',  value: `${stats.fanMessages} messages`,                      color: stats.fanMessages > 0 ? '#ff6b00' : '#10b981' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-gray-400 font-semibold">{row.label}</span>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Logo preview */}
          {db.settings.logo && (
            <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-gray-600 mb-3 uppercase tracking-widest">Current Logo</p>
              <Image src={db.settings.logo} alt="Logo" objectFit="contain" className="h-16 w-auto mx-auto object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-[10px] text-gray-700 py-2">
        SBG ESPORTS Admin Panel · All changes sync in real-time across all devices
      </div>
    </div>
  );
}
