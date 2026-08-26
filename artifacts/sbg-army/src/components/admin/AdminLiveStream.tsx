import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { LiveStream } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';
const PLATFORMS: { value: LiveStream['platform']; label: string; color: string }[] = [
  { value: 'youtube', label: '▶ YouTube', color: '#ff0000' },
  { value: 'twitch', label: '🟣 Twitch', color: '#9147ff' },
  { value: 'facebook', label: '🔵 Facebook', color: '#1877f2' },
  { value: 'other', label: '📡 Other', color: '#6b7280' },
];
const STATUSES: { value: LiveStream['status']; label: string; color: string }[] = [
  { value: 'live', label: '🔴 LIVE NOW', color: '#ef4444' },
  { value: 'scheduled', label: '🗓 Scheduled', color: '#eab308' },
  { value: 'ended', label: '⏹ Ended', color: '#6b7280' },
];
const GAMES = ['Free Fire', 'BGMI', 'Valorant', 'COD Mobile', 'Other'];

const EMPTY: Omit<LiveStream, 'id' | 'createdAt'> = {
  title: '', platform: 'youtube', streamUrl: '', thumbnail: '',
  status: 'scheduled', scheduledAt: '', description: '', game: '', visible: true,
};

interface Props { onRefresh: () => void; }

export default function AdminLiveStream({ onRefresh }: Props) {
  const db = getDB();
  const items: LiveStream[] = (db as any).livestreams ?? [];

  const [editing, setEditing] = useState<LiveStream | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<LiveStream, 'id' | 'createdAt'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => {
    const order = { live: 0, scheduled: 1, ended: 2 };
    return (order[a.status] - order[b.status]) || (b.createdAt - a.createdAt);
  });

  const liveCount = items.filter(s => s.status === 'live').length;
  const scheduledCount = items.filter(s => s.status === 'scheduled').length;

  const openNew = () => { setForm({ ...EMPTY }); setIsNew(true); setEditing(null); };
  const openEdit = (s: LiveStream) => {
    setForm({
      title: s.title, platform: s.platform, streamUrl: s.streamUrl,
      thumbnail: s.thumbnail ?? '', status: s.status, scheduledAt: s.scheduledAt ?? '',
      description: s.description ?? '', game: s.game ?? '', visible: s.visible,
    });
    setEditing(s); setIsNew(false);
  };
  const closeForm = () => { setEditing(null); setIsNew(false); };
  const F = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.streamUrl.trim()) return;
    setSaving(true);
    try {
      const cur = getDB();
      const list: LiveStream[] = [...((cur as any).livestreams ?? [])];
      if (isNew) {
        list.push({ ...form, id: `ls_${Date.now()}`, createdAt: Date.now() });
      } else if (editing) {
        const i = list.findIndex(x => x.id === editing.id);
        if (i !== -1) list[i] = { ...editing, ...form };
      }
      await saveDB({ ...cur, livestreams: list } as any);
      setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000);
      closeForm(); onRefresh();
    } catch {
      setSaveState('error'); setTimeout(() => setSaveState('idle'), 2000);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const cur = getDB();
    await saveDB({ ...cur, livestreams: ((cur as any).livestreams ?? []).filter((x: LiveStream) => x.id !== id) } as any);
    setDeleting(null); onRefresh();
  };

  const setStatus = async (s: LiveStream, status: LiveStream['status']) => {
    const cur = getDB();
    await saveDB({ ...cur, livestreams: ((cur as any).livestreams ?? []).map((x: LiveStream) => x.id === s.id ? { ...x, status } : x) } as any);
    onRefresh();
  };

  const platformMeta = (p: LiveStream['platform']) => PLATFORMS.find(x => x.value === p)!;
  const statusMeta = (s: LiveStream['status']) => STATUSES.find(x => x.value === s)!;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white tracking-widest">🔴 LIVE STREAM</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage live streams and scheduled broadcasts</p>
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'saved' && <span className="text-xs font-black text-green-400">✅ SAVED</span>}
          {saveState === 'error' && <span className="text-xs font-black text-red-400">❌ ERROR</span>}
          <button onClick={openNew} className="px-4 py-2 rounded-lg text-xs font-black text-black"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
            + ADD STREAM
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="grid grid-cols-3 gap-3">
        {[['Total', items.length, GOLD], ['Live Now', liveCount, '#ef4444'], ['Scheduled', scheduledCount, '#eab308']].map(([l, v, c]) => (
          <div key={l as string} className="p-3 rounded-xl border text-center"
            style={{ borderColor: `${c}30`, background: `${c}08` }}>
            <div className="text-2xl font-black" style={{ color: c as string }}>{v as number}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{l as string}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {(isNew || editing) && (
        <div className="p-5 rounded-2xl border border-white/10 bg-white/3 space-y-4">
          <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">
            {isNew ? '➕ New Stream' : `✏ Edit — ${editing?.title}`}
          </h3>

          {/* Platform selector */}
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-2"
              style={{ color: 'rgba(212,175,55,0.6)' }}>Platform</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p.value} onClick={() => F('platform', p.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: form.platform === p.value ? `${p.color}20` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${form.platform === p.value ? p.color : 'rgba(255,255,255,0.08)'}`,
                    color: form.platform === p.value ? p.color : '#6b7280',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-2"
              style={{ color: 'rgba(212,175,55,0.6)' }}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => F('status', s.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: form.status === s.value ? `${s.color}20` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${form.status === s.value ? s.color : 'rgba(255,255,255,0.08)'}`,
                    color: form.status === s.value ? s.color : '#6b7280',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {([
              ['title', 'Stream Title *', 'e.g. ${ADMIN_BRAND_NAME} vs Team X — PMPL'],
              ['streamUrl', 'Stream URL *', 'https://youtube.com/watch?v=...'],
              ['thumbnail', 'Thumbnail URL', 'https://...'],
              ['scheduledAt', 'Scheduled At', null, 'datetime-local'],
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
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
              style={{ color: 'rgba(212,175,55,0.6)' }}>Description</label>
            <textarea value={form.description} onChange={e => F('description', e.target.value)} rows={2}
              placeholder="Stream description or match context..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none resize-none" />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.visible} onChange={e => F('visible', e.target.checked)}
                className="w-4 h-4 accent-yellow-500" />
              Visible on website
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-black text-black disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}>
              {saving ? 'SAVING…' : isNew ? '+ CREATE' : '✓ SAVE'}
            </button>
            <button onClick={closeForm}
              className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 border border-white/10 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-sm font-bold">No streams yet</p>
            <p className="text-xs mt-1">Add your first live stream or schedule a broadcast</p>
          </div>
        )}
        {sorted.map(s => {
          const pm = platformMeta(s.platform);
          const sm = statusMeta(s.status);
          return (
            <div key={s.id} className="flex items-start gap-3 p-4 rounded-2xl border transition-all"
              style={{ borderColor: `${sm.color}25`, background: `${sm.color}05` }}>
              {s.thumbnail && (
                <Image src={s.thumbnail} alt={s.title}
                  objectFit="cover"
                  className="w-16 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-black text-white truncate">{s.title}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{ background: `${sm.color}20`, color: sm.color }}>{sm.label}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${pm.color}15`, color: pm.color }}>{pm.label}</span>
                </div>
                {s.game && <span className="text-[10px] text-gray-500">{s.game}</span>}
                {s.scheduledAt && s.status === 'scheduled' && (
                  <p className="text-xs text-yellow-400/70 mt-0.5">📅 {new Date(s.scheduledAt).toLocaleString()}</p>
                )}
                {s.streamUrl && (
                  <a href={s.streamUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-blue-400/60 hover:text-blue-400 truncate block mt-0.5">
                    🔗 {s.streamUrl.length > 50 ? s.streamUrl.slice(0, 50) + '…' : s.streamUrl}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Quick status change */}
                {s.status !== 'live' && (
                  <button onClick={() => setStatus(s, 'live')}
                    className="px-2 py-1 rounded-lg text-[9px] font-black border border-red-500/30 text-red-400/60 hover:text-red-400 hover:border-red-500">GO LIVE</button>
                )}
                {s.status === 'live' && (
                  <button onClick={() => setStatus(s, 'ended')}
                    className="px-2 py-1 rounded-lg text-[9px] font-black border border-gray-500/30 text-gray-400/60 hover:text-gray-400">END</button>
                )}
                <button onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg border border-white/8 text-xs text-gray-400 hover:text-white">✏</button>
                {deleting === s.id
                  ? <div className="flex gap-1">
                      <button onClick={() => handleDelete(s.id)} className="px-2 py-1 rounded-lg text-[10px] font-black text-white bg-red-500/80">DEL</button>
                      <button onClick={() => setDeleting(null)} className="px-2 py-1 rounded-lg text-[10px] text-gray-500 border border-white/10">No</button>
                    </div>
                  : <button onClick={() => setDeleting(s.id)} className="p-1.5 rounded-lg border border-red-500/20 text-red-400/50 hover:text-red-400 text-xs">🗑</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
