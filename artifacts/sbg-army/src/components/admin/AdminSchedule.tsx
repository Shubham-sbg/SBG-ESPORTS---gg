import { useState } from 'react';
import { ScheduleEvent, getDB, saveCollection } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

interface Props {
  schedule: ScheduleEvent[];
  games: { id: string; name: string; enabled: boolean }[];
  onRefresh: () => void;
}

const DEFAULT_EVENT_TYPES = ['practice', 'scrim', 'tournament', 'bootcamp', 'showmatch', 'qualifier', 'finals'];
const DEFAULT_STATUS_OPTS = ['upcoming', 'ongoing', 'completed', 'practice', 'cancelled'];

const EVENT_COLORS: Record<string, string> = {
  practice: '#00d4ff',
  scrim: '#ffd700',
  tournament: '#ff6b00',
  bootcamp: '#9945ff',
  showmatch: '#ff0088',
  qualifier: '#00ff88',
  finals: '#ff3300',
};

const empty = (): Omit<ScheduleEvent, 'id'> => ({
  eventType: '',
  teamName: ADMIN_BRAND_NAME,
  opponentName: '',
  game: '',
  date: '',
  time: '',
  status: 'upcoming',
  notes: '',
});

export default function AdminSchedule({ schedule, games, onRefresh }: Props) {
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty());
  const [filter, setFilter] = useState<string>('all');

  const enabledGames = (games || []).filter(g => g.enabled).map(g => g.name);

  const save = () => {
    const db = getDB();
    if (adding) {
      db.schedule = db.schedule ?? [];
      db.schedule.push({ ...form, id: `sc${Date.now()}` });
    } else if (editing) {
      const idx = (db.schedule || []).findIndex(e => e.id === editing.id);
      if (idx !== -1) db.schedule[idx] = { ...editing, ...form };
    }
    saveCollection('schedule', db.schedule);
    onRefresh();
    setAdding(false);
    setEditing(null);
    setForm(empty());
  };

  const del = (id: string) => {
    const db = getDB();
    db.schedule = (db.schedule || []).filter(e => e.id !== id);
    saveCollection('schedule', db.schedule);
    onRefresh();
  };

  const setStatus = (id: string, status: string) => {
    const db = getDB();
    const e = (db.schedule || []).find(e => e.id === id);
    if (e) e.status = status;
    saveCollection('schedule', db.schedule);
    onRefresh();
  };

  const sorted = [...(schedule ?? [])].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  const filtered = filter === 'all' ? sorted : sorted.filter(e => e.status === filter);

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(empty()); }} className="text-gray-400 hover:text-white">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Schedule Event' : 'Edit Event'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Event Type <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="schedule-event-types"
                value={form.eventType}
                onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                placeholder="e.g. practice, scrim, finals..."
              />
              <datalist id="schedule-event-types">
                {DEFAULT_EVENT_TYPES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Game <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="schedule-games-list"
                value={form.game}
                onChange={e => setForm(f => ({ ...f, game: e.target.value }))}
                placeholder="e.g. BGMI, Free Fire..."
              />
              <datalist id="schedule-games-list">
                {enabledGames.map(g => <option key={g} value={g} />)}
                {['Free Fire', 'BGMI', 'PUBG KR', 'COD Mobile', 'Valorant', 'Apex Legends'].filter(g => !enabledGames.includes(g)).map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Team Name</label>
              <input className="inp" value={form.teamName} onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Opponent (leave empty for practice)</label>
              <input className="inp" placeholder="e.g. Team Thunder" value={form.opponentName} onChange={e => setForm(f => ({ ...f, opponentName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="inp" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="inp" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="schedule-status-list"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                placeholder="e.g. upcoming, completed..."
              />
              <datalist id="schedule-status-list">
                {DEFAULT_STATUS_OPTS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="inp min-h-[80px] resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. BO3 format, 5 rounds..." />
          </div>
          <button onClick={save} className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400">
            {adding ? 'ADD EVENT' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="font-black text-xl text-white">Schedule ({(schedule ?? []).length})</h2>
        <button onClick={() => { setAdding(true); setForm(empty()); }} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          + Add Event
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'upcoming', 'ongoing', 'completed', 'practice', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(ev => {
          const evColor = EVENT_COLORS[ev.eventType] ?? '#888888';
          return (
            <div key={ev.id} className="p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: evColor }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded" style={{ background: evColor + '22', color: evColor }}>
                        {ev.eventType}
                      </span>
                      <span className="font-bold text-white">{ev.teamName}{ev.opponentName ? ` vs ${ev.opponentName}` : ''}</span>
                      <span className="text-xs text-gray-500">{ev.game}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{ev.date} at {ev.time}{ev.notes && <span className="ml-2 text-gray-600">· {ev.notes}</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Combobox value={ev.status}
                    onChange={e => setStatus(ev.id, e.target.value)}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-300 cursor-pointer">
                    {DEFAULT_STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    {!DEFAULT_STATUS_OPTS.includes(ev.status) && <option value={ev.status}>{ev.status}</option>}
                  </Combobox>
                  <button onClick={() => {
                    setEditing(ev);
                    setForm({ eventType: ev.eventType, teamName: ev.teamName, opponentName: ev.opponentName, game: ev.game, date: ev.date, time: ev.time, status: ev.status, notes: ev.notes });
                  }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Edit</button>
                  <button onClick={() => { if (confirm('Delete this event?')) del(ev.id); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No events. Add one!</div>}
      </div>
    </div>
  );
}
