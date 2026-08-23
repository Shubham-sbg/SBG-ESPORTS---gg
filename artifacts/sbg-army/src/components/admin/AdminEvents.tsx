/**
 * AdminEvents — full CRUD for weeklyEvents (schedule/events page data)
 * Uses the existing WeeklyEvent interface from database.ts
 */
import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { getDB, saveDB } from '@/lib/database';
import type { WeeklyEvent } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

const GOLD = '#d4af37';

const EVENT_TYPES: WeeklyEvent['eventType'][] = ['match','practice','scrim','tournament','community','training','other'];
const MATCH_TYPES: WeeklyEvent['matchType'][] = ['solo','duo','squad','tdm','5v5','custom','open','invitational'];
const STATUSES: WeeklyEvent['status'][] = ['upcoming','live','completed','cancelled','postponed'];

const STATUS_COLOR: Record<WeeklyEvent['status'], string> = {
  upcoming:  '#3b82f6',
  live:      '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
  postponed: '#f59e0b',
};

const EMPTY: Omit<WeeklyEvent,'id'|'createdAt'|'order'> = {
  title: '', game: '', gameLogo: '', banner: '', tournamentName: '',
  eventType: 'match', matchType: 'squad',
  date: '', time: '18:00', duration: 60, venue: 'Online',
  streamUrl: '', ticketUrl: '', registerUrl: '',
  status: 'upcoming', opponent: '', notes: '',
  visible: true,
};

export default function AdminEvents({ onRefresh }: { onRefresh: () => void }) {
  const { db } = useDatabase();
  const events: WeeklyEvent[] = (db as any).weeklyEvents ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WeeklyEvent | null>(null);
  const [draft, setDraft] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [filter, setFilter] = useState<'all'|WeeklyEvent['status']>('all');
  const [search, setSearch] = useState('');

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const openNew = () => { setEditing(null); setDraft({ ...EMPTY }); setShowForm(true); };
  const openEdit = (e: WeeklyEvent) => {
    setEditing(e);
    const { id: _id, createdAt: _c, order: _o, ...rest } = e;
    setDraft(rest as typeof EMPTY);
    setShowForm(true);
  };
  const cancel = () => { setEditing(null); setShowForm(false); setSaveError(''); };

  const commit = async (next: WeeklyEvent[]) => {
    const d = getDB();
    (d as any).weeklyEvents = next;
    try {
      await saveDB(d, 'weeklyEvents');
      onRefresh();
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
      } else {
        throw e;
      }
    }
  };

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.date.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const now = Date.now();
      let next: WeeklyEvent[];
      if (editing) {
        next = events.map(e => e.id === editing.id ? { ...editing, ...draft } : e);
      } else {
        const maxOrder = events.reduce((m, e) => Math.max(m, e.order ?? 0), 0);
        next = [...events, { id: `ev_${now}`, ...draft, createdAt: now, order: maxOrder + 1 }];
      }
      await commit(next);
      cancel();
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error('Events save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        cancel();
        setSaved(true); setTimeout(() => setSaved(false), 2000);
      } else {
        setSaveError(msg || 'Failed to save event. Check connection.');
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await commit(events.filter(e => e.id !== id));
  };

  const handleToggle = async (id: string) => {
    await commit(events.map(e => e.id === id ? { ...e, visible: !e.visible } : e));
  };

  const filtered = events
    .filter(e => filter === 'all' || e.status === filter)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.game.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const Input = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 transition-all" />
    </div>
  );

  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
    <div>
      <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">{label}</label>
      <Combobox value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[#111] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 transition-all">
        {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </Combobox>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-2">🗓️ EVENTS MANAGER</h2>
          <p className="text-xs text-gray-500 mt-1">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 w-40" />
          {saved && <span className="text-xs font-black text-green-400">✓ Saved</span>}
          <button onClick={openNew}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            + Add Event
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all"
            style={filter === s
              ? { background: s === 'all' ? GOLD : STATUS_COLOR[s as WeeklyEvent['status']], color: '#000' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-gold/20 bg-white/2 p-6 space-y-4">
          <h3 className="font-black text-white text-sm tracking-widest">{editing ? 'EDIT EVENT' : 'NEW EVENT'}</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Title *" value={draft.title} onChange={v => set('title', v)} placeholder="e.g. BGMI Scrimmage vs TeamX" />
            <Input label="Tournament / Series Name" value={draft.tournamentName} onChange={v => set('tournamentName', v)} placeholder="SBG Open Cup" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Game *" value={draft.game} onChange={v => set('game', v)} placeholder="BGMI" />
            <Input label="Date *" type="date" value={draft.date} onChange={v => set('date', v)} />
            <Input label="Time" type="time" value={draft.time} onChange={v => set('time', v)} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Select label="Event Type" value={draft.eventType} onChange={v => set('eventType', v as any)} options={EVENT_TYPES} />
            <Select label="Match Type" value={draft.matchType} onChange={v => set('matchType', v as any)} options={MATCH_TYPES} />
            <Select label="Status" value={draft.status} onChange={v => set('status', v as any)} options={STATUSES} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Opponent (optional)" value={draft.opponent ?? ''} onChange={v => set('opponent', v)} placeholder="Team Name" />
            <Input label="Venue" value={draft.venue ?? ''} onChange={v => set('venue', v)} placeholder="Online / City" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Stream URL" value={draft.streamUrl ?? ''} onChange={v => set('streamUrl', v)} placeholder="https://youtube.com/…" />
            <Input label="Register URL" value={draft.registerUrl ?? ''} onChange={v => set('registerUrl', v)} placeholder="https://…" />
            <Input label="Duration (min)" value={String(draft.duration ?? '')} onChange={v => set('duration', Number(v))} type="number" />
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">Notes</label>
            <textarea value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Internal notes…"
              className="w-full px-3 py-2.5 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 resize-none" />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => set('visible', !draft.visible)}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${draft.visible ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${draft.visible ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-gray-400 font-bold">Visible on site</span>
            </label>
            <div className="flex gap-2">
              <button onClick={cancel} className="px-4 py-2 rounded-xl text-xs font-black text-gray-400 border border-white/10 hover:border-white/25">Cancel</button>
              <button onClick={handleSave} disabled={saving || !draft.title.trim() || !draft.date.trim()}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black disabled:opacity-50 hover:scale-105 transition-all"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/1">
          <div className="text-4xl mb-3">🗓️</div>
          <p className="text-gray-500 text-sm mb-4">{search || filter !== 'all' ? 'No events match filters.' : 'No events yet.'}</p>
          {!showForm && (
            <button onClick={openNew} className="px-5 py-2 rounded-xl text-xs font-black text-black uppercase tracking-widest"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>Add Your First Event</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => (
            <div key={ev.id} className="flex items-start gap-4 p-4 rounded-xl border transition-all"
              style={{ background: ev.visible ? 'rgba(212,175,55,0.03)' : 'rgba(255,255,255,0.015)', borderColor: ev.visible ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)' }}>
              {/* Toggle */}
              <button onClick={() => handleToggle(ev.id)} title="Toggle visibility"
                className={`flex-shrink-0 mt-1 relative w-9 h-5 rounded-full transition-all duration-200 ${ev.visible ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${ev.visible ? 'left-4' : 'left-0.5'}`} />
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm truncate">{ev.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                    style={{ background: `${STATUS_COLOR[ev.status]}22`, color: STATUS_COLOR[ev.status], border: `1px solid ${STATUS_COLOR[ev.status]}44` }}>
                    {ev.status}
                  </span>
                  {!ev.visible && <span className="text-[10px] text-gray-600 uppercase tracking-wider">HIDDEN</span>}
                </div>
                <p className="text-xs text-gray-500">
                  {ev.game} · {ev.eventType} · {ev.date} {ev.time}
                  {ev.venue ? ` · ${ev.venue}` : ''}
                  {ev.opponent ? ` · vs ${ev.opponent}` : ''}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(ev)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition-all">Edit</button>
                <button onClick={() => handleDelete(ev.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
