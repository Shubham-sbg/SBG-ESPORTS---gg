import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { WeeklyEvent } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

// ─── Constants ───────────────────────────────────────────────────────────────
const GOLD = '#d4af37';
const GOLD_BRIGHT = '#f5e27e';

const GAME_COLORS: Record<string, string> = {
  'BGMI': '#3b82f6',
  'FREE FIRE': '#f97316',
  'VALORANT': '#e94560',
  'COD MOBILE': '#22c55e',
};
const gameColor = (game: string) => GAME_COLORS[game?.toUpperCase()] ?? GOLD;

const EVENT_TYPE_COLORS: Record<string, string> = {
  match: GOLD,
  practice: '#06b6d4',
  scrim: '#8b5cf6',
  tournament: '#f97316',
  community: '#10b981',
  training: '#3b82f6',
  other: '#6b7280',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  upcoming: { label: 'UPCOMING', color: GOLD, bg: '#d4af3722' },
  live:      { label: 'LIVE',     color: '#22c55e', bg: '#22c55e22', pulse: true },
  completed: { label: 'ENDED',    color: '#6b7280', bg: '#6b728022' },
  cancelled: { label: 'CANCELLED',color: '#ef4444', bg: '#ef444422' },
  postponed: { label: 'POSTPONED',color: '#f59e0b', bg: '#f59e0b22' },
};

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: Date) { return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`; }

function startOfWeek(d: Date) {
  const c = new Date(d); c.setHours(0,0,0,0);
  c.setDate(c.getDate() - c.getDay()); // Sunday
  return c;
}

function addDays(d: Date, n: number) {
  const c = new Date(d); c.setDate(c.getDate() + n); return c;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function parseEventDate(ev: WeeklyEvent): Date {
  return new Date(`${ev.date}T${ev.time}:00`);
}

function downloadICS(event: WeeklyEvent) {
  const dt = event.date.replace(/-/g,'') + 'T' + event.time.replace(':','') + '00';
  const ics =
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:' + dt +
    '\r\nSUMMARY:' + event.title +
    '\r\nDESCRIPTION:' + event.tournamentName +
    '\r\nEND:VEVENT\r\nEND:VCALENDAR';
  const a = document.createElement('a');
  a.href = 'data:text/calendar;charset=utf8,' + encodeURIComponent(ics);
  a.download = event.title.replace(/\s+/g,'_') + '.ics';
  a.click();
}

// ─── Countdown ───────────────────────────────────────────────────────────────
function Countdown({ event }: { event: WeeklyEvent }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const calc = () => {
      const start = parseEventDate(event);
      const now = Date.now();
      const diff = start.getTime() - now;
      if (diff <= 0 && diff > -(event.duration ?? 60) * 60 * 1000) {
        setLabel('LIVE NOW');
      } else if (diff <= 0) {
        setLabel('ENDED');
      } else if (diff > 7 * 24 * 60 * 60 * 1000) {
        setLabel('');
      } else {
        const totalMin = Math.floor(diff / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const mins = totalMin % 60;
        if (days > 0) setLabel(`In ${days}d ${hours}h ${mins}m`);
        else setLabel(`${hours}h ${mins}m`);
      }
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [event]);

  if (!label) return null;

  const isLiveNow = label === 'LIVE NOW';
  const isEnded = label === 'ENDED';
  return (
    <span
      className={`text-xs font-black px-2 py-0.5 rounded-full ${isLiveNow ? 'animate-pulse' : ''}`}
      style={{
        color: isLiveNow ? '#22c55e' : isEnded ? '#6b7280' : GOLD,
        background: isLiveNow ? '#22c55e22' : isEnded ? '#6b728022' : '#d4af3722',
      }}
    >
      {label}
    </span>
  );
}

// ─── Event Card ──────────────────────────────────────────────────────────────
function EventCard({ event }: { event: WeeklyEvent }) {
  const remKey = `sbg_reminder_${event.id}`;
  const [reminded, setReminded] = useState(() => localStorage.getItem(remKey) === '1');

  const toggleReminder = () => {
    const next = !reminded;
    if (next) localStorage.setItem(remKey, '1'); else localStorage.removeItem(remKey);
    setReminded(next);
  };

  const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.upcoming;
  const typColor = EVENT_TYPE_COLORS[event.eventType] ?? '#6b7280';
  const gc = gameColor(event.game);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl overflow-hidden flex"
      style={{
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* colored left border by game */}
      <div className="w-1 flex-shrink-0" style={{ background: gc }} />

      <div className="flex-1 p-5 space-y-3">
        {/* Top row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {event.gameLogo && (
              <img src={event.gameLogo} alt={event.game} className="w-6 h-6 rounded object-contain" />
            )}
            <span
              className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ color: typColor, background: typColor + '22' }}
            >
              {event.eventType}
            </span>
            <span
              className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusCfg.pulse ? 'animate-pulse' : ''}`}
              style={{ color: statusCfg.color, background: statusCfg.bg }}
            >
              {statusCfg.label}
            </span>
            <Countdown event={event} />
          </div>
          <span className="text-xs text-gray-500">{event.game}</span>
        </div>

        {/* Title */}
        <h3 className="font-black text-white text-base leading-tight">{event.title}</h3>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-400">
          <span>🗓 {event.date} · {event.time}</span>
          {event.duration && <span>⏱ {event.duration} min</span>}
          {event.opponent && <span>⚔️ vs {event.opponent}</span>}
          {event.tournamentName && <span>🏆 {event.tournamentName}</span>}
          {event.venue && <span>📍 {event.venue}</span>}
        </div>

        {event.notes && (
          <p className="text-xs text-gray-500 italic">{event.notes}</p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {event.streamUrl && (
            <a
              href={event.streamUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest text-black"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
            >
              🔴 Watch Live
            </a>
          )}
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest"
              style={{ border: `1px solid ${GOLD}66`, color: GOLD, background: GOLD + '11' }}
            >
              🎟 Buy Ticket
            </a>
          )}
          {event.registerUrl && (
            <a
              href={event.registerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest text-black"
              style={{ background: `linear-gradient(135deg,${GOLD},#b8960c)` }}
            >
              📝 Register
            </a>
          )}
          <button
            onClick={toggleReminder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            style={{
              border: `1px solid ${reminded ? '#22c55e66' : 'rgba(255,255,255,0.1)'}`,
              color: reminded ? '#22c55e' : '#9ca3af',
              background: reminded ? '#22c55e11' : 'transparent',
            }}
          >
            {reminded ? '✓ Reminder Set' : '🔔 Set Reminder'}
          </button>
          <button
            onClick={() => downloadICS(event)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af',
            }}
          >
            📅 Add to Calendar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Day Column (grid view) ──────────────────────────────────────────────────
function DayColumn({ date, events, today }: { date: Date; events: WeeklyEvent[]; today: Date }) {
  const isToday = isSameDay(date, today);
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 min-h-[80px]"
      style={{
        background: '#111114',
        border: isToday ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isToday ? `0 0 18px 2px ${GOLD}44` : undefined,
      }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="text-sm font-black uppercase tracking-widest"
          style={{ color: isToday ? GOLD : '#6b7280' }}
        >
          {DAY_NAMES[date.getDay()].slice(0,3)}
        </span>
        <span
          className="text-xs"
          style={{ color: isToday ? GOLD_BRIGHT : '#4b5563' }}
        >
          {fmtDate(date)}
        </span>
        {isToday && (
          <span className="text-xs font-black uppercase px-1.5 py-0.5 rounded-full" style={{ color: '#080808', background: GOLD }}>
            TODAY
          </span>
        )}
      </div>
      {events.length === 0 && (
        <p className="text-xs text-gray-700 italic">No events</p>
      )}
      {events.map(ev => <EventCard key={ev.id} event={ev} />)}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const EVENT_TYPES = ['match','practice','scrim','tournament','community','training','other'] as const;
const STATUSES = ['upcoming','live','completed','cancelled','postponed'] as const;

export default function SchedulePage() {
  const { db, loading } = useDatabase();
  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const weekStart = useMemo(() => addDays(startOfWeek(today), weekOffset * 7), [today, weekOffset]);
  const weekEnd   = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const pageTitle = db.settings?.schedulePageTitle || 'WEEKLY SCHEDULE';

  const visibleEvents = useMemo(() =>
    (db.weeklyEvents ?? []).filter(e => e.visible !== false),
  [db.weeklyEvents]);

  const filteredEvents = useMemo(() => {
    return visibleEvents.filter(ev => {
      const evDate = new Date(ev.date);
      const inWeek = evDate >= weekStart && evDate <= addDays(weekEnd, 1);
      const typeOk = filterType === 'all' || ev.eventType === filterType;
      const statusOk = filterStatus === 'all' || ev.status === filterStatus;
      return inWeek && typeOk && statusOk;
    }).sort((a, b) => {
      const da = new Date(`${a.date}T${a.time}`).getTime();
      const db2 = new Date(`${b.date}T${b.time}`).getTime();
      return da - db2 || a.order - b.order;
    });
  }, [visibleEvents, weekStart, weekEnd, filterType, filterStatus]);

  // group by day index 0..6
  const byDay = useMemo(() => {
    const map: Map<number, WeeklyEvent[]> = new Map();
    for (let i = 0; i < 7; i++) map.set(i, []);
    filteredEvents.forEach(ev => {
      const d = new Date(ev.date);
      const diff = Math.round((d.getTime() - weekStart.getTime()) / 86400000);
      if (diff >= 0 && diff <= 6) map.get(diff)!.push(ev);
    });
    return map;
  }, [filteredEvents, weekStart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">

        {/* Page header */}
        <div className="text-center space-y-2">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: GOLD }}>{db.settings.organizationName || PUBLIC_BRAND_NAME}</p>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white">{pageTitle}</h1>
          <div className="w-16 h-0.5 mx-auto" style={{ background: GOLD }} />
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black transition-all hover:scale-110"
            style={{ border: `1px solid ${GOLD}66`, color: GOLD }}
          >
            ‹
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all"
            style={{
              border: `1px solid ${weekOffset === 0 ? GOLD : 'rgba(255,255,255,0.1)'}`,
              color: weekOffset === 0 ? GOLD : '#9ca3af',
              background: weekOffset === 0 ? GOLD + '22' : 'transparent',
            }}
          >
            {fmtDate(weekStart)} – {fmtDate(weekEnd)}{weekOffset === 0 ? ' (This Week)' : ''}
          </button>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black transition-all hover:scale-110"
            style={{ border: `1px solid ${GOLD}66`, color: GOLD }}
          >
            ›
          </button>
        </div>

        {/* Filters + view toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Type pills */}
            {(['all', ...EVENT_TYPES] as string[]).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                style={{
                  background: filterType === t ? (t === 'all' ? GOLD : EVENT_TYPE_COLORS[t] ?? GOLD) : 'rgba(255,255,255,0.05)',
                  color: filterType === t ? (t === 'all' ? '#080808' : '#fff') : '#9ca3af',
                  border: `1px solid ${filterType === t ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <Combobox
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              }}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </Combobox>
            {/* View toggle */}
            <button
              onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              style={{
                border: `1px solid ${GOLD}66`,
                color: GOLD,
                background: GOLD + '11',
              }}
            >
              {viewMode === 'list' ? '⊞ Grid' : '≡ List'}
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {filteredEvents.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-24 space-y-3"
            >
              <div className="text-5xl">📅</div>
              <p className="font-black text-xl uppercase tracking-widest" style={{ color: GOLD }}>No Events This Week</p>
              <p className="text-gray-600 text-sm">Check back later or navigate to another week.</p>
            </motion.div>
          ) : viewMode === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {filteredEvents.map(ev => <EventCard key={ev.id} event={ev} />)}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3"
            >
              {Array.from({ length: 7 }, (_, i) => (
                <DayColumn
                  key={i}
                  date={addDays(weekStart, i)}
                  events={byDay.get(i) ?? []}
                  today={today}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
