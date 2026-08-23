import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { TeamRecord } from '@/lib/database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';
const GOLD_BRIGHT = '#f5e27e';

const CATEGORIES = [
  'All',
  'Win Streak',
  'MVPs',
  'Kills',
  'Matches',
  'Fastest Victory',
  'Prize Money',
  'Best Finish',
  'Custom',
] as const;

type CategoryFilter = typeof CATEGORIES[number];

export default function RecordsPage() {
  const { db, loading } = useDatabase();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  const records = useMemo(
    () => (db.teamRecords ?? []).filter((r) => r.visible),
    [db.teamRecords]
  );

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return records;
    return records.filter((r) => r.category === activeCategory);
  }, [records, activeCategory]);

  const totalRecords = records.length;
  const activeRecords = records.filter((r) => r.isActive).length;
  const holdersCount = new Set(records.map((r) => r.holder).filter(Boolean)).size;

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${GOLD}, transparent)`,
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-xs font-black uppercase tracking-[0.4em] mb-3"
              style={{ color: GOLD }}
            >{db.settings.organizationName || PUBLIC_BRAND_NAME}</p>
            <h1
              className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4"
              style={{ textShadow: `0 0 40px ${GOLD}55` }}
            >
              {db.settings?.recordsPageTitle || 'RECORDS CENTER'}
            </h1>
            <p className="text-lg text-gray-400">Every barrier broken.</p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total Records', value: totalRecords },
            { label: 'Active Records', value: activeRecords },
            { label: 'Holders', value: holdersCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5 text-center"
              style={{
                background: '#111114',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="text-3xl font-black"
                style={{ color: GOLD }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Category Tabs */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
              style={{
                background:
                  activeCategory === cat
                    ? `linear-gradient(135deg, ${GOLD}, #b8960c)`
                    : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat ? '#000' : '#aaa',
                border:
                  activeCategory === cat
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Records Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-lg font-bold">No records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered
                .sort((a, b) => a.order - b.order)
                .map((record, i) => (
                  <RecordCard key={record.id} record={record} index={i} />
                ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

function RecordCard({ record, index }: { record: TeamRecord; index: number }) {
  const GOLD = '#d4af37';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: record.isActive ? 1 : 0.6, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: '#111114',
        border: record.isActive
          ? `1px solid ${GOLD}60`
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: record.isActive ? `0 0 20px ${GOLD}20` : 'none',
      }}
    >
      {/* Active pill */}
      {record.isActive && (
        <div
          className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-black uppercase tracking-widest"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, color: '#000' }}
        >
          ACTIVE RECORD
        </div>
      )}

      {/* Icon */}
      <div className="text-5xl mb-3">{record.icon}</div>

      {/* Category badge */}
      <div className="mb-2">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest"
          style={{ background: 'rgba(212,175,55,0.15)', color: GOLD, border: `1px solid ${GOLD}40` }}
        >
          {record.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
        {record.title}
      </h3>

      {/* Value */}
      <div className="flex items-end gap-2 mb-2">
        <span
          className="font-black leading-none"
          style={{
            fontSize: '2.5rem',
            color: record.numericValue !== undefined ? GOLD : 'white',
          }}
        >
          {record.numericValue !== undefined ? record.numericValue.toLocaleString() : record.value}
        </span>
        {record.unit && (
          <span className="text-sm text-gray-400 mb-1">{record.unit}</span>
        )}
      </div>

      {/* Holder */}
      {record.holder && (
        <div className="text-sm text-gray-300 mb-2">
          {record.holder === 'Team' || !record.holder ? '' : '⭐ '}{record.holder}
        </div>
      )}

      {/* Game + tournament */}
      {(record.game || record.tournamentName) && (
        <div className="text-xs text-gray-500 mb-2">
          {record.game && <span>{record.game}</span>}
          {record.game && record.tournamentName && <span className="mx-1">·</span>}
          {record.tournamentName && <span>{record.tournamentName}</span>}
        </div>
      )}

      {/* Description */}
      {record.description && (
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">{record.description}</p>
      )}

      {/* Date */}
      {record.date && (
        <div className="text-xs text-gray-600 mt-3">{record.date}</div>
      )}
    </motion.div>
  );
}
