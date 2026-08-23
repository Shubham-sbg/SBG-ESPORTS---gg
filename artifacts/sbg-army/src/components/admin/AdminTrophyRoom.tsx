import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { Trophy } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

const GOLD = '#d4af37';
const GAMES = ['Free Fire', 'BGMI', 'Valorant', 'COD Mobile', 'Clash Squad', 'Other'];
const PLACES = ['1st', '2nd', '3rd', 'Top 4', 'Top 8', 'Top 16', 'Participant'];

const EMPTY: Omit<Trophy, 'id' | 'createdAt'> = {
  title: '', tournamentName: '', game: '', placement: '1st', prizePool: '',
  date: '', mvp: '', description: '', featured: false, visible: true, order: 0,
};

interface Props { onRefresh: () => void; }

export default function AdminTrophyRoom({ onRefresh }: Props) {
  const db = getDB();
  const items: Trophy[] = db.trophies ?? [];

  const [editing, setEditing] = useState<Trophy | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<Trophy, 'id' | 'createdAt'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const sorted = [...items]
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.tournamentName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));

  const openNew = () => { setForm({ ...EMPTY, order: items.length }); setIsNew(true); setEditing(null); };
  const openEdit = (t: Trophy) => {
    setForm({ title: t.title, tournamentName: t.tournamentName, game: t.game, placement: t.placement,
      prizePool: t.prizePool ?? '', date: t.date, mvp: t.mvp ?? '',
      description: t.description ?? '', featured: t.featured, visible: t.visible, order: t.order });
    setEditing(t); setIsNew(false);
  };
  const closeForm = () => { setEditing(null); setIsNew(false); };
  const F = (k: string, v: string | boolean | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.tournamentName.trim()) return;
    setSaving(true);
    try {
      const cur = getDB();
      const list: Trophy[] = [...(cur.trophies ?? [])];
      if (isNew) {
        list.push({ ...form, id: `trophy_${Date.now()}`, createdAt: Date.now() });
      } else if (editing) {
        const i = list.findIndex(x => x.id === editing.id);
        if (i !== -1) list[i] = { ...editing, ...form };
      }
      await saveDB({ ...cur, trophies: list });
      setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000);
      closeForm(); onRefresh();
    } catch {
      setSaveState('error'); setTimeout(() => setSaveState('idle'), 2000);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const cur = getDB();
    await saveDB({ ...cur, trophies: (cur.trophies ?? []).filter(x => x.id !== id) });
    setDeleting(null); onRefresh();
  };

  const toggleVisible = async (t: Trophy) => {
    const cur = getDB();
    await saveDB({ ...cur, trophies: (cur.trophies ?? []).map(x => x.id === t.id ? { ...x, visible: !x.visible } : x) });
    onRefresh();
  };

  const placeIcon = (p: string) => p === '1st' ? '🥇' : p === '2nd' ? '🥈' : p === '3rd' ? '🥉' : '🏆';

  const stats = { total: items.length, featured: items.filter(t => t.featured).length, visible: items.filter(t => t.visible).length };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white tracking-widest">🏆 TROPHY ROOM</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tournament wins and placements</p>
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'saved' && <span className="text-xs font-black text-green-400">✅ SAVED</span>}
          {saveState === 'error' && <span className="text-xs font-black text-red-400">❌ ERROR</span>}
          <button onClick={openNew} className="px-4 py-2 rounded-lg text-xs font-black text-black"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            + ADD TROPHY
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[['Total', stats.total, GOLD], ['Visible', stats.visible, '#10b981'], ['Featured', stats.featured, '#f97316']].map(([l, v, c]) => (
          <div key={l as string} className="p-3 rounded-xl border border-white/8 bg-white/3 text-center">
            <div className="text-2xl font-black" style={{ color: c as string }}>{v as number}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{l as string}</div>
          </div>
        ))}
      </div>

      {/* Inline Form */}
      {(isNew || editing) && (
        <div className="p-5 rounded-2xl border border-white/10 bg-white/3 space-y-4">
          <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">
            {isNew ? '➕ New Trophy' : `✏ Edit — ${editing?.title}`}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              ['title', 'Title', 'e.g. PMPL Season 4 Champions'],
              ['tournamentName', 'Tournament Name', 'e.g. PMPL India'],
              ['prizePool', 'Prize Pool', 'e.g. ₹10,00,000'],
              ['date', 'Date', null, 'date'],
              ['mvp', 'MVP Player', 'Player IGN'],
            ] as [string, string, string | null, string?][]).map(([k, label, ph, type]) => (
              <div key={k}>
                <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                  style={{ color: 'rgba(212,175,55,0.6)' }}>{label}</label>
                <input type={type ?? 'text'} value={(form as any)[k]} onChange={e => F(k, e.target.value)}
                  placeholder={ph ?? ''}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Game</label>
              <Combobox value={form.game} onChange={e => F('game', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none">
                {['', ...GAMES].map(g => <option key={g} value={g}>{g || 'Select game'}</option>)}
              </Combobox>
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                style={{ color: 'rgba(212,175,55,0.6)' }}>Placement</label>
              <Combobox value={form.placement} onChange={e => F('placement', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none">
                {PLACES.map(p => <option key={p} value={p}>{p}</option>)}
              </Combobox>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
              style={{ color: 'rgba(212,175,55,0.6)' }}>Description</label>
            <textarea value={form.description} onChange={e => F('description', e.target.value)} rows={2}
              placeholder="Short description of the win..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none resize-none" />
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            {[['Featured', 'featured'], ['Visible', 'visible']].map(([lbl, k]) => (
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trophies..."
        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 outline-none focus:border-gold/40" />

      {/* List */}
      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-sm font-bold">{search ? 'No results' : 'No trophies yet'}</p>
            {!search && <p className="text-xs mt-1">Click "+ Add Trophy" to get started</p>}
          </div>
        )}
        {sorted.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
            style={{
              borderColor: t.visible ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
              background: t.visible ? 'rgba(212,175,55,0.03)' : 'rgba(255,255,255,0.01)',
            }}>
            <div className="text-2xl flex-shrink-0">{placeIcon(t.placement)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">{t.title}</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(212,175,55,0.15)', color: GOLD }}>{t.placement}</span>
                {t.featured && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">FEATURED</span>}
                {!t.visible && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-500">HIDDEN</span>}
              </div>
              <p className="text-xs text-gray-500 truncate">{t.tournamentName}{t.game ? ` · ${t.game}` : ''}{t.date ? ` · ${t.date}` : ''}</p>
              {t.prizePool && <p className="text-xs text-green-400 font-bold">{t.prizePool}</p>}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => toggleVisible(t)}
                className="p-1.5 rounded-lg border border-white/8 text-xs transition-colors"
                style={{ color: t.visible ? '#10b981' : '#6b7280' }}
                title={t.visible ? 'Visible' : 'Hidden'}>
                {t.visible ? '👁' : '👁‍🗨'}
              </button>
              <button onClick={() => openEdit(t)}
                className="p-1.5 rounded-lg border border-white/8 text-xs text-gray-400 hover:text-white">✏</button>
              {deleting === t.id
                ? <div className="flex gap-1">
                    <button onClick={() => handleDelete(t.id)}
                      className="px-2 py-1 rounded-lg text-[10px] font-black text-white bg-red-500/80">DEL</button>
                    <button onClick={() => setDeleting(null)}
                      className="px-2 py-1 rounded-lg text-[10px] text-gray-500 border border-white/10">No</button>
                  </div>
                : <button onClick={() => setDeleting(t.id)}
                    className="p-1.5 rounded-lg border border-red-500/20 text-red-400/50 hover:text-red-400 text-xs">🗑</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
