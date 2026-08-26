import ImageUpload from '@/components/shared/ImageUpload';
import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import { Post, getDB, saveCollection } from '@/lib/database';

interface Props {
  posts: Post[];
  onRefresh: () => void;
}

const DEFAULT_CATEGORIES = ['Achievement', 'Announcement', 'Sponsor', 'Match Recap', 'Update', 'Event', 'Tournament', 'Other'];

const empty = (): Omit<Post, 'id'> => ({
  title: '', description: '', thumbnail: '', category: 'Announcement',
  date: new Date().toISOString().split('T')[0], visible: true,
});

export default function AdminNews({ posts, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(empty());

  const save = () => {
    const db = getDB();
    if (adding) {
      db.posts.push({ ...form, id: `n${Date.now()}` });
    } else if (editing) {
      const idx = (db.posts || []).findIndex(p => p.id === editing.id);
      if (idx !== -1) db.posts[idx] = { ...editing, ...form };
    }
    saveCollection('posts', db.posts);
    onRefresh();
    setAdding(false);
    setEditing(null);
    setForm(empty());
  };

  const del = (id: string) => {
    const db = getDB();
    db.posts = (db.posts || []).filter(p => p.id !== id);
    saveCollection('posts', db.posts);
    onRefresh();
  };

  const toggleVisible = (id: string) => {
    const db = getDB();
    const p = (db.posts || []).find(p => p.id === id);
    if (p) p.visible = !p.visible;
    saveCollection('posts', db.posts);
    onRefresh();
  };

  

  if (adding || editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setAdding(false); setEditing(null); setForm(empty()); }} className="text-gray-400 hover:text-white">← Back</button>
          <h2 className="font-black text-xl text-white">{adding ? 'Add Post' : 'Edit Post'}</h2>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/3 space-y-5">
          <div>
            <label className="label">Thumbnail</label>
            <ImageUpload imageUrl={form.thumbnail} onImageChange={url => setForm(f => ({ ...f, thumbnail: url }))} label="" size="lg" shape="square" showRatioControls={true} />
          </div>
          <div><label className="label">Title</label><input className="inp" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div>
            <label className="label">Description</label>
            <textarea className="inp min-h-[100px] resize-y" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category <span className="text-gray-600 text-xs normal-case">(type or select)</span></label>
              <input
                className="inp"
                list="news-categories-list"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Achievement, Sponsor..."
              />
              <datalist id="news-categories-list">
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div><label className="label">Date</label><input type="date" className="inp" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))}
              className={`relative w-12 h-6 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-400">Visible on website</span>
          </div>
          <button onClick={save} className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400">
            {adding ? 'ADD POST' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-xl text-white">News Posts ({(posts || []).length})</h2>
        <button onClick={() => { setAdding(true); setForm(empty()); }}
          className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">
          + Add Post
        </button>
      </div>
      <div className="space-y-3">
        {(posts || []).map(p => (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
            <div className="w-16 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
              {p.thumbnail ? <Image src={p.thumbnail} alt="" objectFit="cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">📰</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{p.title}</p>
              <p className="text-xs text-gray-500">{p.category} · {p.date}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => toggleVisible(p.id)}
                className={`relative w-10 h-5 rounded-full transition-all ${p.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${p.visible ? 'left-5' : 'left-0.5'}`} />
              </button>
              <button onClick={() => { setEditing(p); setForm({ title: p.title, description: p.description, thumbnail: p.thumbnail, category: p.category, date: p.date, visible: p.visible }); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Edit</button>
              <button onClick={() => { if (confirm('Delete post?')) del(p.id); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        ))}
        {(posts || []).length === 0 && <div className="text-center py-12 text-gray-600">No posts yet.</div>}
      </div>
    </div>
  );
}
