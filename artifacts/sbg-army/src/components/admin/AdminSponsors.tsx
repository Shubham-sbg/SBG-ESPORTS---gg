import { useState } from 'react';
import { Sponsor, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  sponsors: Sponsor[];
  onRefresh: () => void;
}

const SPONSOR_CATEGORIES = [
  { value: '', label: 'No Category' },
  { value: 'main', label: 'Main Sponsor' },
  { value: 'gold', label: 'Gold Sponsor' },
  { value: 'silver', label: 'Silver Sponsor' },
  { value: 'community', label: 'Community Partner' },
];

const empty = (): Omit<Sponsor, 'id'> => ({ name: '', logo: '', link: '', visible: true, order: 0, category: undefined, description: '' });

export default function AdminSponsors({ sponsors, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let logoUrl = form.logo;
      if (logoUrl && logoUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(logoUrl, { filename: 'sponsor-logo.png' });
          logoUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for sponsor logo, using local DataURL:', uploadErr);
        }
      }

      const db = getDB();
      if (!db.sponsors) db.sponsors = [];
      const updatedForm = { ...form, logo: logoUrl };

      if (adding) {
        db.sponsors.push({ ...updatedForm, id: `s${Date.now()}`, order: db.sponsors.length + 1 });
      } else if (editing) {
        const idx = db.sponsors.findIndex(s => s.id === editing.id);
        if (idx !== -1) db.sponsors[idx] = { ...editing, ...updatedForm };
      }
      await saveDB(db, 'sponsors');
      onRefresh();
      setAdding(false);
      setEditing(null);
      setForm(empty());
    } catch (e: any) {
      console.error('Sponsor save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setAdding(false);
        setEditing(null);
        setForm(empty());
      } else {
        setSaveError(msg || 'Failed to save sponsor. Check connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    try {
      const db = getDB();
      db.sponsors = db.sponsors.filter(s => s.id !== id);
      await saveDB(db, 'sponsors');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to delete sponsor:', e);
      onRefresh();
    }
  };

  const toggleVisible = async (id: string) => {
    try {
      const db = getDB();
      const s = db.sponsors.find(s => s.id === id);
      if (s) s.visible = !s.visible;
      await saveDB(db, 'sponsors');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to update sponsor visibility:', e);
      onRefresh();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFileToServer(file);
      setForm(f => ({ ...f, logo: res.url }));
    } catch (err: any) {
      console.warn('Server logo upload failed, converting file to local DataURL preview:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setForm(f => ({ ...f, logo: event.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sorted = [...sponsors].sort((a, b) => a.order - b.order);

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(empty()); }} className="text-gray-400 hover:text-white">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Sponsor' : 'Edit Sponsor'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-5">
          <div className="flex items-center gap-6">
            <div className="w-24 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/3">
              {form.logo ? <img src={form.logo} alt="" className="w-full h-full object-contain p-1" /> : <span>🤝</span>}
            </div>
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
              Upload Logo <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
          <div><label className="label">Name</label><input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">Website URL</label><input className="inp" value={form.link} placeholder="https://" onChange={e => setForm(f => ({ ...f, link: e.target.value }))} /></div>
          <div>
            <label className="label">Category</label>
            <Combobox className="inp" value={form.category ?? ''} onChange={e => setForm(f => ({ ...f, category: (e.target.value as Sponsor['category']) || undefined }))}>
              {SPONSOR_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Combobox>
          </div>
          <div><label className="label">Description (optional)</label><input className="inp" value={form.description ?? ''} placeholder="Brief description..." onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))}
              className={`relative w-12 h-6 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-400">Visible on website</span>
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
            {saving ? '⏳ SAVING...' : adding ? 'ADD SPONSOR' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">Sponsors ({sponsors.length})</h2>
        <button onClick={() => { setAdding(true); setForm(empty()); }}
          className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          + Add Sponsor
        </button>
      </div>
      <div className="space-y-3">
        {sorted.map(s => (
          <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
            <div className="w-16 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
              {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-gray-500 text-xs">{s.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{s.name}</p>
              <p className="text-xs text-gray-500 truncate">{s.link}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => toggleVisible(s.id)}
                className={`relative w-10 h-5 rounded-full transition-all ${s.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${s.visible ? 'left-5' : 'left-0.5'}`} />
              </button>
              <button onClick={() => { setEditing(s); setForm({ name: s.name, logo: s.logo, link: s.link, visible: s.visible, order: s.order, category: s.category, description: s.description ?? '' }); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Edit</button>
              <button onClick={() => { if (confirm('Delete?')) del(s.id); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        ))}
        {sponsors.length === 0 && <div className="text-center py-12 text-gray-600">No sponsors yet.</div>}
      </div>
    </div>
  );
}
