import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { TeamRecord } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

const GOLD = '#d4af37';

const CATEGORIES: TeamRecord['category'][] = [
  'Win Streak', 'MVPs', 'Kills', 'Matches', 'Fastest Victory', 'Prize Money', 'Best Finish', 'Custom',
];
const ICON_PRESETS = ['🏆','📊','⚡','🎯','💰','🥇','🔥','⭐','👑','🎮','📈','🏅'];
const GAMES = ['Free Fire', 'BGMI', 'Valorant', 'COD Mobile', 'All Games', 'Other'];

const EMPTY: Omit<TeamRecord, 'id' | 'createdAt'> = {
  category: 'Win Streak', title: '', value: '', numericValue: 0,
  unit: '', holder: '', date: '', game: '', tournamentName: '',
  description: '', icon: '🏆', isActive: true, visible: true, order: 0,
};

interface Props { onRefresh: () => void; }

export default function AdminTeamRecords({ onRefresh }: Props) {
  const db = getDB();
  const items: TeamRecord[] = db.teamRecords ?? [];

  const [editing, setEditing] = useState<TeamRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<TeamRecord, 'id' | 'createdAt'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const filtered = [...items]
    .filter(r => filterCat === 'all' || r.category === filterCat)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.value.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  const openNew = () => { setForm({ ...EMPTY, order: items.length }); setIsNew(true); setEditing(null); };
  const openEdit = (r: TeamRecord) => {
    setForm({
      category: r.category, title: r.title, value: r.value,
      numericValue: r.numericValue ?? 0, unit: r.unit ?? '',
      holder: r.holder ?? '', date: r.date ?? '', game: r.game ?? '',
      tournamentName: r.tournamentName ?? '', description: r.description ?? '',
      icon: r.icon, isActive: r.isActive, visible: r.visible, order: r.order,
    });
    setEditing(r); setIsNew(false);
  };
  const closeForm = () => { setEditing(null); setIsNew(false); };
  const F = (k: string, v: string | boolean | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.value.trim()) return;
    setSaving(true);
    try {
      const cur = getDB();
      const list: TeamRecord[] = [...(cur.teamRecords ?? [])];
      if (isNew) {
        list.push({ ...form, id: `rec_${Date.now()}`, createdAt: Date.now() });
      } else if (editing) {
        const i = list.findIndex(x => x.id === editing.id);
        if (i !== -1) list[i] = { ...editing, ...form };
      }
      await saveDB({ ...cur, teamRecords: list }, 'teamRecords');
      setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000);
      closeForm(); onRefresh();
    } catch (e: any) {
      console.error('TeamRecords save error:', e);
      setSaveState('error'); setTimeout(() => setSaveState('idle'), 3000);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const cur = getDB();
    await saveDB({ ...cur, teamRecords: (cur.teamRecords ?? []).filter(x => x.id !== id) }, 'teamRecords');
    setDeleting(null); onRefresh();
  };

  const toggleVisible = async (r: TeamRecord) => {
    const cur = getDB();
    await saveDB({ ...cur, teamRecords: (cur.teamRecords ?? []).map(x => x.id === r.id ? { ...x, visible: !x.visible } : x) });
    onRefresh();
  };

  const stats = {
    total: items.length,
    active: items.filter(r => r.isActive).length,
    visible: items.filter(r => r.visible).length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white tracking-widest">📊 TEAM RECORDS</h2>
          <p className="text-xs text-gray-500 mt-0.5">All-time records and statistics</p>
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'saved' && <span className="text-xs font-black text-green-400">✅ SAVED</span>}
          {saveState === 'error' && <span className="text-xs font-black text-red-400">❌ ERROR</span>}
          <button onClick={openNew} className="px-4 py-2 rounded-lg text-xs font-black text-black"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            + ADD RECORD
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[['Total', stats.total, GOLD], ['Active', stats.active, '#10b981'], ['Visible', stats.visible, '#60a5fa']].map(([l, v, c]) => (
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
            {isNew ? '➕ New Record' : `✏ Edit — ${editing?.title}`}
          </h3>
          {/* Icon picker */}
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-2"
              style={{ color: 'rgba(212,175,55,0.6)' }}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_PRESETS.map(ic => (
                <button key={ic} onClick={() => F('icon', ic)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all"
                  style={{ background: form.icon === ic ? `${GOLD}20` : 'rgba(255,255,255,0.05)', border: `2px solid ${form.icon === ic ? GOLD : 'rgba(255,255,255,0.08)'}` }}>
                  {ic}
                </button>
              ))}
              <input value={form.icon} onChange={e => F('icon', e.target.value)} maxLength={4}
                className="w-9 h-9 px-1 rounded-lg bg-white/5 border border-white/10 text-white text-center text-xl outline-none focus:border-gold/40" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Category</label>
              <Combobox value={form.category} onChange={e => F('category', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Combobox>
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Game</label>
              <Combobox value={form.game} onChange={e => F('game', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none">
                {['', ...GAMES].map(g => <option key={g} value={g}>{g || 'Select game'}</option>)}
              </Combobox>
            </div>
            {([
              ['title', 'Record Title', 'e.g. Longest Win Streak'],
              ['value', 'Display Value', 'e.g. 23 consecutive wins'],
              ['unit', 'Unit', 'e.g. wins, kills, USD'],
              ['numericValue', 'Numeric Value (for sort)', '23', 'number'],
              ['holder', 'Record Holder', 'Team or player name'],
              ['date', 'Date Set', null, 'date'],
              ['tournamentName', 'Tournament', 'Where record was set'],
            ] as [string, string, string | null, string?][]).map(([k, label, ph, type]) => (
              <div key={k}>
                <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                  style={{ color: 'rgba(212,175,55,0.6)' }}>{label}</label>
                <input type={type ?? 'text'} value={(form as any)[k]} onChange={e => F(k, type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={ph ?? ''}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
              style={{ color: 'rgba(212,175,55,0.6)' }}>Description</label>
            <textarea value={form.description} onChange={e => F('description', e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none resize-none" />
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            {[['Active Record', 'isActive'], ['Visible', 'visible']].map(([lbl, k]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any)[k]} onChange={e => F(k, e.target.checked)}
                  className="w-4 h-4 accent-yellow-500" />
                {lbl}
              </label>
            ))}
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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
          className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 outline-none focus:border-gold/40" />
        <Combobox value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 outline-none">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Combobox>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm font-bold">{search || filterCat !== 'all' ? 'No results' : 'No records yet'}</p>
            {!search && filterCat === 'all' && <p className="text-xs mt-1">Click "+ Add Record" to get started</p>}
          </div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
            style={{
              borderColor: r.visible ? (r.isActive ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.04)',
              background: r.visible ? (r.isActive ? 'rgba(212,175,55,0.03)' : 'rgba(255,255,255,0.02)') : 'rgba(255,255,255,0.01)',
            }}>
            <div className="text-2xl flex-shrink-0">{r.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">{r.title}</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.12)', color: GOLD }}>{r.category}</span>
                {r.isActive && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">ACTIVE</span>}
                {!r.visible && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-500">HIDDEN</span>}
              </div>
              <p className="text-sm font-black" style={{ color: GOLD }}>{r.value}</p>
              <p className="text-xs text-gray-600">
                {r.holder && `${r.holder}`}{r.game && ` · ${r.game}`}{r.date && ` · ${r.date}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => toggleVisible(r)}
                className="p-1.5 rounded-lg border border-white/8 text-xs transition-colors"
                style={{ color: r.visible ? '#10b981' : '#6b7280' }}
                title={r.visible ? 'Visible' : 'Hidden'}>
                {r.visible ? '👁' : '👁‍🗨'}
              </button>
              <button onClick={() => openEdit(r)}
                className="p-1.5 rounded-lg border border-white/8 text-xs text-gray-400 hover:text-white">✏</button>
              {deleting === r.id
                ? <div className="flex gap-1">
                    <button onClick={() => handleDelete(r.id)} className="px-2 py-1 rounded-lg text-[10px] font-black text-white bg-red-500/80">DEL</button>
                    <button onClick={() => setDeleting(null)} className="px-2 py-1 rounded-lg text-[10px] text-gray-500 border border-white/10">No</button>
                  </div>
                : <button onClick={() => setDeleting(r.id)} className="p-1.5 rounded-lg border border-red-500/20 text-red-400/50 hover:text-red-400 text-xs">🗑</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
