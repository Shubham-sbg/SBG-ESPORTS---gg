import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Achievement, Trophy, TeamRecord } from '@/lib/database';

const GOLD = '#d4af37';

const GAME_COLORS: Record<string, string> = {
  'BGMI': '#3b82f6',
  'FREE FIRE': '#f97316',
  'VALORANT': '#e94560',
  'COD MOBILE': '#22c55e',
};

function getGameColor(game: string): string {
  return GAME_COLORS[game?.toUpperCase()] ?? GOLD;
}

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US');
}

function parsePrize(s?: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[$,]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  delay?: number;
}

function StatCard({ icon, label, value, color = GOLD, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative rounded-2xl p-5 overflow-hidden group"
      style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-35 transition-opacity duration-300"
        style={{ background: color }}
      />
      <div className="relative z-10">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-4xl font-black mb-1 tracking-tight" style={{ color }}>
          {value}
        </div>
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</div>
      </div>
    </motion.div>
  );
}

interface BarRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
  suffix?: string;
}

function BarRow({ label, value, total, color, suffix }: BarRowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-300 font-semibold">{label}</span>
        <span className="text-sm font-black" style={{ color }}>
          {value}{suffix ? ` ${suffix}` : ''} <span className="text-gray-500 font-normal text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          style={{
            width: pct + '%',
            background: color,
            height: '8px',
            borderRadius: '4px',
            transition: 'width 1s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function StatsDashboardPage() {
  const { db, loading, refresh } = useDatabase();

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => {
      refresh();
    }, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const stats = useMemo(() => {
    const players = db.players?.filter(p => p.visible !== false) ?? [];
    const achievements: Achievement[] = db.achievements ?? [];
    const trophies: Trophy[] = db.trophies ?? [];
    const teamRecords: TeamRecord[] = db.teamRecords ?? [];
    const matches = db.matches ?? [];

    const visibleAchievements = achievements.filter(a => a.visible !== false);
    const visibleTrophies = trophies.filter(t => t.visible !== false);

    const tournamentWins = visibleAchievements.filter(a => a.category === 'Tournament Win').length;
    const totalTrophies = visibleTrophies.length;
    const championships = visibleTrophies.filter(t => t.placement === '1st').length;

    const prizeFromAchievements = visibleAchievements.reduce((sum, a) => sum + parsePrize(a.prizePool), 0);
    const prizeFromTrophies = visibleTrophies.reduce((sum, t) => sum + parsePrize(t.prizePool), 0);
    const totalPrize = prizeFromAchievements + prizeFromTrophies;

    const totalVisits = db.analytics?.totalVisits ?? 0;
    const activeRecords = teamRecords.filter(r => r.isActive && r.visible !== false).length;

    return {
      activePlayers: players.length,
      tournamentWins,
      totalTrophies,
      championships,
      totalPrize,
      totalMatches: matches.length,
      totalVisits,
      activeRecords,
      players,
      visibleAchievements,
      visibleTrophies,
      teamRecords,
    };
  }, [db]);

  // Games breakdown
  const gamesBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of stats.players) {
      const g = (p.game ?? 'Other').toUpperCase();
      map[g] = (map[g] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [stats.players]);

  // Achievements by category
  const achievementsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of stats.visibleAchievements) {
      map[a.category] = (map[a.category] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [stats.visibleAchievements]);

  // Trophy placements
  const trophyPlacements = useMemo(() => {
    const counts = { '1st': 0, '2nd': 0, '3rd': 0, 'other': 0 };
    for (const t of stats.visibleTrophies) {
      if (t.placement === '1st') counts['1st']++;
      else if (t.placement === '2nd') counts['2nd']++;
      else if (t.placement === '3rd') counts['3rd']++;
      else counts['other']++;
    }
    return counts;
  }, [stats.visibleTrophies]);

  // Recent achievements (last 5)
  const recentAchievements = useMemo(() => {
    return [...stats.visibleAchievements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [stats.visibleAchievements]);

  // Active records (top 3)
  const activeRecords = useMemo(() => {
    return stats.teamRecords
      .filter(r => r.isActive && r.visible !== false)
      .slice(0, 3);
  }, [stats.teamRecords]);

  // Win rate
  const winRate = useMemo(() => {
    const total = stats.visibleAchievements.length;
    if (total === 0) return 0;
    const wins = stats.visibleAchievements.filter(a => a.category === 'Tournament Win').length;
    return Math.round((wins / total) * 100);
  }, [stats.visibleAchievements]);

  const pageTitle = db.settings.statsPageTitle || 'STATISTICS DASHBOARD';

  const statCards = [
    { icon: '👥', label: 'Active Players', value: stats.activePlayers, color: '#3b82f6' },
    { icon: '🏆', label: 'Tournament Wins', value: stats.tournamentWins, color: GOLD },
    { icon: '🎖️', label: 'Total Trophies', value: stats.totalTrophies, color: '#a855f7' },
    { icon: '👑', label: 'Championships', value: stats.championships, color: '#f59e0b' },
    { icon: '💰', label: 'Total Prize Money', value: formatCurrency(stats.totalPrize), color: '#22c55e' },
    { icon: '⚔️', label: 'Total Matches', value: stats.totalMatches, color: '#e94560' },
    { icon: '📊', label: 'Community Visits', value: stats.totalVisits.toLocaleString(), color: '#06b6d4' },
    { icon: '🔥', label: 'Active Records', value: stats.activeRecords, color: '#f97316' },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${GOLD}18, transparent)` }}
        />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
            style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD }}
          >
            Live Performance Data
          </div>
          <h1
            className="text-4xl md:text-6xl font-black uppercase tracking-widest mb-4"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #f5e27e, ${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {pageTitle}
          </h1>
          <p className="text-gray-400 text-sm font-semibold tracking-widest uppercase">
            Auto-refreshes every 30 seconds
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-24 space-y-12">

        {/* 8 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} delay={i * 0.07} />
          ))}
        </div>

        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-black uppercase tracking-widest mb-4" style={{ color: GOLD }}>
            🎯 Achievement Win Rate
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-300">Tournament Win Rate</span>
                <span className="text-lg font-black" style={{ color: GOLD }}>{winRate}%</span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  style={{
                    width: winRate + '%',
                    background: `linear-gradient(90deg, ${GOLD}, #f5e27e)`,
                    height: '12px',
                    borderRadius: '6px',
                    transition: 'width 1s ease',
                    boxShadow: `0 0 12px ${GOLD}60`,
                  }}
                />
              </div>
            </div>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: `${GOLD}15`, border: `2px solid ${GOLD}40`, color: GOLD }}
            >
              {winRate}%
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Games Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-6"
            style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-lg font-black uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              🎮 Games Breakdown
            </h2>
            {gamesBreakdown.length === 0 ? (
              <p className="text-gray-500 text-sm">No player data</p>
            ) : (
              gamesBreakdown.map(([game, count]) => (
                <BarRow
                  key={game}
                  label={game}
                  value={count}
                  total={stats.activePlayers}
                  color={getGameColor(game)}
                  suffix="players"
                />
              ))
            )}
          </motion.div>

          {/* Achievements by Category */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-2xl p-6"
            style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-lg font-black uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              🏅 Achievements by Category
            </h2>
            {achievementsByCategory.length === 0 ? (
              <p className="text-gray-500 text-sm">No achievement data</p>
            ) : (
              achievementsByCategory.map(([cat, count], i) => {
                const colors = [GOLD, '#3b82f6', '#22c55e', '#a855f7', '#e94560', '#f97316', '#06b6d4', '#f59e0b'];
                return (
                  <BarRow
                    key={cat}
                    label={cat}
                    value={count}
                    total={stats.visibleAchievements.length}
                    color={colors[i % colors.length]}
                  />
                );
              })
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trophy Placements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl p-6"
            style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-lg font-black uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              🏆 Trophy Placements
            </h2>
            {[
              { label: '1st Place', key: '1st' as const, color: GOLD, dot: '#d4af37' },
              { label: '2nd Place', key: '2nd' as const, color: '#c0c0c0', dot: '#c0c0c0' },
              { label: '3rd Place', key: '3rd' as const, color: '#cd7f32', dot: '#cd7f32' },
              { label: 'Other Placements', key: 'other' as const, color: '#6b7280', dot: '#6b7280' },
            ].map(({ label, key, color, dot }) => (
              <div key={key} className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: dot }} />
                  <span className="text-sm text-gray-300">{label}</span>
                </div>
                <span className="text-lg font-black" style={{ color }}>{trophyPlacements[key]}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-sm font-black text-white">Total Trophies</span>
              <span className="text-lg font-black" style={{ color: GOLD }}>{stats.totalTrophies}</span>
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="rounded-2xl p-6"
            style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-lg font-black uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              ⭐ Recent Achievements
            </h2>
            {recentAchievements.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent achievements</p>
            ) : (
              <div className="space-y-3">
                {recentAchievements.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
                    >
                      {a.trophyIcon || '🏆'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.category}</p>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {a.date ? new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Active Records Highlight */}
        {activeRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl p-6"
            style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-lg font-black uppercase tracking-widest mb-5" style={{ color: GOLD }}>
              🔥 Standing Records
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeRecords.map(r => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl relative overflow-hidden"
                  style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}25` }}
                >
                  <div className="absolute top-2 right-2 text-2xl">{r.icon}</div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{r.category}</p>
                  <p className="text-xl font-black mb-0.5" style={{ color: GOLD }}>{r.value}</p>
                  <p className="text-sm font-semibold text-white">{r.title}</p>
                  {r.holder && <p className="text-xs text-gray-500 mt-1">Held by: {r.holder}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
