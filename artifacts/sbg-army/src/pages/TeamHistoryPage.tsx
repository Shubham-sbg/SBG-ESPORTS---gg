import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { TeamSeason } from '@/lib/database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';

export default function TeamHistoryPage() {
  const { db, loading } = useDatabase();
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  const seasons = useMemo(
    () =>
      (db.teamSeasons ?? [])
        .filter((s) => s.visible)
        .sort((a, b) => b.year - a.year),
    [db.teamSeasons]
  );

  const years = useMemo(
    () => Array.from(new Set(seasons.map((s) => s.year))).sort((a, b) => b - a),
    [seasons]
  );

  const scrollToYear = (year: number) => {
    setActiveYear(year);
    const el = sectionRefs.current[year];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-black uppercase tracking-[0.4em] mb-3" style={{ color: GOLD }}>{db.settings.organizationName || PUBLIC_BRAND_NAME}</p>
            <h1
              className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4"
              style={{ textShadow: `0 0 40px ${GOLD}55` }}
            >
              {db.settings?.teamHistoryTitle || 'TEAM HISTORY'}
            </h1>
            <p className="text-lg text-gray-400">Our journey through the seasons.</p>
          </motion.div>
        </div>
      </section>

      {/* Year filter */}
      {years.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-10">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

      {/* Seasons */}
      <section className="max-w-7xl mx-auto px-4 pb-24 space-y-10">
        {seasons.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-lg font-bold">No season history available yet.</p>
          </div>
        ) : (
          seasons.map((season, i) => (
            <div
              key={season.id}
              ref={(el) => { sectionRefs.current[season.year] = el; }}
            >
              <SeasonCard season={season} index={i} />
            </div>
          ))
        )}
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

function SeasonCard({ season, index }: { season: TeamSeason; index: number }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, color: '#000' }}
          >
            {season.year}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-white">{season.season}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {season.startDate}
              {season.endDate ? ` → ${season.endDate}` : ' → Present'}
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-xl">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-8 space-y-8">
              {/* Roster */}
              {season.roster && season.roster.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
                    Roster
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {season.roster.map((player, pi) => (
                      <div
                        key={pi}
                        className="rounded-xl p-4 text-center"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: player.isCaptain
                            ? `1px solid ${GOLD}60`
                            : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.ign}
                            className="w-14 h-14 rounded-full object-cover mx-auto mb-2"
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-black"
                            style={{ background: 'rgba(212,175,55,0.15)', color: GOLD }}
                          >
                            {player.ign.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-1">
                          {player.isCaptain && <span className="text-sm">👑</span>}
                          <span className="text-sm font-black text-white truncate">{player.ign}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{player.name}</div>
                        <div
                          className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
                          style={{ background: 'rgba(212,175,55,0.15)', color: GOLD }}
                        >
                          {player.role}
                        </div>
                        {player.country && (
                          <div className="text-xs text-gray-600 mt-1">{player.country}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaches / Managers */}
              {((season.coaches && season.coaches.length > 0) ||
                (season.managers && season.managers.length > 0)) && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
                    Staff
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[...(season.coaches ?? []), ...(season.managers ?? [])].map((staff, si) => (
                      <div
                        key={si}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}
                          >
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-white">{staff.name}</div>
                          <div className="text-xs text-gray-500">{staff.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jersey */}
              {season.jerseyImage && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
                    Jersey
                  </h3>
                  <img
                    src={season.jerseyImage}
                    alt="Season Jersey"
                    className="h-48 object-contain rounded-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
              )}

              {/* Achievements */}
              {season.achievements && season.achievements.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-3">
                    Achievements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {season.achievements.map((a, ai) => (
                      <span
                        key={ai}
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}40` }}
                      >
                        🏆 {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tournaments */}
              {season.tournaments && season.tournaments.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-3">
                    Tournaments
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {season.tournaments.map((t, ti) => (
                      <span
                        key={ti}
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: 'rgba(0,212,255,0.1)',
                          color: '#00d4ff',
                          border: '1px solid rgba(0,212,255,0.3)',
                        }}
                      >
                        🎮 {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors */}
              {season.sponsors && season.sponsors.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-3">
                    Sponsors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {season.sponsors.map((s, si) => (
                      <span
                        key={si}
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#888',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {season.notes && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{season.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
