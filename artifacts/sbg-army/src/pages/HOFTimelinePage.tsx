import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { HOFMilestone } from '@/lib/database';
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

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function HOFTimelinePage() {
  const { db, loading } = useDatabase();
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const yearRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  const milestones = useMemo(
    () =>
      (db.hofMilestones ?? [])
        .filter((m) => m.visible)
        .sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0)),
    [db.hofMilestones]
  );

  const years = useMemo(
    () => Array.from(new Set(milestones.map((m) => m.year))).sort((a, b) => b - a),
    [milestones]
  );

  const grouped = useMemo(() => {
    const map: Record<number, HOFMilestone[]> = {};
    for (const m of milestones) {
      if (!map[m.year]) map[m.year] = [];
      map[m.year].push(m);
    }
    return map;
  }, [milestones]);

  const scrollToYear = (year: number) => {
    setActiveYear(year);
    const el = yearRefs.current[year];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${GOLD}, transparent)` }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-xs font-black uppercase tracking-[0.4em] mb-3" style={{ color: GOLD }}>{db.settings.organizationName || PUBLIC_BRAND_NAME}</p>
            <h1
              className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4"
              style={{ textShadow: `0 0 40px ${GOLD}55` }}
            >
              HALL OF FAME
            </h1>
            <p className="text-lg text-gray-400">The moments that defined us.</p>
          </motion.div>
        </div>
      </section>

      {/* Year filter */}
      {years.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-12">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => scrollToYear(year)}
                className="flex-shrink-0 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200"
                style={{
                  background:
                    activeYear === year
                      ? `linear-gradient(135deg, ${GOLD}, #b8960c)`
                      : 'rgba(255,255,255,0.05)',
                  color: activeYear === year ? '#000' : '#aaa',
                  border: activeYear === year ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {year}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        {milestones.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">🏛️</div>
            <p className="text-lg font-bold">No milestones yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Center line */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block"
              style={{ background: `linear-gradient(to bottom, ${GOLD}88, transparent)`, transform: 'translateX(-50%)' }}
            />
            {/* Mobile line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-px md:hidden"
              style={{ background: `linear-gradient(to bottom, ${GOLD}88, transparent)` }}
            />

            <div className="space-y-16">
              {years.map((year) => (
                <div
                  key={year}
                  id={`year-${year}`}
                  ref={(el) => { yearRefs.current[year] = el; }}
                >
                  {/* Year badge */}
                  <div className="relative flex justify-center md:justify-center mb-8">
                    <div className="relative z-10 ml-12 md:ml-0">
                      <div
                        className="px-6 py-2 rounded-full font-black text-lg tracking-widest"
                        style={{
                          background: `linear-gradient(135deg, ${GOLD}, #b8960c)`,
                          color: '#000',
                          boxShadow: `0 0 20px ${GOLD}44`,
                        }}
                      >
                        {year}
                      </div>
                    </div>
                  </div>

                  {/* Milestones for this year */}
                  <div className="space-y-8">
                    {(grouped[year] ?? []).map((milestone, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <TimelineCard
                          key={milestone.id}
                          milestone={milestone}
                          index={idx}
                          isLeft={isEven}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

function TimelineCard({
  milestone,
  index,
  isLeft,
}: {
  milestone: HOFMilestone;
  index: number;
  isLeft: boolean;
}) {
  const color = CATEGORY_COLORS[milestone.category] ?? GOLD;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
      className={`relative flex items-start gap-4 md:gap-0 ${
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      {/* Card — desktop half width */}
      <div className={`flex-1 md:w-1/2 ${isLeft ? 'md:pr-12' : 'md:pl-12'} ml-12 md:ml-0`}>
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: '#111114',
            border: `1px solid ${milestone.featured ? color + '80' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: milestone.featured ? `0 0 24px ${color}30` : 'none',
          }}
        >
          {/* Featured badge */}
          {milestone.featured && (
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-black"
              style={{ background: `${color}33`, color, border: `1px solid ${color}66` }}
            >
              ★ FEATURED
            </div>
          )}

          {/* Icon + category */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{milestone.icon}</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest"
              style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
            >
              {milestone.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-black uppercase tracking-wide text-white mb-1">
            {milestone.title}
          </h3>

          {/* Month/Year */}
          <div className="text-xs font-bold mb-3" style={{ color }}>
            {milestone.month ? `${MONTH_NAMES[milestone.month]} ` : ''}{milestone.year}
          </div>

          {/* Image */}
          {milestone.image && (
            <img
              src={milestone.image}
              alt={milestone.title}
              className="w-full h-36 object-cover rounded-xl mb-3"
            />
          )}

          {/* Description */}
          <p className="text-sm text-gray-400 leading-relaxed mb-3">{milestone.description}</p>

          {/* Prize pool */}
          {milestone.prizePool && (
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-black mb-2"
              style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44` }}
            >
              💰 {milestone.prizePool}
            </div>
          )}

          {/* Player name */}
          {milestone.playerName && (
            <div className="text-sm text-gray-400">
              <span className="text-gray-600">Player: </span>
              <span className="font-bold text-white">{milestone.playerName}</span>
            </div>
          )}

          {/* Badge */}
          {milestone.badge && (
            <div className="mt-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {milestone.badge}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dot on center line — desktop */}
      <div
        className="absolute left-1/2 top-5 w-4 h-4 rounded-full border-2 -translate-x-1/2 hidden md:block z-10"
        style={{ background: color, borderColor: '#080808', boxShadow: `0 0 10px ${color}` }}
      />

      {/* Dot on left line — mobile */}
      <div
        className="absolute left-6 top-5 w-3 h-3 rounded-full -translate-x-1/2 md:hidden z-10"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />

      {/* Spacer for opposite side — desktop */}
      <div className="hidden md:block flex-1 md:w-1/2" />
    </motion.div>
  );
}
