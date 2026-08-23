import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

type EventType = 'all' | 'tournament' | 'practice' | 'scrim' | 'community' | 'giveaway';

const TYPE_COLORS: Record<string, string> = {
  tournament: '#ff6b00',
  practice: '#00d4ff',
  scrim: '#ffd700',
  community: '#a855f7',
  giveaway: '#e94560',
  general: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  tournament: '🏆 TOURNAMENT',
  practice: '⚡ PRACTICE',
  scrim: '⚔️ SCRIM',
  community: '💬 COMMUNITY',
  giveaway: '🎁 GIVEAWAY',
  general: '📅 EVENT',
};

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function EventsPage() {
  const { db, loading } = useDatabase();
  const [activeFilter, setActiveFilter] = useState<EventType>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  const allEvents = [
    ...(db.tournaments ?? [])
      .filter(t => t.visible)
      .map(t => ({
        id: t.id,
        title: t.title,
        type: 'tournament' as EventType,
        date: t.matchDate,
        time: t.matchTime,
        game: t.game,
        status: t.registrationStatus,
        prizePool: t.prizePool,
        description: t.description,
        slots: t.slots,
      })),
    ...(db.giveaways ?? [])
      .filter(g => g.visible)
      .map(g => ({
        id: g.id,
        title: g.title,
        type: 'giveaway' as EventType,
        date: g.deadline,
        time: '23:59',
        game: '',
        status: g.status,
        prizePool: g.reward,
        description: g.rules,
        slots: 0,
      })),
    ...(db.schedule ?? []).map(s => ({
      id: s.id,
      title: s.teamName + (s.opponentName ? ` vs ${s.opponentName}` : ' — ' + s.eventType),
      type: (s.eventType === 'scrim' ? 'scrim' : 'practice') as EventType,
      date: s.date,
      time: s.time,
      game: s.game,
      status: s.status,
      prizePool: '',
      description: s.notes,
      slots: 0,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filtered = activeFilter === 'all' ? allEvents : allEvents.filter(e => e.type === activeFilter);

  const now = new Date();
  const upcoming = filtered.filter(e => new Date(e.date) >= now);
  const past = filtered.filter(e => new Date(e.date) < now);

  const calendarYear = currentDate.getFullYear();
  const calendarMonth = currentDate.getMonth();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getEventsOnDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter(e => e.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative pt-24 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            LIVE CALENDAR
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span style={{ color: db.settings.primaryColor }}>SBG </span>
            <span className="text-white">EVENTS</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Tournaments, scrims, practices, giveaways — everything happening in ${PUBLIC_BRAND_NAME}.
          </p>

          {/* Quick Stats */}
          <div className="inline-flex gap-6 px-8 py-4 bg-white/3 border border-white/8 rounded-2xl">
            {[
              { label: 'Upcoming', value: upcoming.length, color: '#ff6b00' },
              { label: 'This Month', value: allEvents.filter(e => {
                const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length, color: '#00d4ff' },
              { label: 'Total Events', value: allEvents.length, color: '#ffd700' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-gray-600 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="px-4 mb-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'tournament', 'scrim', 'practice', 'community', 'giveaway'] as EventType[]).map(type => (
              <button key={type} onClick={() => setActiveFilter(type)}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 ${activeFilter === type ? 'text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                style={activeFilter === type ? { background: type === 'all' ? '#ff6b00' : TYPE_COLORS[type] ?? '#ff6b00' } : {}}>
                {type === 'all' ? '📋 ALL' : TYPE_LABELS[type] || type.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['list', 'calendar'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all duration-200 ${viewMode === mode ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {mode === 'list' ? '☰ LIST' : '📅 CALENDAR'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <section className="px-4 mb-12">
          <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <button onClick={() => setCurrentDate(new Date(calendarYear, calendarMonth - 1, 1))}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">←</button>
              <h2 className="font-black text-white text-lg tracking-wider">{MONTHS[calendarMonth]} {calendarYear}</h2>
              <button onClick={() => setCurrentDate(new Date(calendarYear, calendarMonth + 1, 1))}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">→</button>
            </div>
            <div className="grid grid-cols-7">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-black text-gray-600 tracking-widest border-b border-white/5">{d}</div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayEvents = day ? getEventsOnDay(day) : [];
                const isToday = day === now.getDate() && calendarMonth === now.getMonth() && calendarYear === now.getFullYear();
                return (
                  <div key={idx} className={`min-h-[80px] p-2 border-b border-r border-white/5 ${!day ? 'bg-white/[0.01]' : 'hover:bg-white/3'} transition-colors`}>
                    {day && (
                      <>
                        <div className={`text-sm font-black mb-1 w-7 h-7 flex items-center justify-center rounded-lg ${isToday ? 'text-black' : 'text-gray-400'}`}
                          style={isToday ? { background: db.settings.primaryColor } : {}}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(ev => (
                            <div key={ev.id} className="text-xs px-1.5 py-0.5 rounded font-bold truncate"
                              style={{ background: `${TYPE_COLORS[ev.type] ?? '#ff6b00'}22`, color: TYPE_COLORS[ev.type] ?? '#ff6b00' }}>
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-600">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto space-y-12">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4 flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  UPCOMING EVENTS ({upcoming.length})
                </h2>
                <div className="space-y-4">
                  {upcoming.map(ev => (
                    <div key={ev.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 hover:border-orange-500/30 transition-all duration-300 flex flex-col sm:flex-row gap-5 group">
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="text-2xl font-black" style={{ color: TYPE_COLORS[ev.type] ?? '#ff6b00' }}>
                          {new Date(ev.date).getDate()}
                        </div>
                        <div className="text-xs font-bold text-gray-600 uppercase">{MONTHS[new Date(ev.date).getMonth()]?.slice(0, 3)}</div>
                        {ev.time && <div className="text-xs text-gray-700 mt-1">{ev.time}</div>}
                      </div>
                      <div className="w-px bg-white/5 hidden sm:block" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-3 mb-2">
                          <h3 className="font-black text-white text-lg leading-tight">{ev.title}</h3>
                          <span className="px-2 py-1 rounded-lg text-xs font-black"
                            style={{ background: `${TYPE_COLORS[ev.type] ?? '#ff6b00'}22`, color: TYPE_COLORS[ev.type] ?? '#ff6b00' }}>
                            {TYPE_LABELS[ev.type] || ev.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          {ev.game && <span>🎮 {ev.game}</span>}
                          {ev.prizePool && <span>💰 {ev.prizePool}</span>}
                          {ev.slots ? <span>👥 {ev.slots} Slots</span> : null}
                          {ev.status && <span className="text-orange-400 font-bold uppercase">{ev.status}</span>}
                        </div>
                        {ev.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ev.description}</p>}
                      </div>
                      <div className="flex-shrink-0 self-center">
                        <a href={ev.type === 'tournament' ? '/tournaments' : ev.type === 'giveaway' ? '/giveaways' : '#'}
                          className="px-4 py-2 rounded-xl text-xs font-black uppercase border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors whitespace-nowrap">
                          DETAILS →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="font-black text-white text-xl mb-2">No upcoming events</h3>
                <p className="text-gray-500">Stay tuned — more events are being planned!</p>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-gray-600 tracking-widest uppercase mb-4 flex items-center gap-3">
                  <span className="w-2 h-2 bg-gray-600 rounded-full" />
                  PAST EVENTS ({past.length})
                </h2>
                <div className="space-y-3 opacity-60">
                  {past.slice(-5).reverse().map(ev => (
                    <div key={ev.id} className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 flex items-center gap-4">
                      <div className="text-sm text-gray-600 font-black w-12">{new Date(ev.date).getDate()} {MONTHS[new Date(ev.date).getMonth()]?.slice(0, 3)}</div>
                      <div className="flex-1 font-bold text-gray-500 text-sm">{ev.title}</div>
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg"
                        style={{ background: `${TYPE_COLORS[ev.type] ?? '#666'}22`, color: TYPE_COLORS[ev.type] ?? '#666' }}>
                        {ev.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-700 font-bold">ENDED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
