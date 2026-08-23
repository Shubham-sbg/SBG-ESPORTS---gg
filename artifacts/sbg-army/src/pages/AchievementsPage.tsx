import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Achievement } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';

const CATEGORIES = [
  'All',
  'Tournament Win',
  'Runner-up',
  'Top 3',
  'MVP Award',
  'National Event',
  'International Event',
  'Community Award',
  'Content Creator Award',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  'Tournament Win':      '#d4af37',
  'Runner-up':          '#c0c0c0',
  'Top 3':              '#cd7f32',
  'MVP Award':          '#ff6b00',
  'National Event':     '#00d4ff',
  'International Event':'#9945ff',
  'Community Award':    '#10b981',
  'Content Creator Award': '#ff0080',
};

type ViewMode = 'cards' | 'timeline' | 'table';

function PlacementBadge({ placement }: { placement: string }) {
  const color =
    placement === '1st' ? '#d4af37' :
    placement === '2nd' ? '#c0c0c0' :
    placement === '3rd' ? '#cd7f32' : '#666';
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase"
      style={{ background: `${color}20`, border: `1px solid ${color}60`, color }}>
      {placement}
    </span>
  );
}

function AchievementModal({ item, onClose }: { item: Achievement; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const catColor = CATEGORY_COLORS[item.category] ?? GOLD;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative max-w-2xl w-full rounded-2xl overflow-hidden"
          style={{ background: '#0d0d0d', border: `1px solid ${catColor}30` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header strip */}
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${catColor}, ${catColor}44)` }} />

          <div className="p-6 space-y-5">
            {/* Top row */}
            <div className="flex items-start gap-4">
              <div className="text-5xl leading-none">{item.trophyIcon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase"
                    style={{ background: `${catColor}18`, border: `1px solid ${catColor}40`, color: catColor }}>
                    {item.category}
                  </span>
                  <PlacementBadge placement={item.placement} />
                  {item.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase"
                      style={{ background: '#d4af3718', border: '1px solid #d4af3740', color: GOLD }}>
                      ★ Featured
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-white leading-snug">{item.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {item.prizePool && <span className="ml-3 text-green-400 font-bold">{item.prizePool}</span>}
                </p>
              </div>
              <button onClick={onClose}
                className="text-gray-600 hover:text-white transition-colors text-xl leading-none p-1">✕</button>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {item.mvp && (
                <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-1">MVP</p>
                  <p className="text-white font-bold text-sm">{item.mvp}</p>
                </div>
              )}
              {item.result && (
                <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-1">Result</p>
                  <p className="font-bold text-sm" style={{ color: item.result === 'W' ? '#10b981' : item.result === 'L' ? '#e94560' : GOLD }}>{item.result}</p>
                </div>
              )}
            </div>

            {/* Roster */}
            {item.teamRoster && item.teamRoster.length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">Team Roster</p>
                <div className="flex flex-wrap gap-2">
                  {item.teamRoster.map((p, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {item.gallery && item.gallery.filter(Boolean).length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">Gallery</p>
                <div className="grid grid-cols-3 gap-2">
                  {item.gallery.filter(Boolean).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full h-20 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3 pt-1">
              {item.matchReplayUrl && (
                <a href={item.matchReplayUrl} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
                  ▶ Watch Replay
                </a>
              )}
              {item.certificateUrl && (
                <a href={item.certificateUrl} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
                  style={{ border: `1px solid ${GOLD}40`, color: GOLD }}>
                  📜 Certificate
                </a>
              )}
              {item.externalLink && (
                <a href={item.externalLink} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:text-white hover:scale-105"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                  🔗 External Link
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AchievementCard({ item, idx, onSelect }: { item: Achievement; idx: number; onSelect: (a: Achievement) => void }) {
  const [hovered, setHovered] = useState(false);
  const catColor = CATEGORY_COLORS[item.category] ?? GOLD;
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={() => onSelect(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #111114, #0d0d0d)',
        border: `1px solid ${hovered ? `${catColor}40` : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hovered ? `0 8px 30px ${catColor}15` : '0 4px 20px rgba(0,0,0,0.4)',
        transform: hovered ? 'scale(1.02) translateY(-2px)' : 'scale(1) translateY(0)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top accent bar */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${catColor}, ${catColor}22)` }} />

      <div className="p-5">
        {/* Icon row */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl leading-none">{item.trophyIcon}</div>
          {item.isFeatured && (
            <span className="text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-full"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30`, color: GOLD }}>
              ★ Featured
            </span>
          )}
        </div>

        {/* Category + placement */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase"
            style={{ background: `${catColor}15`, border: `1px solid ${catColor}35`, color: catColor }}>
            {item.category}
          </span>
          <PlacementBadge placement={item.placement} />
        </div>

        {/* Title */}
        <h3 className="font-black text-sm leading-snug mb-2 transition-colors duration-200"
          style={{ color: hovered ? '#fde68a' : '#fff' }}>
          {item.title}
        </h3>

        {/* Date + Prize */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
          {item.prizePool && <span className="font-black text-green-400">{item.prizePool}</span>}
        </div>

        {/* MVP + Result row */}
        <div className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[10px] text-gray-600">
            {item.mvp ? `⭐ MVP: ${item.mvp}` : item.teamRoster?.length ? `👥 ${item.teamRoster.length} players` : ''}
          </span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded"
            style={{
              color: item.result === 'W' ? '#10b981' : item.result === 'L' ? '#e94560' : GOLD,
              background: item.result === 'W' ? '#10b98115' : item.result === 'L' ? '#e9456015' : `${GOLD}15`,
            }}>
            {item.result}
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-4">
        <div className="text-[10px] font-black tracking-widest uppercase transition-all duration-200"
          style={{ color: catColor, opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-4px)' }}>
          VIEW DETAILS →
        </div>
      </div>
    </motion.div>
  );
}

function CardView({ items, onSelect }: { items: Achievement[]; onSelect: (a: Achievement) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((item, idx) => (
        <AchievementCard key={item.id} item={item} idx={idx} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TimelineView({ items, onSelect }: { items: Achievement[]; onSelect: (a: Achievement) => void }) {
  const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden sm:block"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.3) 10%, rgba(212,175,55,0.3) 90%, transparent)' }} />

      <div className="space-y-8">
        {sorted.map((item, idx) => {
          const catColor = CATEGORY_COLORS[item.category] ?? GOLD;
          const isLeft = idx % 2 === 0;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative flex items-center gap-6 sm:gap-0 ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
            >
              {/* Card */}
              <div className={`flex-1 sm:w-[45%] ${isLeft ? 'sm:pr-10' : 'sm:pl-10'}`}>
                <div
                  onClick={() => onSelect(item)}
                  className="cursor-pointer p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: '#111114',
                    border: `1px solid ${catColor}25`,
                    boxShadow: `0 4px 20px ${catColor}08`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none mt-0.5">{item.trophyIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <PlacementBadge placement={item.placement} />
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase"
                          style={{ background: `${catColor}15`, color: catColor }}>
                          {item.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white leading-snug">{item.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {item.prizePool && <span className="ml-2 text-green-400 font-bold">{item.prizePool}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center dot */}
              <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full items-center justify-center z-10"
                style={{ background: catColor, boxShadow: `0 0 12px ${catColor}80` }} />

              {/* Year label */}
              <div className="hidden sm:block flex-1 sm:w-[45%]" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TableView({ items, onSelect }: { items: Achievement[]; onSelect: (a: Achievement) => void }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(212,175,55,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Trophy', 'Achievement', 'Category', 'Date', 'Placement', 'Prize Pool', 'Result'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const catColor = CATEGORY_COLORS[item.category] ?? GOLD;
              return (
                <tr key={item.id}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer transition-all duration-150 hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                >
                  <td className="px-4 py-3 text-xl">{item.trophyIcon}</td>
                  <td className="px-4 py-3 font-bold text-white max-w-[200px]">
                    <span className="line-clamp-1">{item.title}</span>
                    {item.isFeatured && <span className="ml-2 text-[9px] text-yellow-400 font-black uppercase">★</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase"
                      style={{ background: `${catColor}15`, color: catColor }}>{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3"><PlacementBadge placement={item.placement} /></td>
                  <td className="px-4 py-3 text-green-400 font-bold">{item.prizePool || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-black text-xs"
                      style={{ color: item.result === 'W' ? '#10b981' : item.result === 'L' ? '#e94560' : GOLD }}>
                      {item.result}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { db, loading } = useDatabase();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sort, setSort] = useState<'date' | 'placement' | 'prize'>('date');
  const [selected, setSelected] = useState<Achievement | null>(null);

  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const achievements: Achievement[] = db.achievements ?? [];
  const visible = achievements.filter(a => a.visible !== false);

  const filtered = useMemo(() => {
    let out = visible;
    if (category !== 'All') out = out.filter(a => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q));
    }
    return [...out].sort((a, b) => {
      if (sort === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'placement') {
        const order = ['1st', '2nd', '3rd'];
        return (order.indexOf(a.placement) === -1 ? 99 : order.indexOf(a.placement)) - (order.indexOf(b.placement) === -1 ? 99 : order.indexOf(b.placement));
      }
      // prize
      const aPrice = parseFloat((a.prizePool ?? '0').replace(/[^0-9.]/g, '')) || 0;
      const bPrice = parseFloat((b.prizePool ?? '0').replace(/[^0-9.]/g, '')) || 0;
      return bPrice - aPrice;
    });
  }, [visible, category, search, sort]);

  const featured = visible.filter(a => a.isFeatured);
  const totalPrize = visible.reduce((sum, a) => sum + (parseFloat((a.prizePool ?? '0').replace(/[^0-9.,KkMm]/g, '')) || 0), 0);

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* ── Hero ── */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(ellipse, #d4af37, transparent)' }} />
        </div>
        {/* Floating trophies bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['🏆','🥇','🎖️','⚡','🥈'].map((emoji, i) => (
            <div key={i} className="absolute text-3xl opacity-[0.06]"
              style={{ left: `${12 + i * 18}%`, top: `${20 + (i % 2) * 30}%` }}>
              {emoji}
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: GOLD }}>
                🏆 Competitive Record
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
              <span className="text-white">ACHIEVEMENT </span>
              <span style={{
                background: 'linear-gradient(135deg, #d4af37, #f5e27e)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>CENTER</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Every title, every trophy, every record — the complete competitive history of ${PUBLIC_BRAND_NAME}.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-10">

        {/* ── Stats row ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🏆', label: 'Total Achievements', value: visible.length },
            { icon: '🥇', label: 'Tournament Wins', value: visible.filter(a => a.category === 'Tournament Win').length },
            { icon: '⭐', label: 'Featured', value: featured.length },
            { icon: '💰', label: 'Prize Pool Earned', value: `$${totalPrize.toLocaleString()}` },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-black" style={{ color: GOLD }}>{stat.value}</div>
              <div className="text-[10px] font-black tracking-widest uppercase text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Featured ── */}
        {featured.length > 0 && (
          <div>
            <h2 className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: GOLD }}>★ Featured Achievements</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {featured.slice(0, 2).map(item => {
                const catColor = CATEGORY_COLORS[item.category] ?? GOLD;
                return (
                  <div key={item.id} onClick={() => setSelected(item)} className="cursor-pointer rounded-2xl p-5 flex gap-4 items-start transition-all duration-200 hover:scale-[1.01]"
                    style={{ background: `linear-gradient(135deg, ${catColor}0a, rgba(13,13,13,0.9))`, border: `1px solid ${catColor}30` }}>
                    <div className="text-4xl leading-none">{item.trophyIcon}</div>
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                          style={{ background: `${catColor}20`, color: catColor }}>{item.category}</span>
                        <PlacementBadge placement={item.placement} />
                      </div>
                      <h3 className="font-black text-white text-sm">{item.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        {item.prizePool && <span className="ml-2 text-green-400 font-bold">{item.prizePool}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters & Controls ── */}
        <div className="space-y-4">
          {/* Search + Sort + View */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search achievements…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none focus:border-yellow-500/40 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            <Combobox value={sort} onChange={e => setSort(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="date">Sort: Latest</option>
              <option value="placement">Sort: Placement</option>
              <option value="prize">Sort: Prize Pool</option>
            </Combobox>

            {/* View mode */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {([['cards', '▦'], ['timeline', '⏱'], ['table', '☰']] as [ViewMode, string][]).map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="px-3 py-2.5 text-sm transition-all"
                  style={{
                    background: viewMode === mode ? `${GOLD}20` : 'rgba(255,255,255,0.03)',
                    color: viewMode === mode ? GOLD : 'rgba(255,255,255,0.3)',
                    borderRight: mode !== 'table' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const active = category === cat;
              const color = cat === 'All' ? GOLD : (CATEGORY_COLORS[cat] ?? GOLD);
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-200"
                  style={{
                    background: active ? `${color}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${color}50` : 'rgba(255,255,255,0.08)'}`,
                    color: active ? color : 'rgba(255,255,255,0.3)',
                  }}>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results count ── */}
        <p className="text-xs text-gray-600 font-bold tracking-widest uppercase">
          {filtered.length} achievement{filtered.length !== 1 ? 's' : ''} {category !== 'All' ? `in "${category}"` : ''} {search ? `matching "${search}"` : ''}
        </p>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-600 font-bold tracking-widest uppercase text-sm">No achievements found</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }}
              className="mt-4 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
              style={{ border: `1px solid ${GOLD}40`, color: GOLD }}>
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <CardView items={filtered} onSelect={setSelected} />
        ) : viewMode === 'timeline' ? (
          <TimelineView items={filtered} onSelect={setSelected} />
        ) : (
          <TableView items={filtered} onSelect={setSelected} />
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && <AchievementModal item={selected} onClose={() => setSelected(null)} />}

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
