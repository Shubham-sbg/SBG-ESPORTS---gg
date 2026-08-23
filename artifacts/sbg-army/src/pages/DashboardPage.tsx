import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { getPlayerSession, logoutPlayer } from '@/lib/playerAuth';
import { isAuthenticated } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

type DashTab = 'overview' | 'esports' | 'enterprise' | 'profile';

const ENTERPRISE_MODULES = [
  { id: 'projects', icon: '📋', title: 'Project Management', desc: 'Track ongoing projects and milestones', count: 12, color: '#ff6b00' },
  { id: 'tasks', icon: '✅', title: 'Task Management', desc: 'Manage team tasks and assignments', count: 48, color: '#00d4ff' },
  { id: 'docs', icon: '📁', title: 'Document Storage', desc: 'Access team documents and resources', count: 34, color: '#ffd700' },
  { id: 'analytics', icon: '📊', title: 'Analytics Dashboard', desc: 'Platform performance and metrics', count: null, color: '#a855f7' },
  { id: 'reports', icon: '📈', title: 'Business Reports', desc: 'Weekly and monthly reports', count: 8, color: '#e94560' },
  { id: 'collab', icon: '🤝', title: 'Team Collaboration', desc: 'Shared workspace and discussions', count: 23, color: '#10b981' },
];

const QUICK_ACTIONS = [
  { label: 'Register for Tournament', href: '/tournaments', icon: '🏆', color: '#ff6b00' },
  { label: 'View Leaderboards', href: '/leaderboards', icon: '📊', color: '#ffd700' },
  { label: 'Join Community', href: '/community', icon: '💬', color: '#a855f7' },
  { label: 'Browse Shop', href: '/shop', icon: '🛒', color: '#00d4ff' },
  { label: 'View Events', href: '/events', icon: '📅', color: '#e94560' },
  { label: 'Fan Connect', href: '/fan-connect', icon: '⭐', color: '#10b981' },
];

const PLATFORM_STATS = [
  { label: 'Active Players', value: '50+', icon: '🎮', change: '+8%', positive: true },
  { label: 'Live Tournaments', value: '3', icon: '🏆', change: '+2', positive: true },
  { label: 'Community Members', value: '12K+', icon: '👥', change: '+15%', positive: true },
  { label: 'Matches This Week', value: '28', icon: '⚔️', change: '+6', positive: true },
];

export default function DashboardPage() {
  const { db, loading } = useDatabase();
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const player = getPlayerSession();
  const isAdmin = isAuthenticated();

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  const upcomingTournaments = (db.tournaments ?? [])
    .filter(t => t.visible && t.registrationStatus !== 'ended')
    .slice(0, 5);

  const recentMatches = (db.matches ?? [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const topPlayers = (db.players ?? [])
    .filter(p => p.visible && p.status === 'active')
    .slice(0, 5);

  const recentNews = (db.posts ?? [])
    .filter(p => p.visible)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const playerRegistrations = player
    ? (db.registrations ?? []).filter(r => r.leaderUid === player.uid || r.player2Uid === player.uid)
    : [];
  const playerOrders = player
    ? (db.orders ?? []).filter(o => o.userId === player.id)
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero Header */}
      <section className="relative pt-20 pb-8 px-4 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-bold tracking-widest uppercase">LIVE PLATFORM</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {player ? `WELCOME BACK, ` : '${PUBLIC_BRAND_NAME} '}
              {player ? <span style={{ color: db.settings.primaryColor }}>{player.name.split(' ')[0].toUpperCase()}</span> : (
                <span style={{ color: db.settings.primaryColor }}>DASHBOARD</span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {player ? `${player.preferredGame} · ${player.country}` : 'Your unified esports & enterprise command center'}
            </p>
          </div>
          <div className="flex gap-3">
            {player ? (
              <button onClick={() => { logoutPlayer(); window.location.reload(); }}
                className="px-4 py-2 rounded-xl text-xs font-black border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                🔒 Logout
              </button>
            ) : (
              <a href="/player-login" className="px-6 py-2.5 rounded-xl text-xs font-black text-black uppercase tracking-widest"
                style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` }}>
                LOGIN / REGISTER
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="px-4 py-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORM_STATS.map(stat => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 group hover:border-orange-500/25 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${stat.positive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-600 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 pt-6 pb-2">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto scrollbar-none">
          {([
            { id: 'overview', label: '🏠 OVERVIEW' },
            { id: 'esports', label: '🎮 ESPORTS' },
            { id: 'enterprise', label: '💼 ENTERPRISE' },
            ...(player ? [{ id: 'profile', label: '👤 MY PROFILE' }] : []),
          ] as { id: DashTab; label: string }[]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? 'text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              style={activeTab === tab.id ? { background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` } : {}}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-8 pb-16">
        <div className="max-w-7xl mx-auto">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4">QUICK ACTIONS</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map(action => (
                      <a key={action.label} href={action.href}
                        className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all duration-300 group text-center">
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
                        <div className="text-xs font-black text-gray-400 group-hover:text-white transition-colors leading-tight">{action.label}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Recent News */}
                <div>
                  <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4">LATEST NEWS</h2>
                  <div className="space-y-3">
                    {recentNews.map(post => (
                      <div key={post.id} className="flex gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center text-lg flex-shrink-0">
                          📰
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-white line-clamp-1 mb-1">{post.title}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{post.category}</span>
                            <span>·</span>
                            <span>{post.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentNews.length === 0 && (
                      <div className="text-center py-8 text-gray-600 text-sm">No news yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Upcoming Tournaments */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase">TOURNAMENTS</h2>
                    <a href="/tournaments" className="text-xs text-orange-400 hover:text-orange-300">View All →</a>
                  </div>
                  <div className="space-y-3">
                    {upcomingTournaments.slice(0, 4).map(t => (
                      <div key={t.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-sm font-black text-orange-400 flex-shrink-0">
                          🏆
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-white line-clamp-1">{t.title}</div>
                          <div className="text-xs text-gray-600">{t.game} · {t.matchDate}</div>
                        </div>
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-400 whitespace-nowrap">{t.registrationStatus}</span>
                      </div>
                    ))}
                    {upcomingTournaments.length === 0 && (
                      <div className="text-sm text-gray-600 text-center py-4">No active tournaments</div>
                    )}
                  </div>
                </div>

                {/* Top Players */}
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase">TOP PLAYERS</h2>
                    <a href="/leaderboards" className="text-xs text-orange-400 hover:text-orange-300">Rankings →</a>
                  </div>
                  <div className="space-y-3">
                    {topPlayers.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-sm font-black w-5" style={{ color: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#666' }}>
                          #{i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-black text-gray-400 flex-shrink-0">
                          {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" /> : p.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-white">{p.ign}</div>
                          <div className="text-xs text-gray-600">{p.role} · {p.game}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ESPORTS TAB */}
          {activeTab === 'esports' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Matches */}
              <div>
                <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4">⚔️ RECENT MATCHES</h2>
                <div className="space-y-3">
                  {recentMatches.map(m => (
                    <div key={m.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 hover:border-orange-500/20 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-orange-400 uppercase tracking-widest">{m.game}</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          m.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                          m.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {m.status === 'live' ? '🔴 LIVE' : m.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white text-sm">{db.settings.organizationName || PUBLIC_BRAND_NAME}</span>
                        {m.score ? (
                          <span className="font-black text-lg px-4" style={{ color: db.settings.primaryColor }}>{m.score}</span>
                        ) : (
                          <span className="text-gray-600 text-xs font-bold px-4">VS</span>
                        )}
                        <span className="font-black text-gray-400 text-sm">{m.opponent}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                        <span>📅 {m.date}</span>
                        <span>⏱ {m.time}</span>
                        <span>🎯 {m.round}</span>
                      </div>
                    </div>
                  ))}
                  {recentMatches.length === 0 && (
                    <div className="text-center py-12 text-gray-600">No matches yet</div>
                  )}
                </div>
              </div>

              {/* Player Roster */}
              <div>
                <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4">🎮 ACTIVE ROSTER</h2>
                <div className="space-y-3">
                  {topPlayers.slice(0, 8).map((p, i) => (
                    <div key={p.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500/20 transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-orange-400 flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}25, ${db.settings.accentColor}15)` }}>
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-xl" /> : p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-white text-sm">{p.ign}</div>
                        <div className="text-xs text-gray-600">{p.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-orange-400">{p.role}</div>
                        <div className="text-xs text-gray-600">{p.game}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <a href="/tournaments" className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-black transition-all hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` }}>
                    🏆 TOURNAMENTS
                  </a>
                  <a href="/leaderboards" className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/15 text-gray-300 hover:border-orange-500/40 hover:text-orange-400 transition-all">
                    📊 LEADERBOARDS
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE TAB */}
          {activeTab === 'enterprise' && (
            <div>
              <div className="flex items-center gap-4 mb-8 p-5 bg-white/[0.03] border border-orange-500/20 rounded-2xl">
                <div className="text-3xl">💼</div>
                <div>
                  <h2 className="font-black text-white text-lg">ENTERPRISE PORTAL</h2>
                  <p className="text-sm text-gray-500">Manage projects, tasks, documents and team collaboration. Staff access required for editing.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {ENTERPRISE_MODULES.map(module => (
                  <div key={module.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all duration-300 group cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{module.icon}</div>
                      {module.count !== null && (
                        <span className="px-3 py-1 rounded-xl text-xs font-black" style={{ background: `${module.color}22`, color: module.color }}>
                          {module.count}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-white tracking-wider mb-2">{module.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{module.desc}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 group-hover:text-orange-400 transition-colors">
                      <span>{isAdmin ? 'OPEN MODULE' : 'STAFF ONLY'}</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Business Stats Preview */}
              <div className="grid sm:grid-cols-4 gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                {[
                  { label: 'Open Projects', value: '12', color: '#ff6b00', icon: '📋' },
                  { label: 'Active Tasks', value: '48', color: '#00d4ff', icon: '✅' },
                  { label: 'Documents', value: '34', color: '#ffd700', icon: '📁' },
                  { label: 'Team Members', value: '18', color: '#a855f7', icon: '👥' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-gray-600 uppercase tracking-widest">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MY PROFILE TAB */}
          {activeTab === 'profile' && player && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div>
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 text-center mb-6">
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-black text-orange-400"
                    style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}33, ${db.settings.accentColor}22)` }}>
                    {player.name.charAt(0)}
                  </div>
                  <h2 className="font-black text-white text-xl mb-1">{player.name}</h2>
                  <div className="text-xs text-orange-400 font-bold tracking-widest mb-4">@{player.username}</div>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Game:</span>
                      <span className="text-white font-bold">{player.preferredGame}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span className="text-white font-bold">{player.country}</span>
                    </div>
                    {player.whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">WhatsApp:</span>
                        <span className="text-white font-bold">{player.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>
                <a href="/player-dashboard" className="block w-full py-3 text-center rounded-xl font-black text-xs uppercase tracking-widest border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors">
                  FULL PROFILE →
                </a>
              </div>

              {/* My Registrations */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4">MY TOURNAMENT REGISTRATIONS</h2>
                  {playerRegistrations.length > 0 ? (
                    <div className="space-y-3">
                      {playerRegistrations.map(r => (
                        <div key={r.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-4">
                          <div className="text-2xl">🏆</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-white text-sm">{r.tournamentTitle}</div>
                            <div className="text-xs text-gray-600">Team: {r.teamName} · Lead: {r.leaderName}</div>
                          </div>
                          <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                            r.status === 'approved' ? 'bg-green-500/15 text-green-400' :
                            r.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                            'bg-orange-500/15 text-orange-400'
                          }`}>{r.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="text-4xl mb-3">🎮</div>
                      <p className="text-gray-600 text-sm">No tournament registrations yet.</p>
                      <a href="/tournaments" className="inline-block mt-3 text-xs text-orange-400 font-bold hover:text-orange-300">Browse Tournaments →</a>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4">MY ORDERS</h2>
                  {playerOrders.length > 0 ? (
                    <div className="space-y-3">
                      {playerOrders.map(o => (
                        <div key={o.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-4">
                          <div className="text-2xl">🛍️</div>
                          <div className="flex-1">
                            <div className="font-black text-white text-sm">{o.productTitle}</div>
                            <div className="text-xs text-gray-600">₹{o.amount} · Order #{o.orderNumber}</div>
                          </div>
                          <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                            o.status === 'approved' ? 'bg-green-500/15 text-green-400' :
                            o.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                            'bg-yellow-500/15 text-yellow-400'
                          }`}>{o.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="text-4xl mb-3">🛒</div>
                      <p className="text-gray-600 text-sm">No orders yet.</p>
                      <a href="/shop" className="inline-block mt-3 text-xs text-orange-400 font-bold hover:text-orange-300">Visit Shop →</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && !player && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="font-black text-white text-2xl mb-3">Sign In to View Your Profile</h3>
              <p className="text-gray-500 mb-8">Track your registrations, orders, and stats in one place.</p>
              <a href="/player-login" className="px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest text-black"
                style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` }}>
                LOGIN / REGISTER →
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
