import { useState, useEffect } from 'react';
import { Settings, ExternalLink, getDB, saveDB } from '@/lib/database';

interface Props {
  settings: Settings;
  onRefresh: () => void;
}

const GOLD = '#d4af37';

export default function AdminExternalLinks({ settings, onRefresh }: Props) {
  const [visible, setVisible] = useState<boolean>(settings.externalLinksVisible !== false);
  const [links, setLinks] = useState<ExternalLink[]>(
    Array.isArray(settings.externalLinks) ? [...settings.externalLinks] : []
  );

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    enabled: true,
  });

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setVisible(settings.externalLinksVisible !== false);
    if (Array.isArray(settings.externalLinks)) {
      setLinks([...settings.externalLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }
  }, [settings]);

  const handleSaveAll = async () => {
    setSaveState('saving');
    setSaveMessage('');
    try {
      const db = getDB();
      const updatedLinks = links.map((link, index) => ({
        ...link,
        order: index,
      }));

      db.settings = {
        ...db.settings,
        externalLinksVisible: visible,
        externalLinks: updatedLinks,
      };

      await saveDB(db, 'settings');
      onRefresh();
      setSaveState('saved');
      setSaveMessage('External links updated successfully!');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (err: any) {
      console.error('Error saving external links:', err);
      setSaveState('error');
      setSaveMessage(err?.message || 'Failed to save external links.');
    }
  };

  const handleAddLink = () => {
    if (!formData.name.trim() || !formData.url.trim()) return;

    let cleanUrl = formData.url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const newLink: ExternalLink = {
      id: `ext_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formData.name.trim(),
      url: cleanUrl,
      enabled: formData.enabled,
      order: links.length,
    };

    setLinks(prev => [...prev, newLink]);
    setFormData({ name: '', url: '', enabled: true });
    setAdding(false);
  };

  const handleUpdateLink = (id: string, updates: Partial<ExternalLink>) => {
    setLinks(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleDeleteLink = (id: string) => {
    if (confirm('Are you sure you want to delete this external link?')) {
      setLinks(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const newLinks = [...links];
    const [moved] = newLinks.splice(index, 1);
    newLinks.splice(targetIndex, 0, moved);

    // Reassign order
    const ordered = newLinks.map((item, idx) => ({ ...item, order: idx }));
    setLinks(ordered);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white/3 border border-white/8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🌐</span>
            <h2 className="font-black text-lg text-white tracking-wide">External Website Links</h2>
          </div>
          <p className="text-xs text-gray-400">
            Manage partner links and external websites shown in the mobile & header marquee bar.
          </p>
        </div>

        {/* Global Visible/Hidden Toggle */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 flex-shrink-0">
          <span className="text-xs font-bold text-gray-300">
            Header Marquee:
          </span>
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
              visible
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {visible ? '👁️ VISIBLE' : '🙈 HIDDEN'}
          </button>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          className="px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase text-black flex items-center gap-2 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}
        >
          {adding ? '✕ Cancel' : '➕ Add External Link'}
        </button>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saveState === 'saving'}
          className="px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase bg-emerald-500 hover:bg-emerald-400 text-black transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          {saveState === 'saving' ? '💾 Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            saveState === 'saved'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <span>{saveState === 'saved' ? '✅' : '⚠️'}</span>
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Add New Link Form */}
      {adding && (
        <div className="p-5 rounded-2xl border border-gold/30 bg-gold/5 space-y-4">
          <h3 className="text-xs font-black tracking-widest text-gold uppercase">Add New Link</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. SBG Shop"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                Target URL *
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="e.g. https://shop.example.com"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-gold outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded bg-black border-white/20 text-gold focus:ring-gold"
              />
              Enable link immediately
            </label>

            <button
              type="button"
              onClick={handleAddLink}
              disabled={!formData.name.trim() || !formData.url.trim()}
              className="px-5 py-2 rounded-xl bg-gold text-black text-xs font-black uppercase tracking-wider hover:bg-gold/90 disabled:opacity-40"
            >
              Add Link
            </button>
          </div>
        </div>
      )}

      {/* Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/2 border border-white/5 text-gray-500 text-xs">
            No external links added yet. Click "+ Add External Link" above to create one.
          </div>
        ) : (
          links.map((link, idx) => (
            <div
              key={link.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                link.enabled
                  ? 'bg-white/3 border-white/10'
                  : 'bg-white/1 border-white/5 opacity-60'
              }`}
            >
              {/* Left Order & Details */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-black/60 border border-white/10 text-[10px] font-bold text-gray-400 flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>

                {editingId === link.id ? (
                  <div className="grid sm:grid-cols-2 gap-2 flex-1">
                    <input
                      type="text"
                      value={link.name}
                      onChange={e => handleUpdateLink(link.id, { name: e.target.value })}
                      className="px-3 py-1.5 rounded-lg bg-black border border-gold/40 text-white text-xs"
                      placeholder="Display Name"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={e => handleUpdateLink(link.id, { url: e.target.value })}
                      className="px-3 py-1.5 rounded-lg bg-black border border-gold/40 text-white text-xs"
                      placeholder="Target URL"
                    />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {link.name}
                      </span>
                      {!link.enabled && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-gray-800 text-gray-400">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-gray-500 hover:text-gold truncate block hover:underline"
                    >
                      {link.url}
                    </a>
                  </div>
                )}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                {/* Reorder Buttons */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 disabled:opacity-20"
                  title="Move Up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={idx === links.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 disabled:opacity-20"
                  title="Move Down"
                >
                  ▼
                </button>

                {/* Enable/Disable Toggle */}
                <button
                  type="button"
                  onClick={() => handleUpdateLink(link.id, { enabled: !link.enabled })}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    link.enabled
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800 text-gray-400 border border-white/5'
                  }`}
                >
                  {link.enabled ? 'Enabled' : 'Disabled'}
                </button>

                {/* Edit Toggle */}
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === link.id ? null : link.id)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300"
                >
                  {editingId === link.id ? 'Done' : 'Edit'}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteLink(link.id)}
                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
