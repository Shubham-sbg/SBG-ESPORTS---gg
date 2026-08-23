/**
 * AdminAbout — Full CMS for the About page.
 * Edits db.about: heading, description, mission, vision, story, stats, timeline, values.
 */
import { useState, useEffect } from 'react';
import { getDB, saveDB, AboutContent, AboutStat, AboutTimelineItem, AboutValue } from '@/lib/database';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';

function uid() { return `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

function Field({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const cls = "w-full px-3 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none focus:border-yellow-500/40 transition-all";
  return (
    <div>
      <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5 text-yellow-500/60">{label}</label>
      {multiline
        ? <textarea className={cls} rows={4} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  );
}

export default function AdminAbout({ onRefresh }: { onRefresh: () => void }) {
  const [tab, setTab] = useState<'general' | 'stats' | 'timeline' | 'values'>('general');
  const [data, setData] = useState<AboutContent>(() => {
    const db = getDB() as any;
    return db.about ?? {
      heading: 'ABOUT ${ADMIN_BRAND_NAME}', description: '', mission: '', vision: '', story: '',
      stats: [], timeline: [], values: [], images: [], videos: [],
    };
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const db = getDB() as any;
    if (db.about) setData(db.about);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = getDB() as any;
      db.about = data;
      await saveDB(db);
      onRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  // ── Stats ──
  const addStat = () => setData(d => ({ ...d, stats: [...(d.stats ?? []), { id: uid(), label: 'New Stat', value: '0+', icon: '⭐', color: '#ff6b00' }] }));
  const updateStat = (id: string, k: keyof AboutStat, v: string) => setData(d => ({ ...d, stats: (d.stats ?? []).map(s => s.id === id ? { ...s, [k]: v } : s) }));
  const removeStat = (id: string) => setData(d => ({ ...d, stats: (d.stats ?? []).filter(s => s.id !== id) }));

  // ── Timeline ──
  const addTimeline = () => setData(d => ({ ...d, timeline: [...(d.timeline ?? []), { id: uid(), year: String(new Date().getFullYear()), title: 'New Milestone', description: '' }] }));
  const updateTimeline = (id: string, k: keyof AboutTimelineItem, v: string) => setData(d => ({ ...d, timeline: (d.timeline ?? []).map(t => t.id === id ? { ...t, [k]: v } : t) }));
  const removeTimeline = (id: string) => setData(d => ({ ...d, timeline: (d.timeline ?? []).filter(t => t.id !== id) }));

  // ── Values ──
  const addValue = () => setData(d => ({ ...d, values: [...(d.values ?? []), { id: uid(), icon: '⭐', title: 'New Value', description: '' }] }));
  const updateValue = (id: string, k: keyof AboutValue, v: string) => setData(d => ({ ...d, values: (d.values ?? []).map(v2 => v2.id === id ? { ...v2, [k]: v } : v2) }));
  const removeValue = (id: string) => setData(d => ({ ...d, values: (d.values ?? []).filter(v2 => v2.id !== id) }));

  const TABS = [
    { key: 'general', label: 'General' },
    { key: 'stats', label: `Stats (${data.stats?.length ?? 0})` },
    { key: 'timeline', label: `Timeline (${data.timeline?.length ?? 0})` },
    { key: 'values', label: `Values (${data.values?.length ?? 0})` },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest">📖 ABOUT PAGE CMS</h2>
          <p className="text-xs text-gray-500 mt-1">Edit all content on the public About page.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            style={tab === t.key
              ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, color: '#000' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === 'general' && (
        <div className="space-y-4 p-6 rounded-2xl border border-white/5 bg-white/2">
          <Field label="Page Heading" value={data.heading ?? ''} onChange={v => setData(d => ({ ...d, heading: v }))} placeholder="ABOUT ${ADMIN_BRAND_NAME}" />
          <Field label="Hero Description" value={data.description ?? ''} onChange={v => setData(d => ({ ...d, description: v }))} multiline placeholder="Short description shown under the hero title" />
          <Field label="Mission Statement" value={data.mission ?? ''} onChange={v => setData(d => ({ ...d, mission: v }))} multiline placeholder="Our mission is..." />
          <Field label="Vision Statement" value={data.vision ?? ''} onChange={v => setData(d => ({ ...d, vision: v }))} multiline placeholder="Our vision is..." />
          <Field label="Our Story" value={data.story ?? ''} onChange={v => setData(d => ({ ...d, story: v }))} multiline placeholder="Tell the story of how ${ADMIN_BRAND_NAME} was founded..." />
        </div>
      )}

      {/* Stats */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={addStat} className="px-4 py-2 rounded-xl text-xs font-black text-black uppercase tracking-widest"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>+ Add Stat</button>
          </div>
          {(data.stats ?? []).map(s => (
            <div key={s.id} className="p-4 rounded-xl border border-white/5 bg-white/2 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <Field label="Label" value={s.label} onChange={v => updateStat(s.id, 'label', v)} placeholder="Active Players" />
              <Field label="Value" value={s.value} onChange={v => updateStat(s.id, 'value', v)} placeholder="50+" />
              <Field label="Icon (emoji)" value={s.icon ?? ''} onChange={v => updateStat(s.id, 'icon', v)} placeholder="🎮" />
              <Field label="Color" value={s.color ?? ''} onChange={v => updateStat(s.id, 'color', v)} placeholder="#ff6b00" />
              <div className="col-span-2 sm:col-span-4 flex justify-end">
                <button onClick={() => removeStat(s.id)} className="px-3 py-1 rounded-lg text-xs font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">Remove</button>
              </div>
            </div>
          ))}
          {!data.stats?.length && <div className="text-center py-8 text-gray-600 text-sm">No stats yet. Click "Add Stat" to create one.</div>}
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={addTimeline} className="px-4 py-2 rounded-xl text-xs font-black text-black uppercase tracking-widest"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>+ Add Milestone</button>
          </div>
          {(data.timeline ?? []).map((t, i) => (
            <div key={t.id} className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gold/50 uppercase tracking-widest">Milestone {i + 1}</span>
                <button onClick={() => removeTimeline(t.id)} className="px-3 py-1 rounded-lg text-xs font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year" value={t.year} onChange={v => updateTimeline(t.id, 'year', v)} placeholder="2020" />
                <Field label="Title" value={t.title} onChange={v => updateTimeline(t.id, 'title', v)} placeholder="${ADMIN_BRAND_NAME} Founded" />
              </div>
              <Field label="Description" value={t.description} onChange={v => updateTimeline(t.id, 'description', v)} multiline placeholder="What happened..." />
            </div>
          ))}
          {!data.timeline?.length && <div className="text-center py-8 text-gray-600 text-sm">No timeline entries. Click "Add Milestone" to create one.</div>}
        </div>
      )}

      {/* Values */}
      {tab === 'values' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={addValue} className="px-4 py-2 rounded-xl text-xs font-black text-black uppercase tracking-widest"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>+ Add Value</button>
          </div>
          {(data.values ?? []).map(v => (
            <div key={v.id} className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gold/50 uppercase tracking-widest">{v.title || 'Core Value'}</span>
                <button onClick={() => removeValue(v.id)} className="px-3 py-1 rounded-lg text-xs font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Icon (emoji)" value={v.icon} onChange={val => updateValue(v.id, 'icon', val)} placeholder="⚡" />
                <Field label="Title" value={v.title} onChange={val => updateValue(v.id, 'title', val)} placeholder="Excellence" />
              </div>
              <Field label="Description" value={v.description} onChange={val => updateValue(v.id, 'description', val)} multiline placeholder="What this value means..." />
            </div>
          ))}
          {!data.values?.length && <div className="text-center py-8 text-gray-600 text-sm">No values yet. Click "Add Value" to create one.</div>}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving}
          className="px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
