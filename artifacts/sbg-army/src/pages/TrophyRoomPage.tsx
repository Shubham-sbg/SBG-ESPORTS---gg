import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Trophy } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

const GOLD = '#d4af37';
const GOLD_BRIGHT = '#f5e27e';

/* ─── Trophy model config ───────────────────────────────────────────────── */
const MODEL_CFG: Record<NonNullable<Trophy['trophyModel']>, { border: string; shadow: string; icon: string; diamond?: boolean }> = {
  '3d-gold':    { border: '#d4af37', shadow: 'rgba(212,175,55,0.3)',    icon: '🏆' },
  '3d-silver':  { border: '#c0c0c0', shadow: 'rgba(192,192,192,0.3)',   icon: '🥈' },
  '3d-bronze':  { border: '#cd7f32', shadow: 'rgba(205,127,50,0.3)',    icon: '🥉' },
  '3d-crystal': { border: '#00d4ff', shadow: 'rgba(0,212,255,0.3)',     icon: '💎' },
  '3d-diamond': { border: 'transparent', shadow: 'rgba(255,255,255,0.2)', icon: '💠', diamond: true },
};

function getModelCfg(m?: Trophy['trophyModel']) {
  return MODEL_CFG[m ?? '3d-gold'] ?? MODEL_CFG['3d-gold'];
}

function placementColor(p: string) {
  if (p === '1st') return '#d4af37';
  if (p === '2nd') return '#c0c0c0';
  if (p === '3rd') return '#cd7f32';
  return 'rgba(255,255,255,0.5)';
}

function parsePrize(s?: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

/* ─── Floating particles ─────────────────────────────────────────────────── */
function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      dur: Math.random() * 6 + 4,
      delay: Math.random() * 4,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: GOLD, opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -60, -120] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 text-center"
      style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="text-3xl font-black" style={{ color: GOLD }}>{value}</div>
      <div className="text-xs uppercase tracking-widest text-white/40 mt-1">{label}</div>
    </motion.div>
  );
}

/* ─── Flippable Trophy Card ──────────────────────────────────────────────── */
function TrophyCard({ trophy, onClick }: { trophy: Trophy; onClick: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const cfg = getModelCfg(trophy.trophyModel);
  const pc = placementColor(trophy.placement);

  const cardStyle: React.CSSProperties = cfg.diamond
    ? {
        background: '#111114',
        border: '2px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: `0 0 30px ${cfg.shadow}, 0 0 0 2px transparent`,
        position: 'relative',
      }
    : {
        background: '#111114',
        border: `2px solid ${cfg.border}40`,
        boxShadow: `0 0 30px ${cfg.shadow}`,
      };

  const sharedFace: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: '1rem',
    overflow: 'hidden',
  };

  return (
    <div
      style={{ perspective: '1000px', cursor: 'pointer' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={onClick}
    >
      {/* Diamond animated border overlay */}
      {cfg.diamond && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            background: 'linear-gradient(135deg,#ff0080,#ff8c00,#ffff00,#00ff00,#00d4ff,#9945ff,#ff0080)',
            backgroundSize: '300% 300%',
            animation: 'diamondSpin 3s linear infinite',
            borderRadius: '1rem',
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      <div style={{
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        height: '320px',
        borderRadius: '1rem',
        ...cardStyle,
      }}>
        {/* FRONT */}
        <div style={{ ...sharedFace, position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '1.5rem' }}>
          {trophy.tournamentLogo
            ? <img src={trophy.tournamentLogo} alt="" className="w-14 h-14 object-contain rounded-lg" />
            : <div className="text-6xl leading-none">{cfg.icon}</div>
          }
          <span className="text-5xl leading-none">{cfg.icon}</span>
          <div className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: `${pc}20`, border: `1px solid ${pc}60`, color: pc }}>
            {trophy.placement} PLACE
          </div>
          <div className="text-white font-bold text-center text-sm leading-snug line-clamp-2">{trophy.title}</div>
          <div className="text-white/40 text-xs text-center">{trophy.game}</div>
          <div className="text-white/30 text-xs">{trophy.date}</div>
          {trophy.featured && (
            <div className="absolute top-3 right-3 text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60`, color: GOLD }}>★ FEATURED</div>
          )}
        </div>

        {/* BACK */}
        <div style={{
          ...sharedFace,
          transform: 'rotateY(180deg)',
          position: 'absolute',
          inset: 0,
          background: '#0d0d10',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'auto',
        }}>
          <div className="text-white font-bold text-sm leading-snug">{trophy.title}</div>
          {trophy.description && (
            <p className="text-white/50 text-xs leading-relaxed line-clamp-3">{trophy.description}</p>
          )}
          {trophy.prizePool && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40">Prize Pool</span>
              <span className="font-black" style={{ color: GOLD }}>{trophy.prizePool}</span>
            </div>
          )}
          {trophy.mvp && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40">MVP</span>
              <span className="text-white font-bold">⭐ {trophy.mvp}</span>
            </div>
          )}
          {trophy.teamRoster && trophy.teamRoster.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {trophy.teamRoster.map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}>
                  {p}
                </span>
              ))}
            </div>
          )}
          {trophy.matchReplayUrl && (
            <a href={trophy.matchReplayUrl} target="_blank" rel="noopener noreferrer"
              className="mt-auto text-center text-xs font-black uppercase tracking-widest py-2 rounded-xl"
              style={{ background: `linear-gradient(135deg,${GOLD},#b8960c)`, color: '#000' }}
              onClick={e => e.stopPropagation()}>
              ▶ Watch Replay
            </a>
          )}
          <div className="text-center text-white/20 text-[10px] mt-auto">Click for full details</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Modal ───────────────────────────────────────────────────────── */
function TrophyModal({ trophy, onClose }: { trophy: Trophy; onClose: () => void }) {
  const cfg = getModelCfg(trophy.trophyModel);
  const pc = placementColor(trophy.placement);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.88)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative max-w-2xl w-full rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ background: '#0d0d0d', border: `1px solid ${cfg.border}30` }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-1" style={{ background: cfg.diamond
            ? 'linear-gradient(90deg,#ff0080,#ff8c00,#ffff00,#00d4ff,#9945ff)'
            : `linear-gradient(90deg,${cfg.border},${cfg.border}44)` }} />

          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white transition-colors z-10"
            style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>

          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="text-5xl leading-none">{cfg.icon}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-white leading-tight">{trophy.title}</h2>
                <div className="text-white/40 text-sm mt-1">{trophy.tournamentName}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${pc}20`, border: `1px solid ${pc}60`, color: pc }}>
                    {trophy.placement} Place
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {trophy.game}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                    {trophy.date}
                  </span>
                </div>
              </div>
              {trophy.tournamentLogo && (
                <img src={trophy.tournamentLogo} alt="Tournament Logo" className="w-16 h-16 object-contain rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
              )}
            </div>

            {trophy.description && (
              <p className="text-white/60 text-sm leading-relaxed">{trophy.description}</p>
            )}

            {/* Meta row */}
            <div className="grid grid-cols-2 gap-3">
              {trophy.prizePool && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Prize Pool</div>
                  <div className="font-black text-lg" style={{ color: GOLD }}>{trophy.prizePool}</div>
                </div>
              )}
              {trophy.mvp && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-white/30 text-[10px] uppercase tracking-widest mb-1">MVP</div>
                  <div className="font-bold text-white text-sm">⭐ {trophy.mvp}</div>
                </div>
              )}
            </div>

            {/* Roster */}
            {trophy.teamRoster && trophy.teamRoster.length > 0 && (
              <div>
                <div className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Team Roster</div>
                <div className="flex flex-wrap gap-2">
                  {trophy.teamRoster.map(p => (
                    <span key={p} className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30`, color: GOLD }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Photo */}
            {trophy.teamPhoto && (
              <div>
                <div className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Team Photo</div>
                <img src={trophy.teamPhoto} alt="Team" className="w-full rounded-xl object-cover max-h-64"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            )}

            {/* Gallery */}
            {trophy.gallery && trophy.gallery.length > 0 && (
              <div>
                <div className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Gallery</div>
                <div className="grid grid-cols-3 gap-2">
                  {trophy.gallery.map((img, i) => (
                    <img key={i} src={img} alt={`Gallery ${i+1}`} className="w-full aspect-square object-cover rounded-xl"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Replay */}
            {trophy.matchReplayUrl && (
              <a href={trophy.matchReplayUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center py-3 rounded-xl font-black uppercase tracking-widest text-sm text-black"
                style={{ background: `linear-gradient(135deg,${GOLD},#b8960c)` }}>
                ▶ Watch Match Replay
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function TrophyRoomPage() {
  const { db, loading } = useDatabase();
  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const [filterGame, setFilterGame] = useState('All');
  const [filterPlacement, setFilterPlacement] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'prize'>('date');
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  const trophies = useMemo(() =>
    (db.trophies ?? []).filter(t => t.visible !== false).sort((a, b) => a.order - b.order),
    [db.trophies]);

  const games = useMemo(() => ['All', ...Array.from(new Set(trophies.map(t => t.game)))], [trophies]);

  const stats = useMemo(() => {
    const total = trophies.length;
    const firstPlace = trophies.filter(t => t.placement === '1st').length;
    const totalPrize = trophies.reduce((sum, t) => sum + parsePrize(t.prizePool), 0);
    const championships = trophies.filter(t => ['1st', '2nd', '3rd'].includes(t.placement)).length;
    return { total, firstPlace, totalPrize, championships };
  }, [trophies]);

  const filtered = useMemo(() => {
    let list = trophies;
    if (filterGame !== 'All') list = list.filter(t => t.game === filterGame);
    if (filterPlacement !== 'All') {
      if (filterPlacement === 'other') list = list.filter(t => !['1st','2nd','3rd'].includes(t.placement));
      else list = list.filter(t => t.placement === filterPlacement);
    }
    if (sortBy === 'date') list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    else list = [...list].sort((a, b) => parsePrize(b.prizePool) - parsePrize(a.prizePool));
    return list;
  }, [trophies, filterGame, filterPlacement, sortBy]);

  const featured = useMemo(() => trophies.filter(t => t.featured), [trophies]);

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      {/* Diamond border keyframe injection */}
      <style>{`
        @keyframes diamondSpin {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 text-center">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center top, rgba(212,175,55,0.12) 0%, transparent 70%)' }} />
        <Particles />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-widest"
              style={{ background: `linear-gradient(135deg,${GOLD_BRIGHT},${GOLD},#b8960c)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {db.settings?.trophyRoomTitle || 'TROPHY ROOM'}
            </h1>
            {db.settings?.trophyRoomSubtitle && (
              <p className="mt-4 text-white/50 text-lg">{db.settings.trophyRoomSubtitle}</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Trophies" value={stats.total} />
          <StatCard label="First Place Wins" value={stats.firstPlace} />
          <StatCard label="Total Prize Pool" value={stats.totalPrize > 0 ? `$${stats.totalPrize.toLocaleString()}` : '—'} />
          <StatCard label="Podium Finishes" value={stats.championships} />
        </div>
      </section>

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black uppercase tracking-widest" style={{ color: GOLD }}>
              ★ Featured Trophies
            </h2>
            <div className="flex gap-2">
              <button onClick={() => featuredRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>←</button>
              <button onClick={() => featuredRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>→</button>
            </div>
          </div>
          <div ref={featuredRef} className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
            {featured.map(t => (
              <div key={t.id} className="flex-shrink-0 w-72">
                <TrophyCard trophy={t} onClick={() => setSelectedTrophy(t)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Filters ── */}
      <section className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Game filter */}
          <Combobox value={filterGame} onChange={e => setFilterGame(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {games.map(g => <option key={g} value={g}>{g === 'All' ? 'All Games' : g}</option>)}
          </Combobox>

          {/* Placement filter */}
          <Combobox value={filterPlacement} onChange={e => setFilterPlacement(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="All">All Placements</option>
            <option value="1st">1st Place</option>
            <option value="2nd">2nd Place</option>
            <option value="3rd">3rd Place</option>
            <option value="other">Other</option>
          </Combobox>

          {/* Sort */}
          <Combobox value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'prize')}
            className="rounded-xl px-4 py-2.5 text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="date">Sort: Date</option>
            <option value="prize">Sort: Prize Pool</option>
          </Combobox>

          <div className="ml-auto text-white/30 text-sm">{filtered.length} trophies</div>
        </div>
      </section>

      {/* ── All Trophies Grid ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <div className="text-5xl mb-4">🏆</div>
            <div className="text-lg font-bold">No trophies match your filters</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((trophy, i) => (
              <motion.div key={trophy.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}>
                <TrophyCard trophy={trophy} onClick={() => setSelectedTrophy(trophy)} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modal ── */}
      {selectedTrophy && (
        <TrophyModal trophy={selectedTrophy} onClose={() => setSelectedTrophy(null)} />
      )}

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
