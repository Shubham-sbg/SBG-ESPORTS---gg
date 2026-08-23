import { useEffect, useState } from 'react';
import { getTournaments, saveTournaments } from '@/lib/api';
import type { Tournament, TournamentFormat, TournamentStatus, GameMode, Prize } from '@/lib/types';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

const RED  = '#e8192c';
const GOLD = '#d4af37';
const GAMES = ['BGMI', 'Free Fire', 'Valorant', 'COD Mobile', 'PUBG PC', 'Fortnite', 'CS2', 'Other'];
const FORMATS: { v: TournamentFormat; l: string }[] = [
  { v: 'single_elimination', l: 'KO / Single Elimination' },
  { v: 'double_elimination', l: 'Double Elimination' },
  { v: 'round_robin',        l: 'Round Robin' },
];
const STATUSES: TournamentStatus[] = ['draft', 'registration', 'ongoing', 'completed', 'cancelled'];
const MODES: GameMode[] = ['solo', 'duo', 'trio', 'squad'];
const INPUT = "w-full px-3 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none focus:border-red-500/40 transition-all placeholder-gray-700";
const SELECT = `${INPUT} cursor-pointer`;

const EMPTY: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '', subtitle: '', game: 'BGMI', gameMode: 'squad', format: 'single_elimination',
  status: 'draft', banner: '', startDate: '', endDate: '', registrationDeadline: '',
  maxTeams: 16, entryFee: 0, prizePool: '₹0', prizes: [
    { rank: 1, label: '🥇 1st Place', amount: '', highlight: true },
    { rank: 2, label: '🥈 2nd Place', amount: '' },
    { rank: 3, label: '🥉 3rd Place', amount: '' },
  ],
  rules: [''], description: '', contactWhatsApp: '', streamUrl: '', featured: false,
};

function PrizeRow({ prize, onChange, onRemove }: { prize: Prize; onChange: (p: Prize) => void; onRemove: () => void }) {
  return (
    <div className="flex gap-2 items-center">
      <input value={prize.label} onChange={e => onChange({ ...prize, label: e.target.value })} placeholder="Label" className={`${INPUT} flex-1`} />
      <input value={prize.amount} onChange={e => onChange({ ...prize, amount: e.target.value })} placeholder="Amount" className={`${INPUT} w-28`} />
      <button type="button" onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
    </div>
  );
}

export default function AdminTournaments() {
  const [list, setList] = useState<Tournament[]>([]);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getTournaments().then(setList); }, []);

  const set = <K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) => setForm(f => ({ ...f, [k]: v }));

  const openNew  = () => { setEditing(null); setForm({ ...EMPTY, prizes: EMPTY.prizes.map(p => ({ ...p })) }); setShowForm(true); };
  const openEdit = (t: Tournament) => { setEditing(t); setForm({ ...EMPTY, ...t }); setShowForm(true); };
  const cancel   = () => { setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    const now = Date.now();
    let next: Tournament[];
    if (editing) {
      next = list.map(t => t.id === editing.id ? { ...t, ...form, updatedAt: now } : t);
    } else {
      next = [...list, { ...form, id: `tnmt_${now}`, createdAt: now, updatedAt: now }];
    }
    await saveTournaments(next);
    setList(next);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    cancel();
    setBusy(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tournament?')) return;
    const next = list.filter(t => t.id !== id);
    await saveTournaments(next);
    setList(next);
  };

  const handleStatus = async (id: string, status: TournamentStatus) => {
    const next = list.map(t => t.id === id ? { ...t, status, updatedAt: Date.now() } : t);
    await saveTournaments(next);
    setList(next);
  };

  const STATUS_COLOR: Record<string, string> = { draft: '#6b7280', registration: '#10b981', ongoing: RED, completed: GOLD, cancelled: '#ef4444' };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Tournaments</h2>
          <p className="text-xs text-gray-500 mt-1">Create and manage all tournaments</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-black"
          style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>
          <Plus size={15} /> New Tournament
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-6 space-y-6" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${RED}30` }}>
          <h3 className="font-black text-white uppercase tracking-widest text-sm">
            {editing ? 'Edit Tournament' : 'New Tournament'}
          </h3>

          {/* Basic info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Tournament Name" className={INPUT} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Subtitle</label>
              <input value={form.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Season 1 · Grand Finals" className={INPUT} />
            </div>
            <div>
              <label className="label">Game</label>
              <select value={form.game} onChange={e => set('game', e.target.value)} className={SELECT}>
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Game Mode</label>
              <select value={form.gameMode} onChange={e => set('gameMode', e.target.value as GameMode)} className={SELECT}>
                {MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Format</label>
              <select value={form.format} onChange={e => set('format', e.target.value as TournamentFormat)} className={SELECT}>
                {FORMATS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as TournamentStatus)} className={SELECT}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="label">Registration Deadline</label>
              <input type="date" value={form.registrationDeadline} onChange={e => set('registrationDeadline', e.target.value)} className={INPUT} />
            </div>
          </div>

          {/* Teams & entry */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Max Teams</label>
              <input type="number" value={form.maxTeams} onChange={e => set('maxTeams', Number(e.target.value))} className={INPUT} />
            </div>
            <div>
              <label className="label">Entry Fee (₹, 0=free)</label>
              <input type="number" value={form.entryFee} onChange={e => set('entryFee', Number(e.target.value))} className={INPUT} />
            </div>
            <div>
              <label className="label">Prize Pool Display</label>
              <input value={form.prizePool} onChange={e => set('prizePool', e.target.value)} placeholder="₹50,000" className={INPUT} />
            </div>
          </div>

          {/* Prizes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label">Prizes</label>
              <button type="button" onClick={() => set('prizes', [...form.prizes, { rank: form.prizes.length + 1, label: `#${form.prizes.length + 1}`, amount: '' }])}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"><Plus size={12} /> Add</button>
            </div>
            <div className="space-y-2">
              {form.prizes.map((p, i) => (
                <PrizeRow key={i} prize={p}
                  onChange={np => set('prizes', form.prizes.map((x, xi) => xi === i ? np : x))}
                  onRemove={() => set('prizes', form.prizes.filter((_, xi) => xi !== i))} />
              ))}
            </div>
          </div>

          {/* Rules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label">Rules (one per line)</label>
            </div>
            <textarea value={form.rules.join('\n')} onChange={e => set('rules', e.target.value.split('\n'))} rows={5}
              placeholder="1. No teaming\n2. Use of hacks is banned\n3. Screenshot evidence required" className={`${INPUT} resize-y font-mono text-xs`} />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe this tournament…" className={`${INPUT} resize-y`} />
          </div>

          {/* Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Banner Image URL</label>
              <input value={form.banner ?? ''} onChange={e => set('banner', e.target.value)} placeholder="https://…" className={INPUT} />
            </div>
            <div>
              <label className="label">WhatsApp Contact</label>
              <input value={form.contactWhatsApp ?? ''} onChange={e => set('contactWhatsApp', e.target.value)} placeholder="+91XXXXXXXXXX" className={INPUT} />
            </div>
            <div>
              <label className="label">Live Stream URL</label>
              <input value={form.streamUrl ?? ''} onChange={e => set('streamUrl', e.target.value)} placeholder="https://youtube.com/live/…" className={INPUT} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button type="button" onClick={() => set('featured', !form.featured)}
                className={`relative w-11 h-6 rounded-full transition-all ${form.featured ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.featured ? 'left-6' : 'left-1'}`} />
              </button>
              <span className="text-sm text-gray-400 font-bold">Featured</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={cancel} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 border border-white/10 hover:border-white/25 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-[1.01] disabled:opacity-50"
              style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${RED}, #b00020)` }}>
              {busy ? 'Saving…' : saved ? '✓ Saved' : editing ? 'Save Changes' : 'Create Tournament'}
            </button>
          </div>
        </div>
      )}

      {/* Tournament list */}
      {list.length === 0 && !showForm ? (
        <div className="text-center py-20 border border-white/5 rounded-2xl">
          <p className="text-gray-500">No tournaments yet.</p>
          <button onClick={openNew} className="mt-4 px-5 py-2 rounded-xl text-sm font-black text-white"
            style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>Create First Tournament</button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(t => (
            <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/[0.01]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white truncate">{t.title}</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={{ color: STATUS_COLOR[t.status] ?? '#6b7280', background: `${STATUS_COLOR[t.status] ?? '#6b7280'}18` }}>
                    {t.status}
                  </span>
                  {t.featured && <span className="text-[10px] text-yellow-500">⭐</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t.game} · {t.gameMode} · {t.format.replace('_', ' ')} · {t.prizePool}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                <select value={t.status} onChange={e => handleStatus(t.id, e.target.value as TournamentStatus)}
                  className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300 outline-none cursor-pointer">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => openEdit(t)} className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`.label { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 6px; }`}</style>
    </div>
  );
}
