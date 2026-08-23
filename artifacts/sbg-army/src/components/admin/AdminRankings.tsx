/**
 * AdminRankings — full CRUD for player leaderboard entries.
 * Stores data in the `leaderboard` collection (array of LeaderboardEntry).
 */
import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

const GOLD = '#d4af37';

interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  ign: string;
  game: string;
  season: string;
  kills: number;
  wins: number;
  matches: number;
  kd: number;
  score: number;
  avatar?: string;
  visible: boolean;
  createdAt: number;
}

const EMPTY: Omit<LeaderboardEntry, 'id' | 'createdAt'> = {
  rank: 1, playerName: '', ign: '', game: 'BGMI', season: 'Season 1',
  kills: 0, wins: 0, matches: 0, kd: 0, score: 0,
  avatar: '', visible: true,
};

const GAMES = ['BGMI', 'Free Fire', 'Valorant', 'COD Mobile', 'FIFA', 'PUBG PC', 'Other'];

function calc(kills: number, wins: number, matches: number): { kd: number; score: number } {
  const deaths = Math.max(matches - wins, 1);
  const kd = parseFloat((kills / deaths).toFixed(2));
  const score = kills * 2 + wins * 10;
  return { kd, score };
}

export default function AdminRankings({ onRefresh }: { onRefresh: () => void }) {
  const { db } = useDatabase();
  const entries: LeaderboardEntry[] = (db as any).leaderboard ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaderboardEntry | null>(null);
  const [draft, setDraft] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filterGame, setFilterGame] = useState('all');
  const [search, setSearch] = useState('');

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const openNew = () => {
    const maxRank = entries.reduce((m, e) => Math.max(m, e.rank), 0);
    setEditing(null);
    setDraft({ ...EMPTY, rank: maxRank + 1 });
    setShowForm(true);
  };
  const openEdit = (e: LeaderboardEntry) => {
    setEditing(e);
    const { id: _i, createdAt: _c, ...rest } = e;
    setDraft(rest);
    setShowForm(true);
  };
  const cancel = () => { setEditing(null); setShowForm(false); };

  const commit = async (next: LeaderboardEntry[]) => {
    const d = getDB(); (d as any).leaderboard = next; await saveDB(d); onRefresh();
  };

  const handleSave = async () => {
    if (!draft.playerName.trim()) return;
    setSaving(true);
    try {
      const { kd, score } = calc(draft.kills, draft.wins, draft.matches);
      const now = Date.now();
      let next: LeaderboardEntry[];
      if (editing) {
        next = entries.map(e => e.id === editing.id ? { ...editing, ...draft, kd, score } : e);
      } else {
        next = [...entries, { id: `lb_${now}`, ...draft, kd, score, createdAt: now }];
      }
      // Re-number ranks after save
      next = next
        .sort((a, b) => b.score - a.score)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      await commit(next);
      cancel();
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const next = entries.filter(e => e.id !== id)
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    await commit(next);
  };

  const handleToggle = async (id: string) => {
    await commit(entries.map(e => e.id === id ? { ...e, visible: !e.visible } : e));
  };

  const games = ['all', ...Array.from(new Set(entries.map(e => e.game).filter(Boolean)))];
  const filtered = entries
    .filter(e => filterGame === 'all' || e.game === filterGame)
    .filter(e => !search || e.playerName.toLowerCase().includes(search.toLowerCase()) || e.ign.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.rank - b.rank);

  const seasons = Array.from(new Set(entries.map(e => e.season).filter(Boolean)));

  const Input = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 transition-all" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-2">📊 RANKINGS MANAGER</h2>
          <p className="text-xs text-gray-500 mt-1">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} · Scores auto-calculated (kills×2 + wins×10)</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player…"
            className="px-3 py-2 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40 w-36" />
          {saved && <span className="text-xs font-black text-green-400">✓ Saved</span>}
          <button onClick={openNew}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            + Add Entry
          </button>
        </div>
      </div>

      {/* Game filter */}
      {games.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {games.map(g => (
            <button key={g} onClick={() => setFilterGame(g)}
              className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all"
              style={filterGame === g
                ? { background: GOLD, color: '#000' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-gold/20 bg-white/2 p-6 space-y-4">
          <h3 className="font-black text-white text-sm tracking-widest">{editing ? 'EDIT ENTRY' : 'NEW ENTRY'}</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Player Name *" value={draft.playerName} onChange={v => set('playerName', v)} placeholder="Full Name" />
            <Input label="IGN (In-Game Name)" value={draft.ign} onChange={v => set('ign', v)} placeholder="GameTag#123" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">Game</label>
              <Combobox value={draft.game} onChange={e => set('game', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40">
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </Combobox>
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-gold/60">Season</label>
              <input list="seasons-list" value={draft.season} onChange={e => set('season', e.target.value)} placeholder="Season 1"
                className="w-full px-3 py-2.5 bg-white/4 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40" />
              <datalist id="seasons-list">{seasons.map(s => <option key={s} value={s} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Kills" type="number" value={draft.kills} onChange={v => set('kills', Number(v))} />
            <Input label="Wins" type="number" value={draft.wins} onChange={v => set('wins', Number(v))} />
            <Input label="Matches Played" type="number" value={draft.matches} onChange={v => set('matches', Number(v))} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Auto-calculated preview</p>
            <div className="flex gap-4">
              <span className="text-sm text-white font-bold">KD: <span className="text-gold">{calc(draft.kills, draft.wins, Math.max(draft.matches,1)).kd}</span></span>
              <span className="text-sm text-white font-bold">Score: <span className="text-gold">{calc(draft.kills, draft.wins, draft.matches).score}</span></span>
            </div>
          </div>
          <Input label="Avatar URL (optional)" value={draft.avatar ?? ''} onChange={v => set('avatar', v)} placeholder="https://…" />

          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => set('visible', !draft.visible)}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${draft.visible ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${draft.visible ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-gray-400 font-bold">Visible on leaderboard</span>
            </label>
            <div className="flex gap-2">
              <button onClick={cancel} className="px-4 py-2 rounded-xl text-xs font-black text-gray-400 border border-white/10 hover:border-white/25">Cancel</button>
              <button onClick={handleSave} disabled={saving || !draft.playerName.trim()}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black disabled:opacity-50 hover:scale-105 transition-all"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/1">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500 text-sm mb-4">{search || filterGame !== 'all' ? 'No entries match filters.' : 'No leaderboard entries yet.'}</p>
          {!showForm && (
            <button onClick={openNew} className="px-5 py-2 rounded-xl text-xs font-black text-black uppercase tracking-widest"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>Add First Entry</button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8" style={{ background: 'rgba(212,175,55,0.06)' }}>
                {['#','Player','IGN','Game','Season','Kills','Wins','KD','Score','Visible',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} className={`border-b border-white/5 transition-colors hover:bg-white/3 ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                  <td className="px-4 py-3 font-black" style={{ color: e.rank <= 3 ? GOLD : 'rgba(255,255,255,0.5)' }}>
                    {e.rank <= 3 ? ['🥇','🥈','🥉'][e.rank-1] : `#${e.rank}`}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{e.playerName}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{e.ign || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{e.game}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.season}</td>
                  <td className="px-4 py-3 text-white font-bold">{e.kills}</td>
                  <td className="px-4 py-3 text-white font-bold">{e.wins}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: GOLD }}>{e.kd}</td>
                  <td className="px-4 py-3 font-black" style={{ color: GOLD }}>{e.score}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(e.id)}
                      className={`relative w-9 h-5 rounded-full transition-all duration-200 ${e.visible ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${e.visible ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(e)} className="px-2 py-1 rounded text-[10px] font-bold border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition-all">Edit</button>
                      <button onClick={() => handleDelete(e.id)} className="px-2 py-1 rounded text-[10px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
