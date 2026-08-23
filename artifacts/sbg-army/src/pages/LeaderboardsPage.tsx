import { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const GAMES = ['ALL', 'BGMI', 'FREE FIRE', 'VALORANT', 'COD MOBILE', 'PUBG PC'];

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32', '#ff6b00', '#e94560'];

type Tab = 'players' | 'teams' | 'mvp';

type SortKey = 'points' | 'kills' | 'wins' | 'kd' | 'winRate';

interface PlayerRow {
  rank: number;
  name: string;
  realName: string;
  game: string;
  kills: number;
  wins: number;
  kd: number;
  winRate: number;
  points: number;
  role: string;
  country: string;
  badge: string | null;
}

interface TeamRow {
  rank: number;
  name: string;
  game: string;
  wins: number;
  losses: number;
  points: number;
  winRate: number;
  tournaments: number;
}

export default function LeaderboardsPage() {
  const { db, loading } = useDatabase();
  const [activeGame, setActiveGame] = useState('ALL');
  const [activeTab, setActiveTab] = useState<Tab>('players');
  const [sortBy, setSortBy] = useState<SortKey>('points');

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  // ── Derive player rows from db.players (real data only) ─────────────────
  const playerRows = useMemo<PlayerRow[]>(() => {
    const source = (db.players ?? []).filter(p => p.visible && p.status === 'active');
    return source
      .filter(p => activeGame === 'ALL' || p.game === activeGame)
      .map(p => ({
        name: p.ign || p.name,
        realName: p.name,
        game: p.game,
        kills: 0,
        wins: 0,
        kd: parseFloat(p.kdRatio ?? '0') || 0,
        winRate: 0,
        points: (p.mvpCount ?? 0) * 100,
        role: p.role,
        country: p.country ?? '🌍',
        badge: (p.mvpCount ?? 0) > 0 ? '⭐' : null,
        rank: 0,
      }))
      .sort((a, b) => {
        if (sortBy === 'points') return b.points - a.points;
        if (sortBy === 'kills')  return b.kills  - a.kills;
        if (sortBy === 'wins')   return b.wins   - a.wins;
        if (sortBy === 'kd')     return b.kd     - a.kd;
        if (sortBy === 'winRate')return b.winRate - a.winRate;
        return 0;
      })
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [db.players, activeGame, sortBy]);

  // ── Derive team rows: group players by game ──────────────────────────────
  const teamRows = useMemo<TeamRow[]>(() => {
    const activePlayers = (db.players ?? []).filter(p => p.visible && p.status === 'active');
    const gameMap: Record<string, { players: typeof activePlayers }> = {};
    for (const p of activePlayers) {
      if (!gameMap[p.game]) gameMap[p.game] = { players: [] };
      gameMap[p.game].players.push(p);
    }
    return Object.entries(gameMap)
      .filter(([game]) => activeGame === 'ALL' || game === activeGame)
      .map(([game, { players }], i) => ({
        rank: i + 1,
        name: `${PUBLIC_BRAND_NAME} ${game}`,
        game,
        wins: 0,
        losses: 0,
        points: players.reduce((acc, p) => acc + (p.mvpCount ?? 0) * 100, 0),
        winRate: 0,
        tournaments: 0,
      }))
      .sort((a, b) => b.points - a.points)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }, [db.players, activeGame]);

  // ── MVP: top players by K/D ──────────────────────────────────────────────
  const mvpPlayers = useMemo(() =>
    [...playerRows].sort((a, b) => b.kd - a.kd).slice(0, 5),
    [playerRows]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative pt-24 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              SEASON 2026
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
              <span style={{ color: db.settings.primaryColor }}>{db.settings.organizationName || PUBLIC_BRAND_NAME}</span>
              <span className="text-white"> LEADERBOARDS</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Live rankings, K/D stats, and MVP performance for Season 2026.</p>
          </div>

          {/* Top 3 Podium */}
          {playerRows.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-12">
              {[playerRows[1], playerRows[0], playerRows[2]].filter(Boolean).map((p, i) => {
                const podiumOrder = [2, 1, 3];
                const heights = ['h-28', 'h-36', 'h-24'];
                const sizes = ['text-sm', 'text-base', 'text-xs'];
                return (
                  <div key={p?.name} className={`flex-1 max-w-[180px] ${heights[i]} flex flex-col items-center justify-end`}>
                    <div className="text-center mb-2">
                      <div className="text-xl mb-1">{p?.badge || '🏅'}</div>
                      <div className={`font-black text-white ${sizes[i]}`}>{p?.name}</div>
                      <div className="text-xs text-gray-500">{p?.game}</div>
                      <div className="font-black mt-1" style={{ color: RANK_COLORS[podiumOrder[i] - 1] }}>
                        {p?.kd > 0 ? `${p.kd} K/D` : `${p?.points.toLocaleString()} pts`}
                      </div>
                    </div>
                    <div className="w-full rounded-t-xl flex items-center justify-center font-black text-2xl"
                      style={{
                        height: heights[i].replace('h-', '') + 'px',
                        background: `linear-gradient(to top, ${RANK_COLORS[podiumOrder[i] - 1]}33, ${RANK_COLORS[podiumOrder[i] - 1]}11)`,
                        border: `1px solid ${RANK_COLORS[podiumOrder[i] - 1]}44`,
                      }}>
                      #{podiumOrder[i]}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Controls */}
      <section className="px-4 mb-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['players', 'teams', 'mvp'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 ${activeTab === tab ? 'text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                style={activeTab === tab ? { background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` } : {}}>
                {tab === 'players' ? '🎮 PLAYER RANKINGS' : tab === 'teams' ? '👥 TEAM RANKINGS' : '⭐ MVP STATS'}
              </button>
            ))}
          </div>

          {/* Game Filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            {GAMES.map(g => (
              <button key={g} onClick={() => setActiveGame(g)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-200 ${activeGame === g ? 'text-black' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                style={activeGame === g ? { background: db.settings.primaryColor } : {}}>
                {g}
              </button>
            ))}
          </div>

          {/* Sort */}
          {activeTab === 'players' && (
            <div className="flex gap-2 flex-wrap mb-6">
              <span className="text-xs text-gray-600 self-center mr-2">SORT BY:</span>
              {(['points', 'kd'] as SortKey[]).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${sortBy === s ? 'text-orange-400 border border-orange-500/50 bg-orange-500/10' : 'text-gray-600 border border-white/5 hover:text-gray-400'}`}>
                  {s === 'kd' ? 'K/D' : 'POINTS'}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'players' ? (
            playerRows.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="font-black text-white text-2xl mb-3">No Players Yet</h3>
                <p className="text-gray-500 mb-8">Add players from the Admin Panel to see rankings here.</p>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/3 text-xs font-black text-gray-500 tracking-widest uppercase">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">PLAYER</div>
                  <div className="col-span-2 hidden sm:block">GAME</div>
                  <div className="col-span-2 text-center hidden md:block">ROLE</div>
                  <div className="col-span-2 text-center">K/D</div>
                  <div className="col-span-1 text-center">MVPs</div>
                </div>
                {playerRows.map((player, idx) => (
                  <div key={player.name}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-t border-white/5 hover:bg-white/3 transition-colors duration-200 ${idx < 3 ? 'bg-gradient-to-r from-orange-500/3 to-transparent' : ''}`}>
                    <div className="col-span-1">
                      <span className="font-black text-sm" style={{ color: player.rank <= 3 ? RANK_COLORS[player.rank - 1] : '#666' }}>
                        {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                      </span>
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}44, ${db.settings.accentColor}22)` }}>
                        {player.badge || player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{player.name}</div>
                        <div className="text-xs text-gray-600">{player.realName}</div>
                      </div>
                    </div>
                    <div className="col-span-2 hidden sm:block">
                      <span className="text-xs font-bold text-gray-500">{player.game}</span>
                    </div>
                    <div className="col-span-2 hidden md:block text-center">
                      <span className="text-xs font-bold text-gray-400">{player.role}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-black text-orange-400">{player.kd > 0 ? player.kd.toFixed(2) : '—'}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="font-black text-sm" style={{ color: db.settings.primaryColor }}>
                        {(db.players?.find(p => (p.ign || p.name) === player.name)?.mvpCount ?? 0) || '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'teams' ? (
            teamRows.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="font-black text-white text-2xl mb-3">No Teams Yet</h3>
                <p className="text-gray-500">Teams are built from active players. Add players to see team rankings.</p>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-10 gap-4 px-6 py-3 bg-white/3 text-xs font-black text-gray-500 tracking-widest uppercase">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">TEAM</div>
                  <div className="col-span-2 hidden sm:block">GAME</div>
                  <div className="col-span-2 text-center">PLAYERS</div>
                </div>
                {teamRows.map((team, idx) => (
                  <div key={team.name} className="grid grid-cols-10 gap-4 px-6 py-4 items-center border-t border-white/5 hover:bg-white/3 transition-colors">
                    <div className="col-span-1">
                      <span className="font-black text-sm" style={{ color: team.rank <= 3 ? RANK_COLORS[team.rank - 1] : '#666' }}>
                        {team.rank <= 3 ? ['🥇', '🥈', '🥉'][team.rank - 1] : `#${team.rank}`}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-sm font-black text-orange-400">
                        {team.game.charAt(0)}
                      </div>
                      <div className="font-black text-sm text-white leading-tight">{team.name}</div>
                    </div>
                    <div className="col-span-2 hidden sm:block text-xs font-bold text-gray-500">{team.game}</div>
                    <div className="col-span-2 text-center font-black" style={{ color: db.settings.primaryColor }}>
                      {(db.players ?? []).filter(p => p.visible && p.status === 'active' && p.game === team.game).length}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* MVP Tab */
            mvpPlayers.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="font-black text-white text-2xl mb-3">No MVPs Yet</h3>
                <p className="text-gray-500">Add players with K/D stats and MVP counts to see MVP rankings.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {mvpPlayers.map((p, i) => (
                  <div key={p.name} className={`bg-white/[0.03] border rounded-2xl p-6 ${i === 0 ? 'border-yellow-500/40 col-span-1 md:col-span-2' : 'border-white/8'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}33, ${db.settings.accentColor}22)` }}>
                        {p.badge || '🏅'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-black text-white">{p.name}</span>
                          {i === 0 && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-black rounded-lg border border-yellow-500/30">MVP</span>}
                        </div>
                        <div className="text-sm text-gray-500">{p.realName} · {p.role} · {p.game}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-3xl font-black" style={{ color: i === 0 ? '#ffd700' : db.settings.primaryColor }}>
                          {p.kd > 0 ? p.kd.toFixed(2) : '—'}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-widest">K/D Ratio</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Game', value: p.game, color: '#ff6b00' },
                        { label: 'Role', value: p.role, color: '#00d4ff' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white/3 rounded-xl p-3 text-center">
                          <div className="font-black text-sm" style={{ color: stat.color }}>{stat.value || '—'}</div>
                          <div className="text-xs text-gray-600 uppercase tracking-wider">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
