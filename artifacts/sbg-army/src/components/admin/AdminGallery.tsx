import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import ImageUpload from '@/components/shared/ImageUpload';
import Combobox from '@/components/shared/Combobox';

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
  featured: boolean;
  visible: boolean;
}

const GOLD = '#d4af37';
const CATEGORIES = ['Tournaments', 'Team', 'Events', 'Behind the Scenes', 'Wins', 'Training', 'Other'];

function generateId() {
  return 'gallery_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

const EMPTY_FORM = {
  title: '', image: '', category: 'Tournaments',
  date: new Date().toISOString().split('T')[0], featured: false, visible: true,
};

export default function AdminGallery({ onRefresh }: { onRefresh?: () => void }) {
  const db = getDB() as any;
  const items: GalleryItem[] = db.gallery ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM & { image: string }>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setMsg('');
    setShowForm(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditId(item.id);
    setForm({ title: item.title, image: item.image, category: item.category, date: item.date, featured: item.featured, visible: item.visible });
    setMsg('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMsg('Title is required.'); return; }
    setSaving(true);
    const db2 = getDB() as any;
    const items2: GalleryItem[] = db2.gallery ?? [];
    if (editId) {
      const idx = items2.findIndex(i => i.id === editId);
      if (idx >= 0) items2[idx] = { ...items2[idx], ...form };
    } else {
      items2.push({ id: generateId(), ...form });
    }
    db2.gallery = items2;
    await saveDB(db2);
    onRefresh?.();
    setMsg(editId ? 'Photo updated.' : 'Photo added.');
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const db2 = getDB() as any;
    db2.gallery = (db2.gallery ?? []).filter((i: GalleryItem) => i.id !== id);
    await saveDB(db2);
    onRefresh?.();
    setDeleteId(null);
  };

  const toggleVisible = async (id: string) => {
    const db2 = getDB() as any;
    const arr: GalleryItem[] = db2.gallery ?? [];
    const idx = arr.findIndex(i => i.id === id);
    if (idx >= 0) arr[idx].visible = !arr[idx].visible;
    db2.gallery = arr;
    await saveDB(db2);
    onRefresh?.();
  };

  const toggleFeatured = async (id: string) => {
    const db2 = getDB() as any;
    const arr: GalleryItem[] = db2.gallery ?? [];
    const idx = arr.findIndex(i => i.id === id);
    if (idx >= 0) arr[idx].featured = !arr[idx].featured;
    db2.gallery = arr;
    await saveDB(db2);
    onRefresh?.();
  };

  const allCats = ['All', ...CATEGORIES];
  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest">📸 GALLERY MANAGER</h2>
          <p className="text-xs text-gray-500 mt-1">{items.length} photos · {items.filter(i => i.featured).length} featured</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}
        >
          + ADD PHOTO
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {allCats.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            style={filterCat === cat
              ? { background: GOLD, color: '#000' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }>
            {cat}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-6 rounded-2xl border border-white/10 bg-white/3 space-y-5">
          <h3 className="font-black text-white text-sm tracking-widest">
            {editId ? '✏️ EDIT PHOTO' : '+ ADD PHOTO'}
          </h3>

          <div className="flex flex-col sm:flex-row gap-6">
            <ImageUpload
              value={form.image}
              onChange={url => setForm(f => ({ ...f, image: url }))}
              label="Photo"
              size="lg"
              shape="square"
              uploadEndpoint="/api/upload"
            />
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Photo title"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <Combobox
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Combobox>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                {([['featured', '⭐ Featured'], ['visible', '👁️ Visible']] as const).map(([key, lbl]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="accent-yellow-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {msg && <p className="text-xs text-yellow-400">{msg}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-black disabled:opacity-60 transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}
            >
              {saving ? 'SAVING…' : editId ? 'UPDATE PHOTO' : 'ADD PHOTO'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 border border-white/10 hover:border-white/20 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-4">📷</p>
          <p className="font-bold">No photos yet</p>
          <p className="text-sm mt-1">Add your first photo using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden border border-white/6 bg-white/2"
              style={item.featured ? { boxShadow: `0 0 12px rgba(212,175,55,0.25)`, borderColor: 'rgba(212,175,55,0.3)' } : {}}
            >
              {/* Image */}
              <div className="aspect-square bg-white/3 relative">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-700">📷</div>
                )}
                {!item.visible && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">HIDDEN</span>
                  </div>
                )}
                {item.featured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black text-black"
                    style={{ background: GOLD }}>⭐ FEATURED</div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-bold text-white text-xs truncate">{item.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.category} · {item.date}</p>
              </div>

              {/* Actions */}
              <div className="px-3 pb-3 flex gap-1.5 flex-wrap">
                <button onClick={() => openEdit(item)}
                  className="flex-1 py-1 rounded-lg text-[10px] font-bold text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/10 transition-all">
                  EDIT
                </button>
                <button onClick={() => toggleFeatured(item.id)}
                  className="flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all"
                  style={{ color: item.featured ? GOLD : 'rgba(255,255,255,0.4)', borderColor: item.featured ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)' }}>
                  {item.featured ? '★ FEAT' : '☆ FEAT'}
                </button>
                <button onClick={() => toggleVisible(item.id)}
                  className="flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all"
                  style={{ color: item.visible ? '#10b981' : 'rgba(233,69,96,0.8)', borderColor: item.visible ? 'rgba(16,185,129,0.25)' : 'rgba(233,69,96,0.25)' }}>
                  {item.visible ? 'SHOW' : 'HIDE'}
                </button>
                {deleteId === item.id ? (
                  <>
                    <button onClick={() => handleDelete(item.id)} className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-red-500/80 text-white border-0">
                      CONFIRM
                    </button>
                    <button onClick={() => setDeleteId(null)} className="flex-1 py-1 rounded-lg text-[10px] font-bold text-gray-400 border border-white/10 transition-all">
                      CANCEL
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteId(item.id)}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold text-red-400/70 border border-red-400/15 hover:bg-red-400/10 transition-all">
                    DELETE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
