import { getImageUrl } from '@/lib/imageResolver';
import { useState } from 'react';
import { Founder, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';

interface Props {
  founders: Founder[];
  onRefresh: () => void;
}

const DESIGNATIONS = ['Founder', 'Co-Founder', 'CEO', 'COO', 'Head Coach', 'Assistant Coach', 'Team Manager', 'Analyst', 'Scout', 'Content Manager', 'Social Media Manager'];

const empty = (): Omit<Founder, 'id'> => ({
  name: '', designation: 'Founder', photo: '', description: '', type: 'founder',
  socialInstagram: '', socialTwitter: '', socialYoutube: '', visible: true, order: 0,
});

export default function AdminFounders({ founders, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Founder | null>(null);
  const [form, setForm] = useState(empty());
  const [tab, setTab] = useState<'founder' | 'management'>('founder');

  const save = () => {
    const db = getDB();
    if (!db.founders) db.founders = [];
    if (adding) {
      db.founders.push({ ...form, id: `f${Date.now()}`, order: db.founders.length + 1 });
    } else if (editing) {
      const idx = db.founders.findIndex(f => f.id === editing.id);
      if (idx !== -1) db.founders[idx] = { ...editing, ...form };
    }
    saveDB(db);
    onRefresh();
    setAdding(false);
    setEditing(null);
    setForm(empty());
  };

  const del = (id: string) => {
    const db = getDB();
    db.founders = db.founders.filter(f => f.id !== id);
    saveDB(db);
    onRefresh();
  };

  const toggle = (id: string) => {
    const db = getDB();
    const f = db.founders.find(f => f.id === id);
    if (f) f.visible = !f.visible;
    saveDB(db);
    onRefresh();
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const sorted = [...(founders ?? [])].sort((a, b) => a.order - b.order);
  const filtered = sorted.filter(f => f.type === tab);

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(empty()); }} className="text-gray-400 hover:text-white">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Member' : 'Edit Member'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-5">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/3">
              {form.photo ? <img src={getImageUrl(form.photo)} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">👤</span>}
            </div>
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
              Upload Photo <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div>
              <label className="label">Designation</label>
              <Combobox className="inp" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </Combobox>
            </div>
            <div>
              <label className="label">Section</label>
              <Combobox className="inp" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'founder' | 'management' }))}>
                <option value="founder">Founders</option>
                <option value="management">Management</option>
              </Combobox>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="inp min-h-[80px] resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Instagram</label><input className="inp" placeholder="https://instagram.com/..." value={form.socialInstagram} onChange={e => setForm(f => ({ ...f, socialInstagram: e.target.value }))} /></div>
            <div><label className="label">Twitter/X</label><input className="inp" placeholder="https://twitter.com/..." value={form.socialTwitter} onChange={e => setForm(f => ({ ...f, socialTwitter: e.target.value }))} /></div>
            <div><label className="label">YouTube</label><input className="inp" placeholder="https://youtube.com/..." value={form.socialYoutube} onChange={e => setForm(f => ({ ...f, socialYoutube: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))} className={`relative w-12 h-6 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-400">Visible on website</span>
          </div>
          <button onClick={save} className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400">
            {adding ? 'ADD MEMBER' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">Founders & Management ({(founders ?? []).length})</h2>
        <button onClick={() => { setAdding(true); setForm({ ...empty(), type: tab }); }} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          + Add Member
        </button>
      </div>
      <div className="flex gap-2">
        {(['founder', 'management'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            {t === 'founder' ? '🏆 Founders' : '👔 Management'}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(f => (
          <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
              {f.photo ? <img src={getImageUrl(f.photo)} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">👤</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{f.name}</p>
              <p className="text-xs text-orange-400 font-semibold">{f.designation}</p>
              {f.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{f.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggle(f.id)} className={`w-10 h-5 rounded-full relative transition-all ${f.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${f.visible ? 'left-5.5' : 'left-0.5'}`} />
              </button>
              <button onClick={() => { setEditing(f); setForm({ name: f.name, designation: f.designation, photo: f.photo, description: f.description, type: f.type, socialInstagram: f.socialInstagram, socialTwitter: f.socialTwitter, socialYoutube: f.socialYoutube, visible: f.visible, order: f.order }); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Edit</button>
              <button onClick={() => { if (confirm(`Delete ${f.name}?`)) del(f.id); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No {tab} members yet. Add one!</div>}
      </div>
    </div>
  );
}
