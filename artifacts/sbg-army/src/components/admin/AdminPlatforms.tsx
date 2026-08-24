/**
 * AdminPlatforms — Manage "Explore Our Other Platforms" section on SBG ARMY homepage.
 * Admin can enable/disable, reorder, edit title/description/image/URL for each platform card.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveCollection } from '@/lib/database';
import { getAdminToken } from '@/lib/auth';
import { apiUrl } from '@/lib/api';

const GOLD = '#d4af37';

export interface PlatformCard {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  badge: string;
  url: string;
  color: string;
  visible: boolean;
  order: number;
}

export interface PlatformsConfig {
  enabled: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  platforms: PlatformCard[];
}

const DEFAULT_CONFIG: PlatformsConfig = {
  enabled: true,
  sectionTitle: 'Explore Our Other Platforms',
  sectionSubtitle: 'Part of the SBG ecosystem — built for every level of competitive play.',
  platforms: [
    {
      id: 'sbg-pro',
      name: 'SBG PRO',
      tagline: 'Enterprise Esports Platform',
      description: 'Advanced roster management, detailed analytics, premium tournament tools, and enterprise-grade features for serious organizations.',
      image: '',
      badge: 'ENTERPRISE',
      url: '/sbg-pro/',
      color: '#ff6b00',
      visible: true,
      order: 1,
    },
  ],
};

interface Props { onRefresh: () => void }

export default function AdminPlatforms({ onRefresh }: Props) {
  const [config, setConfig] = useState<PlatformsConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PlatformCard | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Partial<PlatformCard>>({
    name: '', tagline: '', description: '', image: '', badge: '', url: '', color: '#ff6b00', visible: true,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const r = await fetch(apiUrl('/api/db/platforms'), { credentials: "include", cache: 'no-store' });
      const data = await r.json();
      if (data && typeof data === 'object' && !Array.isArray(data) && 'platforms' in data) {
        setConfig({ ...DEFAULT_CONFIG, ...data });
      } else if (Array.isArray(data) && data.length === 0) {
        setConfig(DEFAULT_CONFIG);
      }
    } catch {}
  };

  const save = async (updated: PlatformsConfig) => {
    setSaving(true);
    try {
      const token = getAdminToken();
      await fetch(apiUrl('/api/db/platforms'), { credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated),
      });
      saveCollection('platforms', updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch {}
    setSaving(false);
  };

  const updateConfig = (patch: Partial<PlatformsConfig>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    save(updated);
  };

  const updatePlatform = (id: string, patch: Partial<PlatformCard>) => {
    const platforms = config.platforms.map(p => p.id === id ? { ...p, ...patch } : p);
    updateConfig({ platforms });
  };

  const deletePlatform = (id: string) => {
    const platforms = config.platforms.filter(p => p.id !== id);
    updateConfig({ platforms });
  };

  const addPlatform = () => {
    if (!addForm.name || !addForm.url) return;
    const newP: PlatformCard = {
      id: `platform_${Date.now()}`,
      name: addForm.name || 'New Platform',
      tagline: addForm.tagline || '',
      description: addForm.description || '',
      image: addForm.image || '',
      badge: addForm.badge || '',
      url: addForm.url || '/',
      color: addForm.color || '#ff6b00',
      visible: addForm.visible !== false,
      order: config.platforms.length + 1,
    };
    const platforms = [...config.platforms, newP];
    updateConfig({ platforms });
    setShowAdd(false);
    setAddForm({ name: '', tagline: '', description: '', image: '', badge: '', url: '', color: '#ff6b00', visible: true });
  };

  const moveUp = (id: string) => {
    const idx = config.platforms.findIndex(p => p.id === id);
    if (idx <= 0) return;
    const platforms = [...config.platforms];
    [platforms[idx - 1], platforms[idx]] = [platforms[idx], platforms[idx - 1]];
    updateConfig({ platforms: platforms.map((p, i) => ({ ...p, order: i + 1 })) });
  };

  const moveDown = (id: string) => {
    const idx = config.platforms.findIndex(p => p.id === id);
    if (idx < 0 || idx >= config.platforms.length - 1) return;
    const platforms = [...config.platforms];
    [platforms[idx], platforms[idx + 1]] = [platforms[idx + 1], platforms[idx]];
    updateConfig({ platforms: platforms.map((p, i) => ({ ...p, order: i + 1 })) });
  };

  const startEdit = (p: PlatformCard) => {
    setEditing(p.id);
    setEditForm({ ...p });
  };

  const saveEdit = () => {
    if (!editForm) return;
    updatePlatform(editForm.id, editForm);
    setEditing(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl text-white tracking-widest">🔗 PLATFORM LINKS</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage "Explore Our Other Platforms" section on the homepage</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-black text-green-400 flex items-center gap-1.5">
              ✅ SAVED
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold">Section:</span>
            <button
              onClick={() => updateConfig({ enabled: !config.enabled })}
              className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
              style={{ background: config.enabled ? '#10b981' : 'rgba(255,255,255,0.1)' }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: config.enabled ? '22px' : '2px' }} />
            </button>
            <span className={`text-xs font-black ${config.enabled ? 'text-green-400' : 'text-gray-600'}`}>
              {config.enabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* Section Text */}
      <div className="p-5 rounded-2xl border border-white/8 bg-white/2 space-y-4">
        <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">SECTION TEXT</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5" style={{ color: 'rgba(212,175,55,0.6)' }}>
              Section Title
            </label>
            <input
              type="text" value={config.sectionTitle}
              onChange={e => setConfig(c => ({ ...c, sectionTitle: e.target.value }))}
              onBlur={() => save(config)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40"
              placeholder="Explore Our Other Platforms"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest uppercase mb-1.5" style={{ color: 'rgba(212,175,55,0.6)' }}>
              Section Subtitle
            </label>
            <input
              type="text" value={config.sectionSubtitle}
              onChange={e => setConfig(c => ({ ...c, sectionSubtitle: e.target.value }))}
              onBlur={() => save(config)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-gold/40"
              placeholder="Part of the SBG ecosystem"
            />
          </div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">PLATFORMS ({config.platforms.length})</h3>
          <button onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-black text-black transition-all"
            style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
            + ADD PLATFORM
          </button>
        </div>

        <AnimatePresence>
          {config.platforms.map((p, idx) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: p.visible ? `${p.color}25` : 'rgba(255,255,255,0.06)', background: `${p.color}05` }}>

              {editing === p.id && editForm ? (
                /* Edit mode */
                <div className="p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { key: 'name', label: 'Platform Name', type: 'text' },
                      { key: 'tagline', label: 'Tagline', type: 'text' },
                      { key: 'url', label: 'Destination URL', type: 'text' },
                      { key: 'badge', label: 'Badge Text (e.g. ENTERPRISE)', type: 'text' },
                      { key: 'color', label: 'Theme Color (hex)', type: 'text' },
                      { key: 'image', label: 'Image URL (logo/banner)', type: 'text' },
                    ].map(({ key, label, type }) => (
                      <div key={key}>
                        <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                          style={{ color: 'rgba(212,175,55,0.6)' }}>{label}</label>
                        <input type={type} value={(editForm as any)[key]}
                          onChange={e => setEditForm(f => f ? { ...f, [key]: e.target.value } : f)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-gold/40" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                      style={{ color: 'rgba(212,175,55,0.6)' }}>Description</label>
                    <textarea value={editForm.description}
                      onChange={e => setEditForm(f => f ? { ...f, description: e.target.value } : f)}
                      rows={2}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-gold/40 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit}
                      className="px-4 py-2 rounded-lg text-xs font-black text-black"
                      style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
                      ✓ Save Changes
                    </button>
                    <button onClick={() => { setEditing(null); setEditForm(null); }}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 border border-white/10 hover:text-white">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="p-4 flex items-center gap-4">
                  {/* Color swatch */}
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm text-black"
                    style={{ background: p.color }}>
                    {p.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{p.name}</span>
                      {p.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                          style={{ background: `${p.color}25`, color: p.color }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{p.tagline}</p>
                    <p className="text-[10px] text-gray-700 font-mono mt-0.5">{p.url}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Visibility toggle */}
                    <button onClick={() => updatePlatform(p.id, { visible: !p.visible })}
                      className="p-1.5 rounded-lg text-xs border transition-all"
                      style={{ borderColor: 'rgba(255,255,255,0.08)', color: p.visible ? '#10b981' : '#6b7280' }}
                      title={p.visible ? 'Visible' : 'Hidden'}>
                      {p.visible ? '👁' : '👁‍🗨'}
                    </button>
                    {/* Reorder */}
                    <button onClick={() => moveUp(p.id)} disabled={idx === 0}
                      className="p-1.5 rounded-lg text-xs border border-white/8 text-gray-500 hover:text-white disabled:opacity-30">
                      ↑
                    </button>
                    <button onClick={() => moveDown(p.id)} disabled={idx === config.platforms.length - 1}
                      className="p-1.5 rounded-lg text-xs border border-white/8 text-gray-500 hover:text-white disabled:opacity-30">
                      ↓
                    </button>
                    {/* Edit */}
                    <button onClick={() => startEdit(p)}
                      className="p-1.5 rounded-lg text-xs border border-white/8 text-gray-500 hover:text-white">
                      ✏
                    </button>
                    {/* Delete */}
                    <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) deletePlatform(p.id); }}
                      className="p-1.5 rounded-lg text-xs border border-red-500/20 text-red-400/50 hover:text-red-400">
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {config.platforms.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-3xl mb-3">🔗</p>
            <p className="text-sm font-bold">No platforms added yet</p>
            <p className="text-xs mt-1">Click "Add Platform" to create the first card</p>
          </div>
        )}
      </div>

      {/* Add Platform Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white tracking-widest uppercase">Add New Platform</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'name', label: 'Platform Name *', placeholder: 'SBG PRO' },
                  { key: 'tagline', label: 'Tagline', placeholder: 'Enterprise Platform' },
                  { key: 'url', label: 'URL *', placeholder: 'https://...' },
                  { key: 'badge', label: 'Badge', placeholder: 'ENTERPRISE' },
                  { key: 'color', label: 'Theme Color', placeholder: '#ff6b00' },
                  { key: 'image', label: 'Image URL', placeholder: 'https://...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                      style={{ color: 'rgba(212,175,55,0.6)' }}>{label}</label>
                    <input type="text" value={(addForm as any)[key] || ''}
                      onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-gold/40" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase mb-1"
                  style={{ color: 'rgba(212,175,55,0.6)' }}>Description</label>
                <textarea rows={2} value={addForm.description || ''}
                  onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-gold/40 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={addPlatform} disabled={!addForm.name || !addForm.url}
                  className="px-4 py-2.5 rounded-lg text-xs font-black text-black disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
                  + ADD PLATFORM
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-400 border border-white/10">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
