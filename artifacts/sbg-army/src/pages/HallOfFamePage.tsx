import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { HOFMilestone, Trophy } from '@/lib/database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';

const CATEGORY_COLORS: Record<HOFMilestone['category'], string> = {
  Founded: '#9945ff',
  'Tournament Win': '#d4af37',
  Championship: '#fbbf24',
  Signing: '#00d4ff',
  Sponsor: '#10b981',
  Milestone: '#f97316',
  Record: '#ef4444',
  'Roster Change': '#06b6d4',
  Award: '#ec4899',
  Expansion: '#8b5cf6',
};

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HallOfFamePage() {
  const { db, loading } = useDatabase();

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  const milestones: HOFMilestone[] = useMemo(
    () => (db.hofMilestones ?? [])
      .filter(m => m.visible !== false)
      .sort((a, b) => (a.year - b.year) || ((a.month ?? 0) - (b.month ?? 0)) || (a.order - b.order)),
    [db.hofMilestones]
  );

  const trophies: Trophy[] = useMemo(
    () => (db.trophies ?? []).filter(t => t.visible !== false),
    [db.trophies]
  );

  const years = useMemo(() => Array.from(new Set(milestones.map(m => m.year))).sort((a, b) => a - b), [milestones]);

  const stats = useMemo(() => {
    const championships = trophies.filter(t => t.placement === '1st').length;
    const golds = trophies.filter(t => t.placement === '1st').length;
    const matches = 0;
    return [
      { icon: '🏆', count: `${championships}+`, label: 'Championships' },
      { icon: '🥇', count: `${golds}`, label: 'Gold Medals' },
      { icon: '🎮', count: `${trophies.length}`, label: 'Trophies Won' },
      { icon: '⭐', count: `${milestones.filter(m => m.featured).length}`, label: 'Featured Milestones' },
    ];
  }, [trophies, milestones]);

  const grouped = useMemo(() => {
    const map = new Map<number, HOFMilestone[]>();
    for (const m of milestones) {
      if (!map.has(m.year)) map.set(m.year, []);
      map.get(m.year)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [milestones]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/20 via-orange-900/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute text-yellow-400/10 text-2xl font-black select-none"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, transform: 'rotate(-15deg)' }}>
              ★
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-5 py-2 mb-6">
            <span className="text-yellow-400 text-sm font-bold tracking-widest uppercase">Legacy & Glory</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-wider mb-4">
            <span className="text-white">HALL OF </span>
            <span className="text-yellow-400" style={{ textShadow: '0 0 40px #fbbf2488' }}>FAME</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Celebrating the legends, achievements, and milestones that define {db.settings.organizationName || PUBLIC_BRAND_NAME}'s journey to the top of competitive esports.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Trophy Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(t => (
            <div key={t.label} className="bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl p-6 text-center hover:border-yellow-500/40 transition-all">
              <div className="text-4xl mb-2">{t.icon}</div>
              <div className="text-3xl font-black text-yellow-400">{t.count}</div>
              <div className="text-gray-400 text-sm font-bold tracking-widest uppercase mt-1">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Year Jump Nav */}
        {years.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
            {years.map(y => (
              <a key={y} href={`#year-${y}`}
                className="flex-shrink-0 px-4 py-2 rounded-full border border-yellow-500/20 text-yellow-400 text-sm font-bold hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all">
                {y}
              </a>
            ))}
          </div>
        )}

        {/* Timeline */}
        {grouped.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">🏆</div>
            <p className="font-bold">No milestones yet — check back soon.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-yellow-500/40 via-yellow-500/10 to-transparent -translate-x-1/2" />
            {grouped.map(([year, items]) => (
              <div key={year} id={`year-${year}`} className="mb-14 scroll-mt-28">
                <div className="flex items-center justify-center mb-8">
                  <div className="px-6 py-2 rounded-full bg-yellow-500 text-black font-black text-lg tracking-widest">{year}</div>
                </div>
                <div className="space-y-8">
                  {items.map((m, idx) => {
                    const color = CATEGORY_COLORS[m.category] || GOLD;
                    const fromLeft = idx % 2 === 0;
                    return (
                      <div key={m.id}
                        className={`md:flex items-center gap-6 ${fromLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                        <div className="hidden md:block md:w-1/2" />
                        <div className="hidden md:flex w-4 h-4 rounded-full flex-shrink-0 relative z-10"
                          style={{ background: color, boxShadow: `0 0 16px ${color}99` }} />
                        <div className="md:w-1/2">
                          <div className="rounded-2xl p-5 border relative overflow-hidden"
                            style={{
                              background: '#111114',
                              borderColor: m.featured ? color : 'rgba(255,255,255,0.08)',
                              boxShadow: m.featured ? `0 0 30px ${color}33` : 'none',
                            }}>
                            {m.featured && (
                              <div className="absolute top-3 right-3 text-[10px] font-black tracking-widest px-2 py-1 rounded"
                                style={{ background: `${color}22`, color }}>
                                ★ FEATURED
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-3xl">{m.icon}</span>
                              <div>
                                <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{m.category}</div>
                                <div className="text-xs text-gray-500">
                                  {m.month ? `${MONTH_NAMES[m.month]} ${m.year}` : m.year}
                                </div>
                              </div>
                            </div>
                            <h3 className="text-white font-black text-lg mb-1">{m.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-2">{m.description}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {m.playerName && <span className="bg-white/5 px-2 py-1 rounded text-gray-300">👤 {m.playerName}</span>}
                              {m.prizePool && <span className="bg-white/5 px-2 py-1 rounded text-gray-300">💰 {m.prizePool}</span>}
                              {m.badge && <span className="px-2 py-1 rounded font-bold" style={{ background: `${color}22`, color }}>{m.badge}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
