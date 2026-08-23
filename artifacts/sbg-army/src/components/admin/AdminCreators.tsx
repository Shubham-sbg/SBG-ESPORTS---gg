import { useState } from 'react';
import { Creator, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  creators: Creator[];
  onRefresh: () => void;
}

const ROLES = ['BGMI Creator', 'YouTube Creator', 'Streamer', 'Shorts Creator', 'Editor', 'Analyst', 'Caster'];
const CONTENT_TYPES = ['YouTube videos', 'Instagram reels', 'Scrim highlights', 'Tournament vlogs', 'Bootcamp content', 'Short clips', 'Live streams'];

const empty = (): Omit<Creator, 'id'> => ({
  name: '', ign: '', role: 'YouTube Creator', photo: '', contentTypes: [], visible: true, order: 0, social: '',
});

export default function AdminCreators({ creators, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Creator | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const toggleContentType = (ct: string) => {
    setForm(f => ({
      ...f,
      contentTypes: f.contentTypes.includes(ct) ? f.contentTypes.filter(x => x !== ct) : [...f.contentTypes, ct],
    }));
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let photoUrl = form.photo;
      if (photoUrl && photoUrl.startsWith('data:')) {
        try {
          const res = await uploadFileToServer(photoUrl, { filename: 'creator-photo.png' });
          photoUrl = res.url;
        } catch (uploadErr) {
          console.warn('Server upload failed for creator photo, using local DataURL:', uploadErr);
        }
      }

      const db = getDB();
      if (!db.creators) db.creators = [];
      const updatedForm = { ...form, photo: photoUrl };

      if (adding) {
        db.creators.push({ ...updatedForm, id: `cr${Date.now()}`, order: db.creators.length + 1 });
      } else if (editing) {
        const idx = db.creators.findIndex(c => c.id === editing.id);
        if (idx !== -1) db.creators[idx] = { ...editing, ...updatedForm };
      }
      await saveDB(db, 'creators');
      onRefresh();
      setAdding(false);
      setEditing(null);
      setForm(empty());
    } catch (e: any) {
      console.error('Creator save error:', e);
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setAdding(false);
        setEditing(null);
        setForm(empty());
      } else {
        setSaveError(msg || 'Failed to save creator. Check your connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    try {
      const db = getDB();
      db.creators = db.creators.filter(c => c.id !== id);
      await saveDB(db, 'creators');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to delete creator:', e);
      onRefresh();
    }
  };

  const toggle = async (id: string) => {
    try {
      const db = getDB();
      const c = db.creators.find(c => c.id === id);
      if (c) c.visible = !c.visible;
      await saveDB(db, 'creators');
      onRefresh();
    } catch (e: any) {
      console.error('Failed to update creator visibility:', e);
      onRefresh();
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFileToServer(file);
      setForm(f => ({ ...f, photo: res.url }));
    } catch (err: any) {
      console.warn('Server photo upload failed, converting file to local DataURL preview:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setForm(f => ({ ...f, photo: event.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sorted = [...(creators ?? [])].sort((a, b) => a.order - b.order);

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(empty()); }} className="text-gray-400 hover:text-white">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Creator' : 'Edit Creator'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-5">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/3">
              {form.photo ? <img src={form.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">🎥</span>}
            </div>
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
              Upload Photo <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Real Name</label><input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">IGN / Handle</label><input className="inp" value={form.ign} onChange={e => setForm(f => ({ ...f, ign: e.target.value }))} /></div>
            <div>
              <label className="label">Role</label>
              <Combobox className="inp" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </Combobox>
            </div>
            <div><label className="label">Social Link</label><input className="inp" placeholder="https://youtube.com/..." value={form.social ?? ''} onChange={e => setForm(f => ({ ...f, social: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label">Content Types</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CONTENT_TYPES.map(ct => (
                <button key={ct} type="button" onClick={() => toggleContentType(ct)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${form.contentTypes.includes(ct) ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  {ct}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))} className={`relative w-12 h-6 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
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
            {saving ? '⏳ SAVING...' : adding ? 'ADD CREATOR' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">Content Creators ({(creators ?? []).length})</h2>
        <button onClick={() => { setAdding(true); setForm(empty()); }} className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          + Add Creator
        </button>
      </div>
      <div className="space-y-3">
        {sorted.map(cr => (
          <div key={cr.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
              {cr.photo ? <img src={cr.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🎥</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{cr.ign || cr.name}</p>
              <p className="text-xs text-gray-500">{cr.name} · {cr.role}</p>
              {cr.contentTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {cr.contentTypes.map(ct => <span key={ct} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500">{ct}</span>)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggle(cr.id)} className={`w-10 h-5 rounded-full relative transition-all ${cr.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${cr.visible ? 'left-5.5' : 'left-0.5'}`} />
              </button>
              <button onClick={() => { setEditing(cr); setForm({ name: cr.name, ign: cr.ign, role: cr.role, photo: cr.photo, contentTypes: [...cr.contentTypes], visible: cr.visible, order: cr.order, social: cr.social }); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Edit</button>
              <button onClick={() => { if (confirm(`Delete ${cr.ign}?`)) del(cr.id); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="text-center py-12 text-gray-600">No creators yet.</div>}
      </div>
    </div>
  );
}
