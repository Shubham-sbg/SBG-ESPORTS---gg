import { useState } from 'react';
import { Video, getDB, saveDB } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  videos: Video[];
  onRefresh: () => void;
}

type FormState = {
  title: string;
  description: string;
  videoType: 'upload' | 'youtube' | 'instagram';
  url: string;
  embedUrl: string;
  thumbnail: string;
  category: Video['category'];
  visible: boolean;
};

const BLANK_FORM: FormState = {
  title: '',
  description: '',
  videoType: 'youtube',
  url: '',
  embedUrl: '',
  thumbnail: '',
  category: 'highlight',
  visible: true,
};

const CATEGORIES: { value: Video['category']; label: string }[] = [
  { value: 'highlight', label: 'Highlight' },
  { value: 'match', label: 'Match' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'other', label: 'Other' },
];

function toEmbedUrl(url: string, type: 'youtube' | 'instagram'): string {
  if (type === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  }
  if (type === 'instagram') {
    const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (match) return `https://www.instagram.com/p/${match[1]}/embed`;
    return url;
  }
  return url;
}

export default function AdminVideos({ videos, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);

  const openCreate = () => {
    setEditId(null);
    setForm(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (v: Video) => {
    setEditId(v.id);
    setForm({
      title: v.title,
      description: v.description || '',
      videoType: v.videoType || 'youtube',
      url: v.url,
      embedUrl: v.embedUrl || '',
      thumbnail: v.thumbnail || '',
      category: v.category,
      visible: v.visible,
    });
    setShowModal(true);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, thumbnail: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await uploadFileToServer(file, { allowVideo: true });
      setForm(f => ({ ...f, url: result.url }));
    } catch (err: any) {
      console.warn('Server video upload failed, creating object URL:', err);
      setForm(f => ({ ...f, url: URL.createObjectURL(file) }));
    }
  };

  const computedEmbed = form.videoType !== 'upload' ? toEmbedUrl(form.url, form.videoType) : '';

  const saveVideo = async () => {
    const db = getDB();
    if (!db.videos) db.videos = [];
    const embed = form.videoType !== 'upload' ? computedEmbed : '';

    if (editId) {
      const idx = db.videos.findIndex(v => v.id === editId);
      if (idx !== -1) {
        db.videos[idx] = {
          ...db.videos[idx],
          title: form.title,
          description: form.description,
          videoType: form.videoType,
          url: form.url,
          embedUrl: embed || form.embedUrl,
          thumbnail: form.thumbnail,
          category: form.category,
          visible: form.visible,
        };
      }
    } else {
      const maxOrder = db.videos.reduce((m, v) => Math.max(m, v.order || 0), 0);
      const newVideo: Video = {
        id: `vid_${Date.now()}`,
        title: form.title,
        description: form.description,
        videoType: form.videoType,
        url: form.url,
        embedUrl: embed || form.embedUrl,
        thumbnail: form.thumbnail,
        category: form.category,
        visible: form.visible,
        order: maxOrder + 1,
        createdAt: Date.now(),
      };
      db.videos.push(newVideo);
    }
    try {
      await saveDB(db);
      setShowModal(false);
      onRefresh();
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        setShowModal(false);
        onRefresh();
      } else {
        alert(msg || 'Failed to save video.');
      }
    }
  };

  const deleteVideo = (id: string) => {
    if (!confirm('Delete this video?')) return;
    const db = getDB();
    db.videos = (db.videos || []).filter(v => v.id !== id);
    saveDB(db);
    onRefresh();
  };

  const toggleVisible = (id: string) => {
    const db = getDB();
    const v = (db.videos || []).find(v => v.id === id);
    if (v) v.visible = !v.visible;
    saveDB(db);
    onRefresh();
  };

  const sorted = [...(videos || [])].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white">Videos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Upload videos or embed YouTube / Instagram Reels to display on the homepage.</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 transition-colors">
          + Add Video
        </button>
      </div>

      {sorted.length === 0 && (
        <div className="p-10 rounded-xl border border-white/5 bg-white/3 text-center text-gray-500 text-sm">
          No videos added yet. Click <strong className="text-orange-400">+ Add Video</strong> to get started.
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(v => (
          <div key={v.id} className="p-5 rounded-xl border border-white/5 bg-white/3 flex items-center gap-4">
            {v.thumbnail ? (
              <img src={v.thumbnail} alt={v.title} className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-white/5" />
            ) : (
              <div className="w-20 h-14 rounded-lg bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">▶</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{v.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 font-semibold">{v.category}</span>
                <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-400">{v.videoType || 'youtube'}</span>
                <span className="text-xs text-gray-600">{new Date(v.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleVisible(v.id)}
                className={`relative w-12 h-6 rounded-full transition-all ${v.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${v.visible ? 'left-7' : 'left-1'}`} />
              </button>
              <button onClick={() => openEdit(v)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20">
                Edit
              </button>
              <button onClick={() => deleteVideo(v.id)}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/40">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">{editId ? 'Edit Video' : 'Add Video'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Video Title *</label>
                <input className="inp" placeholder="Enter video title" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="inp min-h-[70px]" placeholder="Short description (optional)" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Video Type</label>
                  <Combobox className="inp" value={form.videoType}
                    onChange={e => setForm(f => ({ ...f, videoType: e.target.value as FormState['videoType'], url: '' }))}>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram Reel</option>
                    <option value="upload">Upload Video File</option>
                  </Combobox>
                </div>
                <div>
                  <label className="label">Category</label>
                  <Combobox className="inp" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as Video['category'] }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Combobox>
                </div>
              </div>

              {form.videoType === 'upload' ? (
                <div>
                  <label className="label">Upload Video File</label>
                  <label className="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-gray-300 text-sm">{form.url ? '✓ Video selected' : 'Choose video file'}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                  {form.url && (
                    <video src={form.url} className="mt-2 w-full rounded-lg max-h-40 object-cover" controls />
                  )}
                </div>
              ) : (
                <div>
                  <label className="label">
                    {form.videoType === 'youtube' ? 'YouTube URL' : 'Instagram Reel URL'}
                  </label>
                  <input className="inp" placeholder={form.videoType === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://www.instagram.com/reel/...'} value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                  {computedEmbed && (
                    <p className="text-xs text-green-400 mt-1">Embed URL: {computedEmbed}</p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Thumbnail Image</label>
                <div className="flex items-center gap-4">
                  {form.thumbnail && (
                    <img src={form.thumbnail} alt="Thumbnail" className="h-16 rounded-lg object-cover border border-white/10" />
                  )}
                  <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">
                    {form.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                  </label>
                  {form.thumbnail && (
                    <button onClick={() => setForm(f => ({ ...f, thumbnail: '' }))}
                      className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Visible on Website</p>
                  <p className="text-xs text-gray-500 mt-0.5">Show this video in the homepage Videos section</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))}
                  className={`relative w-12 h-6 rounded-full transition-all ${form.visible ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={saveVideo}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 transition-colors">
                {editId ? 'Save Changes' : 'Add Video'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
