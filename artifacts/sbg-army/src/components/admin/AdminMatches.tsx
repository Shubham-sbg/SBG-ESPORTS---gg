import { useState } from 'react';
import { Match, Game, getDB, saveCollection } from '@/lib/database';

interface Props {
  matches: Match[];
  games: Game[];
  onRefresh: () => void;
}

const DEFAULT_MODES = ['BR', 'TDM', 'SCRIM', 'CUSTOM', 'TOURNAMENT', 'League', 'Qualifier', 'Finals', 'Showmatch', 'Practice'];
const DEFAULT_ROUNDS = ['Qualifier', 'Group Stage', 'Semi Final', 'Final', 'Grand Final', 'Round of 16', 'Quarter Final'];
const DEFAULT_STATUSES = ['upcoming', 'live', 'completed'];

const empty = (): Omit<Match, 'id'> => ({
  title: '', opponent: '', game: '', mode: '', round: '',
  date: new Date().toISOString().split('T')[0], time: '18:00', status: 'upcoming', score: '',
});

export default function AdminMatches({ matches, games, onRefresh }: Props) {
  const [editing, setEditing] = useState<Match | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const enabledGames = (games || []).filter(g => g.enabled).map(g => g.name);

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const db = getDB();
      if (adding) {
        db.matches.push({ ...form, id: `m${Date.now()}` });
      } else if (editing) {
        const idx = (db.matches || []).findIndex(m => m.id === editing.id);
        if (idx !== -1) db.matches[idx] = { ...editing, ...form };
      }
      await saveCollection('matches', db.matches);
      onRefresh();
      setAdding(false);
      setEditing(null);
      setForm(empty());
    } catch (e: any) {
      console.error('Match save error:', e);
      setSaveError(e.message || 'Failed to save match. Please check connection.');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    try {
      const db = getDB();
      db.matches = (db.matches || []).filter(m => m.id !== id);
      await saveCollection('matches', db.matches);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete match');
    }
  };

  const sorted = [...(matches || [])].sort((a, b) => {
    const order: Record<string, number> = { live: 0, upcoming: 1, completed: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(empty()); }} className="text-gray-400 hover:text-white">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Match' : 'Edit Match'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Match Title</label><input className="inp" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><label className="label">Opponent</label><input className="inp" value={form.opponent} onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))} /></div>
            <div>
              <label className="label">Game <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="match-games-list"
                value={form.game}
                onChange={e => setForm(f => ({ ...f, game: e.target.value }))}
                placeholder="e.g. BGMI, Free Fire..."
              />
              <datalist id="match-games-list">
                {enabledGames.map(g => <option key={g} value={g} />)}
                {['Free Fire', 'BGMI', 'PUBG KR', 'COD Mobile', 'Valorant', 'Apex Legends'].filter(g => !enabledGames.includes(g)).map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Mode <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="match-modes-list"
                value={form.mode}
                onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                placeholder="e.g. TOURNAMENT, League..."
              />
              <datalist id="match-modes-list">
                {DEFAULT_MODES.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Round <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="match-rounds-list"
                value={form.round}
                onChange={e => setForm(f => ({ ...f, round: e.target.value }))}
                placeholder="e.g. Qualifier, Final..."
              />
              <datalist id="match-rounds-list">
                {DEFAULT_ROUNDS.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div><label className="label">Date</label><input type="date" className="inp" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="label">Time</label><input type="time" className="inp" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
            <div>
              <label className="label">Status <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="match-status-list"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                placeholder="e.g. upcoming, live, completed..."
              />
              <datalist id="match-status-list">
                {DEFAULT_STATUSES.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div><label className="label">Score (optional)</label><input className="inp" value={form.score || ''} placeholder="e.g. 13-7" onChange={e => setForm(f => ({ ...f, score: e.target.value }))} /></div>
          </div>
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              ⚠️ {saveError}
            </div>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? '⏳ SAVING...' : adding ? 'ADD MATCH' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">Matches ({(matches || []).length})</h2>
        <button onClick={() => { setAdding(true); setForm(empty()); }}
          className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          + Add Match
        </button>
      </div>
      <div className="space-y-3">
        {sorted.map(m => (
          <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{m.title}</p>
              <p className="text-xs text-gray-500">vs {m.opponent} · {m.game} · {m.mode} · {m.date}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-sm flex-shrink-0 ${m.status === 'live' ? 'text-red-400 bg-red-400/20' : m.status === 'upcoming' ? 'text-cyan-400 bg-cyan-400/20' : 'text-gray-400 bg-gray-400/20'}`}>
              {m.status.toUpperCase()}
            </span>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => {
                setEditing(m);
                setForm({ title: m.title, opponent: m.opponent, game: m.game, mode: m.mode, round: m.round, date: m.date, time: m.time, status: m.status, score: m.score || '' });
              }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Edit</button>
              <button onClick={() => { if (confirm('Delete this match?')) del(m.id); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        ))}
        {(matches || []).length === 0 && <div className="text-center py-12 text-gray-600">No matches yet.</div>}
      </div>
    </div>
  );
}
