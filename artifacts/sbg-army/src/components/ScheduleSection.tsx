import { ScheduleEvent } from '@/lib/database';

interface Props {
  schedule: ScheduleEvent[];
}

const EVENT_COLORS: Record<string, string> = {
  practice: '#00d4ff',
  scrim: '#ffd700',
  tournament: '#ff6b00',
  bootcamp: '#9945ff',
};

const EVENT_ICONS: Record<string, string> = {
  practice: '🎯',
  scrim: '⚔️',
  tournament: '🏆',
  bootcamp: '🏕️',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Upcoming', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)' },
  ongoing: { label: 'LIVE', color: '#ff0000', bg: 'rgba(255,0,0,0.1)' },
  completed: { label: 'Completed', color: '#666', bg: 'rgba(100,100,100,0.1)' },
  practice: { label: 'Practice', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)' },
};

function EventCard({ ev }: { ev: ScheduleEvent }) {
  const sc = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.upcoming;
  const color = EVENT_COLORS[ev.eventType];
  return (
    <div className="p-5 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{EVENT_ICONS[ev.eventType]}</span>
          <span className="text-xs font-black px-2 py-1 rounded uppercase tracking-widest"
            style={{ background: color + '22', color }}>
            {ev.eventType}
          </span>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded animate-pulse"
          style={{ background: sc.bg, color: sc.color }}
          {...(ev.status === 'ongoing' ? {} : {})}>
          {sc.label}
        </span>
      </div>
      <h3 className="font-black text-white text-lg leading-tight">
        {ev.teamName}{ev.opponentName ? <span className="text-gray-500"> vs {ev.opponentName}</span> : ''}
      </h3>
      <p className="text-xs text-gray-500 mt-1">{ev.game}</p>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        <span className="text-xs text-gray-400 font-mono">📅 {ev.date}</span>
        <span className="text-xs text-gray-400 font-mono">⏰ {ev.time}</span>
      </div>
      {ev.notes && <p className="text-xs text-gray-600 mt-2 italic">{ev.notes}</p>}
    </div>
  );
}

export default function ScheduleSection({ schedule }: Props) {
  const now = new Date();
  const upcoming = schedule.filter(e => e.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const ongoing = schedule.filter(e => e.status === 'ongoing');
  const completed = schedule.filter(e => e.status === 'completed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  if (schedule.length === 0) return null;

  return (
    <section id="schedule" className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-black tracking-[0.4em] text-orange-400 mb-3 uppercase">Schedule</p>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            MATCH & <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>TRAINING</span>
          </h2>
          <p className="text-gray-500 mt-4">Stay updated on all upcoming sessions, scrims, and tournaments</p>
        </div>

        {ongoing.length > 0 && (
          <div className="mb-10">
            <h3 className="font-black text-lg text-red-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE NOW
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ongoing.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mb-10">
            <h3 className="font-black text-lg text-cyan-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> UPCOMING
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h3 className="font-black text-lg text-gray-500 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500" /> RECENT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {completed.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
