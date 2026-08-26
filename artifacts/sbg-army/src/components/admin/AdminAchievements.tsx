import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { Achievement } from '@/lib/database';
import MediaUpload from '@/components/shared/MediaUpload';
import Combobox from '@/components/shared/Combobox';

const GOLD = '#d4af37';

const CATEGORIES: Achievement['category'][] = [
  'Tournament Win', 'Runner-up', 'Top 3', 'MVP Award',
  'National Event', 'International Event', 'Community Award', 'Content Creator Award',
];

const TROPHY_ICONS = ['🏆','🥇','🥈','🥉','🎖️','⚡','⭐','🎯','🔱','👑','🌟','🎬','🤝','📊'];

const EMPTY: Omit<Achievement, 'id' | 'createdAt'> = {
  title: '', category: 'Tournament Win', trophyIcon: '🏆',
  tournamentLogo: '', date: '', placement: '1st', prizePool: '',
  result: 'W', teamRoster: [], mvp: '', gallery: [],
  matchReplayUrl: '', certificateUrl: '', externalLink: '',
  description: '', isFeatured: false, visible: true, order: 0,
};

interface Props { onRefresh: () => void; }

export default function AdminAchievements({ onRefresh }: Props) {
  const db = getDB();
  const achievements: Achievement[] = db.achievements ?? [];

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Achievement['category']>('all');
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<Achievement, 'id' | 'createdAt'>>(EMPTY);
  const [rosterInput, setRosterInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = achievements
    .filter(a => filter === 'all' || a.category === filter)
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    setForm({ ...EMPTY, order: achievements.length });
    setRosterInput('');
    setIsNew(true);
    setEditing(null);
  };

  const openEdit = (a: Achievement) => {
    setForm({
      title: a.title, category: a.category, trophyIcon: a.trophyIcon,
      tournamentLogo: a.tournamentLogo ?? '', date: a.date, placement: a.placement,
      prizePool: a.prizePool ?? '', result: a.result,
      teamRoster: a.teamRoster ?? [], mvp: a.mvp ?? '',
      gallery: a.gallery ?? [], matchReplayUrl: a.matchReplayUrl ?? '',
      certificateUrl: a.certificateUrl ?? '', externalLink: a.externalLink ?? '',
      description: a.description ?? '', isFeatured: a.isFeatured,
      visible: a.visible, order: a.order,
    });
    setRosterInput((a.teamRoster ?? []).join(', '));
    setEditing(a);
    setIsNew(false);
  };

  const closeForm = () => { setEditing(null); setIsNew(false); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const current = getDB();
      const list: Achievement[] = current.achievements ?? [];
      const roster = rosterInput.split(',').map(s => s.trim()).filter(Boolean);
      if (isNew) {
        const newItem: Achievement = {
          ...form, teamRoster: roster,
          id: `ach_${Date.now()}`,
          createdAt: Date.now(),
        };
        current.achievements = [...list, newItem];
      } else if (editing) {
        current.achievements = list.map(a =>
          a.id === editing.id ? { ...a, ...form, teamRoster: roster } : a
        );
      }
      await saveDB(current);
      onRefresh();
      setSaveState('saved');
      closeForm();
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this achievement? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const current = getDB();
      current.achievements = (current.achievements ?? []).filter(a => a.id !== id);
      await saveDB(current);
      onRefresh();
    } finally { setDeleting(null); }
  };

  const toggleFeatured = async (a: Achievement) => {
    const current = getDB();
    current.achievements = (current.achievements ?? []).map(x =>
      x.id === a.id ? { ...x, isFeatured: !x.isFeatured } : x
    );
    await saveDB(current);
    onRefresh();
  };

  const toggleVisible = async (a: Achievement) => {
    const current = getDB();
    current.achievements = (current.achievements ?? []).map(x =>
      x.id === a.id ? { ...x, visible: !x.visible } : x
    );
    await saveDB(current);
    onRefresh();
  };

  // ── Form panel ──────────────────────────────────────────────────────────────
  if (isNew || editing) {
    return (
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={closeForm}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            ← Back
          </button>
          <div>
            <h2 className="text-lg font-black text-white tracking-widest">
              {isNew ? '+ NEW ACHIEVEMENT' : 'EDIT ACHIEVEMENT'}
            </h2>
            <p className="text-xs text-gray-600">{isNew ? 'Add a new achievement to the database' : `Editing: ${editing?.title}`}</p>
          </div>
        </div>

        <div className="space-y-5 p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Title + Category */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Achievement Title *">
              <Input imageUrl={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="BGMI National Championship" />
            </Field>
            <Field label="Category *">
              <Combobox imageUrl={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Achievement['category'] }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Combobox>
            </Field>
          </div>

          {/* Trophy Icon */}
          <Field label="Trophy Icon (emoji)">
            <div className="flex flex-wrap gap-2 mb-2">
              {TROPHY_ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, trophyIcon: icon }))}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: form.trophyIcon === icon ? `${GOLD}25` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.trophyIcon === icon ? GOLD : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  {icon}
                </button>
              ))}
              <Input imageUrl={form.trophyIcon} onChange={v => setForm(f => ({ ...f, trophyIcon: v }))} placeholder="Custom emoji" />
            </div>
          </Field>

          {/* Date + Placement + Result */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Date *">
              <Input type="date" imageUrl={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            </Field>
            <Field label="Placement">
              <Combobox imageUrl={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {['1st','2nd','3rd','4th','5th','Top 8','Top 16','Qualifier','Record','Participant'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Combobox>
            </Field>
            <Field label="Result">
              <Combobox imageUrl={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {['W','L','Draw','Record','Participant'].map(r => <option key={r} value={r}>{r}</option>)}
              </Combobox>
            </Field>
          </div>

          {/* Prize Pool + MVP */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Prize Pool">
              <Input imageUrl={form.prizePool ?? ''} onChange={v => setForm(f => ({ ...f, prizePool: v }))} placeholder="$10,000" />
            </Field>
            <Field label="MVP Player">
              <Input imageUrl={form.mvp ?? ''} onChange={v => setForm(f => ({ ...f, mvp: v }))} placeholder="Player name" />
            </Field>
          </div>

          {/* Team Roster */}
          <Field label="Team Roster (comma-separated names)">
            <Input value={rosterInput} onChange={setRosterInput} placeholder="Player1, Player2, Player3, Player4" />
            {rosterInput.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {rosterInput.split(',').map(s => s.trim()).filter(Boolean).map((p, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>{p}</span>
                ))}
              </div>
            )}
          </Field>

          {/* Tournament Logo */}
          <Field label="Tournament Logo">
            <MediaUpload
              imageUrl={form.tournamentLogo ?? ''}
              onImageChange={url => setForm(f => ({ ...f, tournamentLogo: url }))}
              label="Tournament Logo"
              size="md"
              shape="square"
              useServerUpload
              hint="Upload tournament logo (PNG preferred)"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              imageUrl={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe this achievement…"
              className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </Field>

          {/* External links */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Match Replay URL">
              <Input imageUrl={form.matchReplayUrl ?? ''} onChange={v => setForm(f => ({ ...f, matchReplayUrl: v }))} placeholder="https://youtube.com/…" />
            </Field>
            <Field label="Certificate URL">
              <Input imageUrl={form.certificateUrl ?? ''} onChange={v => setForm(f => ({ ...f, certificateUrl: v }))} placeholder="https://…" />
            </Field>
            <Field label="External Link">
              <Input imageUrl={form.externalLink ?? ''} onChange={v => setForm(f => ({ ...f, externalLink: v }))} placeholder="https://…" />
            </Field>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <Toggle label="Featured" desc="Show in featured row" imageUrl={form.isFeatured} onChange={v => setForm(f => ({ ...f, isFeatured: v }))} />
            <Toggle label="Visible" desc="Show on public page" imageUrl={form.visible} onChange={v => setForm(f => ({ ...f, visible: v }))} />
          </div>
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.date}
          className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest text-black transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: saveState === 'saved' ? '#10b981' : saveState === 'error' ? '#e94560' : `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
          {saving && <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
          {saving ? 'Saving…' : saveState === 'saved' ? '✓ Saved!' : saveState === 'error' ? '✗ Error' : isNew ? 'Add Achievement' : 'Save Changes'}
        </button>
      </div>
    );
  }

  // ── List panel ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-2">🏆 ACHIEVEMENT CENTER</h2>
          <p className="text-xs text-gray-500 mt-1">{achievements.length} achievements — fully editable, shown on the public Achievements page</p>
        </div>
        <button onClick={openNew}
          className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
          + Add Achievement
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: achievements.length, icon: '🏆' },
          { label: 'Visible', value: achievements.filter(a => a.visible).length, icon: '👁' },
          { label: 'Featured', value: achievements.filter(a => a.isFeatured).length, icon: '★' },
          { label: 'Wins', value: achievements.filter(a => a.category === 'Tournament Win').length, icon: '🥇' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="text-xl">{s.icon}</div>
            <div className="text-xl font-black" style={{ color: GOLD }}>{s.value}</div>
            <div className="text-[9px] font-black tracking-widest uppercase text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search achievements…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <Combobox value={filter} onChange={e => setFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Combobox>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-600 font-bold tracking-widest uppercase text-sm">No achievements yet</p>
          <button onClick={openNew} className="mt-4 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
            style={{ border: `1px solid ${GOLD}40`, color: GOLD }}>Add First Achievement</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.005]"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${a.visible ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'}`, opacity: a.visible ? 1 : 0.5 }}>
              <span className="text-2xl leading-none">{a.trophyIcon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="font-black text-white text-sm truncate">{a.title}</p>
                  {a.isFeatured && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `${GOLD}15`, color: GOLD }}>★ Featured</span>}
                  {!a.visible && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>Hidden</span>}
                </div>
                <p className="text-xs text-gray-600">
                  {a.category} · {a.placement} · {new Date(a.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {a.prizePool && <span className="ml-2 text-green-400 font-bold">{a.prizePool}</span>}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleFeatured(a)} title={a.isFeatured ? 'Unfeature' : 'Feature'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
                  style={{ background: a.isFeatured ? `${GOLD}20` : 'rgba(255,255,255,0.04)', color: a.isFeatured ? GOLD : 'rgba(255,255,255,0.3)' }}>
                  ★
                </button>
                <button onClick={() => toggleVisible(a)} title={a.visible ? 'Hide' : 'Show'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.04)', color: a.visible ? '#10b981' : 'rgba(255,255,255,0.2)' }}>
                  {a.visible ? '👁' : '🙈'}
                </button>
                <button onClick={() => openEdit(a)}
                  className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
                  style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110 disabled:opacity-40"
                  style={{ background: 'rgba(233,69,96,0.1)', color: '#e94560' }}>
                  {deleting === a.id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none focus:border-yellow-500/40 transition-colors"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 min-w-[180px]"
      style={{ background: value ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${value ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-gray-800'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${value ? 'left-6' : 'left-1'}`} />
      </button>
      <div>
        <p className="text-xs font-black text-white">{label}</p>
        <p className="text-[10px] text-gray-600">{desc}</p>
      </div>
    </div>
  );
}
