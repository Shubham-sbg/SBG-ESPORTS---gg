import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { TeamSeason } from '@/lib/database';

const GOLD = '#d4af37';

const EMPTY: Omit<TeamSeason, 'id' | 'createdAt'> = {
  season: '', year: new Date().getFullYear(), startDate: '', endDate: '',
  roster: [], coaches: [], managers: [],
  achievements: [], tournaments: [], sponsors: [],
  notes: '', visible: true, order: 0,
};

interface Props { onRefresh: () => void; }

export default function AdminTeamHistory({ onRefresh }: Props) {
  const db = getDB();
  const items: TeamSeason[] = db.teamSeasons ?? [];

  const [editing, setEditing] = useState<TeamSeason | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<TeamSeason, 'id' | 'createdAt'>>(EMPTY);
  const [achievementsText, setAchievementsText] = useState('');
  const [tournamentsText, setTournamentsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => b.year - a.year);

  const openNew = () => {
    setForm({ ...EMPTY, order: items.length });
    setAchievementsText('');
    setTournamentsText('');
    setIsNew(true);
    setEditing(null);
  };

  const openEdit = (s: TeamSeason) => {
    setForm({
      season: s.season, year: s.year, startDate: s.startDate, endDate: s.endDate ?? '',
      roster: s.roster, coaches: s.coaches ?? [], managers: s.managers ?? [],
      achievements: s.achievements ?? [], tournaments: s.tournaments ?? [],
      sponsors: s.sponsors ?? [], notes: s.notes ?? '',
      visible: s.visible, order: s.order,
    });
    setAchievementsText((s.achievements ?? []).join('\n'));
    setTournamentsText((s.tournaments ?? []).join('\n'));
    setEditing(s);
    setIsNew(false);
  };

  const closeForm = () => { setEditing(null); setIsNew(false); };
  const F = (k: string, v: string | boolean | number | string[]) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.season.trim()) return;
    setSaving(true);
    try {
      const cur = getDB();
      const list: TeamSeason[] = [...(cur.teamSeasons ?? [])];
      const merged = {
        ...form,
        achievements: achievementsText.split('\n').map(s => s.trim()).filter(Boolean),
        tournaments: tournamentsText.split('\n').map(s => s.trim()).filter(Boolean),
      };
      if (isNew) {
        list.push({ ...merged, id: `season_${Date.now()}`, createdAt: Date.now() });
      } else if (editing) {
        const i = list.findIndex(x => x.id === editing.id);
        if (i !== -1) list[i] = { ...editing, ...merged };
      }
      await saveDB({ ...cur, teamSeasons: list }, 'teamSeasons');
      setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000);
      closeForm(); onRefresh();
    } catch (e: any) {
      console.error('TeamHistory save error:', e);
      setSaveState('error'); setTimeout(() => setSaveState('idle'), 3000);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const cur = getDB();
    await saveDB({ ...cur, teamSeasons: (cur.teamSeasons ?? []).filter(x => x.id !== id) }, 'teamSeasons');
    setDeleting(null); onRefresh();
  };

  const toggleVisible = async (s: TeamSeason) => {
    const cur = getDB();
    await saveDB({ ...cur, teamSeasons: (cur.teamSeasons ?? []).map(x => x.id === s.id ? { ...x, visible: !x.visible } : x) }, 'teamSeasons');
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white tracking-widest">📅 TEAM HISTORY</h2>
          <p className="text-xs text-gray-500 mt-0.5">Season-by-season roster and performance history</p>
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'saved' && <span className="text-xs font-black text-green-400">✅ SAVED</span>}
          {saveState === 'error' && <span className="text-xs font-black text-red-400">❌ ERROR</span>}
          <button onClick={openNew} className="px-4 py-2 rounded-lg text-xs font-black text-black"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            + ADD SEASON
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[['Total Seasons', items.length, GOLD], ['Visible', items.filter(s => s.visible).length, '#10b981']].map(([l, v, c]) => (
          <div key={l as string} className="p-3 rounded-xl border border-white/8 bg-white/3 text-center">
            <div className="text-2xl font-black" style={{ color: c as string }}>{v as number}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{l as string}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {(isNew || editing) && (
        <div className="p-5 rounded-2xl border border-white/10 bg-white/3 space-y-4">
          <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">
            {isNew ? '➕ New Season' : `✏ Edit — ${editing?.season}`}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Season Name *</label>
              <input value={form.season} onChange={e => F('season', e.target.value)}
                placeholder="e.g. Season 1 — 2021"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40" />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Year</label>
              <input type="number" value={form.year} onChange={e => F('year', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40" />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => F('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40" />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>End Date</label>
              <input type="date" value={form.endDate as string} onChange={e => F('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Achievements (one per line)</label>
              <textarea value={achievementsText} onChange={e => setAchievementsText(e.target.value)}
                rows={4} placeholder="PMPL Champions&#10;Top Fragger Award&#10;Best Team Award"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Tournaments (one per line)</label>
              <textarea value={tournamentsText} onChange={e => setTournamentsText(e.target.value)}
                rows={4} placeholder="PMPL India&#10;ESL Open&#10;FF World Series"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none resize-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
              style={{ color: 'rgba(212,175,55,0.6)' }}>Notes</label>
            <textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2}
              placeholder="Additional notes about this season..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none resize-none" />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.visible} onChange={e => F('visible', e.target.checked)}
                className="w-4 h-4 accent-yellow-500" />
              Visible
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-black text-black disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
              {saving ? 'SAVING…' : isNew ? '+ CREATE' : '✓ SAVE'}
            </button>
            <button onClick={closeForm}
              className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-sm font-bold">No seasons yet</p>
            <p className="text-xs mt-1">Click "+ Add Season" to document team history</p>
          </div>
        )}
        {sorted.map(s => (
          <div key={s.id} className="p-5 rounded-2xl border transition-all"
            style={{
              borderColor: s.visible ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
              background: s.visible ? 'rgba(212,175,55,0.02)' : 'rgba(255,255,255,0.01)',
            }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-black text-white">{s.season}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(212,175,55,0.12)', color: GOLD }}>{s.year}</span>
                  {!s.visible && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-500">HIDDEN</span>}
                </div>
                {(s.startDate || s.endDate) && (
                  <p className="text-xs text-gray-500">{s.startDate}{s.endDate ? ` → ${s.endDate}` : ' → present'}</p>
                )}
                {s.achievements && s.achievements.length > 0 && (
                  <p className="text-xs text-green-400 mt-1">🏆 {s.achievements.slice(0, 3).join(' · ')}{s.achievements.length > 3 ? ` +${s.achievements.length - 3}` : ''}</p>
                )}
                {s.tournaments && s.tournaments.length > 0 && (
                  <p className="text-xs text-gray-600 mt-0.5">🎮 {s.tournaments.length} tournament{s.tournaments.length !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => toggleVisible(s)}
                  className="p-1.5 rounded-lg border border-white/8 text-xs transition-colors"
                  style={{ color: s.visible ? '#10b981' : '#6b7280' }}>
                  {s.visible ? '👁' : '👁‍🗨'}
                </button>
                <button onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg border border-white/8 text-xs text-gray-400 hover:text-white">✏</button>
                {deleting === s.id
                  ? <div className="flex gap-1">
                      <button onClick={() => handleDelete(s.id)} className="px-2 py-1 rounded-lg text-[10px] font-black text-white bg-red-500/80">DEL</button>
                      <button onClick={() => setDeleting(null)} className="px-2 py-1 rounded-lg text-[10px] text-gray-500 border border-white/10">No</button>
                    </div>
                  : <button onClick={() => setDeleting(s.id)} className="p-1.5 rounded-lg border border-red-500/20 text-red-400/50 hover:text-red-400 text-xs">🗑</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
