import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { HOFMilestone } from '@/lib/database';
import MediaUpload from '@/components/shared/MediaUpload';
import Combobox from '@/components/shared/Combobox';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';

const CATEGORIES: HOFMilestone['category'][] = [
  'Founded', 'Tournament Win', 'Championship', 'Signing', 'Sponsor',
  'Milestone', 'Record', 'Roster Change', 'Award', 'Expansion',
];

const ICON_PRESETS = ['🚀', '🏆', '👑', '🤝', '⭐', '🎖️', '📊', '🔥', '💎', '🎯'];
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY: Omit<HOFMilestone, 'id' | 'createdAt'> = {
  year: new Date().getFullYear(), month: undefined, title: '', description: '',
  category: 'Milestone', icon: '⭐', image: '', badge: '', playerName: '', prizePool: '',
  featured: false, visible: true, order: 0,
};

interface Props { onRefresh: () => void; }

export default function AdminHOFTimeline({ onRefresh }: Props) {
  const db = getDB();
  const milestones: HOFMilestone[] = db.hofMilestones ?? [];

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<HOFMilestone | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<HOFMilestone, 'id' | 'createdAt'>>(EMPTY);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = [...milestones]
    .filter(m =>
      !search.trim() ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.year - a.year) || ((b.month ?? 0) - (a.month ?? 0)));

  const stats = {
    total: milestones.length,
    featured: milestones.filter(m => m.featured).length,
    years: new Set(milestones.map(m => m.year)).size,
  };

  const openNew = () => {
    setForm(EMPTY);
    setIsNew(true);
    setEditing({ ...EMPTY, id: '', createdAt: 0 });
  };

  const openEdit = (m: HOFMilestone) => {
    setForm({ ...m });
    setIsNew(false);
    setEditing(m);
  };

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
  };

  const save = async () => {
    const current = getDB();
    const list = current.hofMilestones ?? [];
    if (isNew) {
      const created: HOFMilestone = { ...form, id: `hof${Date.now()}`, createdAt: Date.now() };
      current.hofMilestones = [...list, created];
    } else if (editing) {
      current.hofMilestones = list.map(m => m.id === editing.id ? { ...m, ...form } : m);
    }
    await saveDB(current);
    onRefresh();
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1500);
    closeForm();
  };

  const toggle = async (id: string, key: 'featured' | 'visible') => {
    const current = getDB();
    current.hofMilestones = (current.hofMilestones ?? []).map(m => m.id === id ? { ...m, [key]: !m[key] } : m);
    await saveDB(current);
    onRefresh();
  };

  const remove = async (id: string) => {
    const current = getDB();
    current.hofMilestones = (current.hofMilestones ?? []).filter(m => m.id !== id);
    await saveDB(current);
    onRefresh();
    setDeleting(null);
  };

  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50';
  const label = 'text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 block';

  if (editing) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">{isNew ? 'Add Milestone' : 'Edit Milestone'}</h2>
          <button onClick={closeForm} className="text-gray-400 hover:text-white text-sm font-bold">← Back to list</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={label}>Title *</label>
            <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. ${ADMIN_BRAND_NAME} Founded" />
          </div>
          <div className="col-span-2">
            <label className={label}>Description *</label>
            <textarea className={inp} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Category</label>
            <Combobox className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as HOFMilestone['category'] }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Combobox>
          </div>
          <div>
            <label className={label}>Icon</label>
            <input className={inp} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {ICON_PRESETS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-lg flex items-center justify-center">
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label}>Year *</label>
            <input type="number" className={inp} value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
          </div>
          <div>
            <label className={label}>Month</label>
            <Combobox className={inp} value={form.month ?? ''} onChange={e => setForm(f => ({ ...f, month: e.target.value ? Number(e.target.value) : undefined }))}>
              <option value="">—</option>
              {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Combobox>
          </div>
          <div>
            <label className={label}>Player Name</label>
            <input className={inp} value={form.playerName ?? ''} onChange={e => setForm(f => ({ ...f, playerName: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Prize Pool</label>
            <input className={inp} value={form.prizePool ?? ''} onChange={e => setForm(f => ({ ...f, prizePool: e.target.value }))} placeholder="$5,000" />
          </div>
          <div>
            <label className={label}>Badge</label>
            <input className={inp} value={form.badge ?? ''} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="GOLD / PLATINUM" />
          </div>
          <div>
            <label className={label}>Order</label>
            <input type="number" className={inp} value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
          </div>
          <div className="col-span-2">
            <label className={label}>Image</label>
            <MediaUpload imageUrl={form.image ?? ''} onImageChange={url => setForm(f => ({ ...f, image: url }))} useServerUpload label="Upload image" size="md" shape="square" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-5 h-5" />
            <span className="text-sm text-white font-bold">Featured milestone</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))} className="w-5 h-5" />
            <span className="text-sm text-white font-bold">Visible on website</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={save} disabled={!form.title.trim() || !form.description.trim()}
            className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-black disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            {isNew ? 'Create Milestone' : 'Save Changes'}
          </button>
          <button onClick={closeForm} className="px-6 py-3 rounded-xl font-bold text-gray-300 border border-white/10">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-black text-white">Hall of Fame Timeline</h2>
        <button onClick={openNew}
          className="px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-black text-sm"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
          + Add Milestone
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 border border-white/10 bg-[#111114]">
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 uppercase font-bold">Total Milestones</div>
        </div>
        <div className="rounded-2xl p-4 border border-white/10 bg-[#111114]">
          <div className="text-2xl font-black" style={{ color: GOLD }}>{stats.featured}</div>
          <div className="text-xs text-gray-500 uppercase font-bold">Featured</div>
        </div>
        <div className="rounded-2xl p-4 border border-white/10 bg-[#111114]">
          <div className="text-2xl font-black text-white">{stats.years}</div>
          <div className="text-xs text-gray-500 uppercase font-bold">Years Covered</div>
        </div>
      </div>

      <input className={inp} placeholder="Search milestones..." value={search} onChange={e => setSearch(e.target.value)} />

      {saveState === 'saved' && <div className="text-green-400 text-sm font-bold">✓ Saved</div>}

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-16 text-gray-500">No milestones found.</div>
        )}
        {sorted.map(m => (
          <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-[#111114]">
            <div className="text-2xl flex-shrink-0">{m.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold truncate">{m.title}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">{m.category}</span>
                <span className="text-xs text-gray-500">{m.month ? `${MONTHS[m.month]} ` : ''}{m.year}</span>
              </div>
              <p className="text-gray-500 text-xs truncate">{m.description}</p>
            </div>
            <button onClick={() => toggle(m.id, 'featured')} title="Toggle featured"
              className={`text-lg ${m.featured ? '' : 'opacity-30'}`}>★</button>
            <button onClick={() => toggle(m.id, 'visible')}
              className={`text-xs px-2 py-1 rounded font-bold ${m.visible ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {m.visible ? 'Visible' : 'Hidden'}
            </button>
            <button onClick={() => openEdit(m)} className="text-xs px-3 py-1.5 rounded bg-white/5 text-white font-bold hover:bg-white/10">Edit</button>
            {deleting === m.id ? (
              <div className="flex gap-1">
                <button onClick={() => remove(m.id)} className="text-xs px-2 py-1.5 rounded bg-red-500 text-white font-bold">Confirm</button>
                <button onClick={() => setDeleting(null)} className="text-xs px-2 py-1.5 rounded bg-white/5 text-gray-300">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setDeleting(m.id)} className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20">Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
