import { useState } from 'react';
import { getDB, saveCollection, type CtaItem, type Settings } from '@/lib/database';

interface Props {
  onRefresh: () => void;
}

const GOLD = '#d4af37';

function isValidExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:') || trimmed.toLowerCase().startsWith('vbscript:')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function AdminCtaManager({ onRefresh }: Props) {
  const db = getDB();
  const [globalEnabled, setGlobalEnabled] = useState<boolean>(db.settings?.ctaEnabled ?? true);
  const [ctas, setCtas] = useState<CtaItem[]>(db.ctas || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [url, setUrl] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [order, setOrder] = useState<number>(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleToggleGlobal = async () => {
    const next = !globalEnabled;
    setGlobalEnabled(next);
    try {
      const currentDb = getDB();
      currentDb.settings = { ...currentDb.settings, ctaEnabled: next } as Settings;
      await saveCollection('settings', currentDb.settings);
      setSuccess(next ? 'Global CTA system enabled.' : 'Global CTA system disabled.');
      setTimeout(() => setSuccess(null), 3000);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to update global CTA setting.');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setButtonText('');
    setUrl('https://');
    setEnabled(true);
    setOpenInNewTab(true);
    setOrder(ctas.length);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CtaItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setButtonText(item.buttonText);
    setUrl(item.url);
    setEnabled(item.enabled);
    setOpenInNewTab(item.openInNewTab);
    setOrder(item.order ?? 0);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedButton = buttonText.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle || !trimmedButton || !trimmedUrl) {
      setError('Title, button text, and destination URL are required.');
      return;
    }

    if (!isValidExternalUrl(trimmedUrl)) {
      setError('Invalid URL. Please enter a valid http:// or https:// URL (javascript: URLs are blocked).');
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      let updated: CtaItem[];

      if (editingId) {
        updated = ctas.map(c => c.id === editingId ? {
          ...c,
          title: trimmedTitle,
          buttonText: trimmedButton,
          url: trimmedUrl,
          enabled,
          openInNewTab,
          order: Number(order),
          updatedAt: now,
        } : c);
      } else {
        const newItem: CtaItem = {
          id: `cta_${now}_${Math.random().toString(36).substring(2, 7)}`,
          title: trimmedTitle,
          buttonText: trimmedButton,
          url: trimmedUrl,
          enabled,
          openInNewTab,
          order: Number(order),
          createdAt: now,
          updatedAt: now,
        };
        updated = [...ctas, newItem];
      }

      // Sort by order
      updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      await saveCollection('ctas', updated);
      setCtas(updated);
      setIsModalOpen(false);
      setSuccess(editingId ? 'CTA updated successfully!' : 'CTA created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save CTA.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updated = ctas.filter(c => c.id !== id);
      await saveCollection('ctas', updated);
      setCtas(updated);
      setDeleteConfirmId(null);
      setSuccess('CTA deleted successfully.');
      setTimeout(() => setSuccess(null), 3000);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete CTA.');
    }
  };

  const handleToggleItem = async (item: CtaItem) => {
    try {
      const updated = ctas.map(c => c.id === item.id ? { ...c, enabled: !c.enabled, updatedAt: Date.now() } : c);
      await saveCollection('ctas', updated);
      setCtas(updated);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle CTA status.');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ctas.length) return;
    const copy = [...ctas];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    // reassign order numbers
    const reordered = copy.map((c, i) => ({ ...c, order: i }));
    try {
      await saveCollection('ctas', reordered);
      setCtas(reordered);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder CTAs.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header & Master Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-3">
            <span>🎯</span> CTA Manager
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage dynamic Call-To-Action cards displayed directly below the main hero tagline on the public homepage.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Global CTA System</span>
            <button
              onClick={handleToggleGlobal}
              className={`relative w-12 h-6 rounded-full transition-all ${globalEnabled ? 'bg-yellow-500 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-gray-700'}`}
              aria-label="Toggle global CTA system"
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${globalEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}
          >
            <span>+ Create CTA</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {success && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-bold tracking-wide flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}
      {error && !isModalOpen && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold tracking-wide flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* CTA List Table */}
      <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden backdrop-blur-md">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white tracking-wider uppercase">Active & Configured CTAs ({ctas.length})</h3>
          <span className="text-xs text-gray-500">Ordered by display priority</span>
        </div>
        {ctas.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <p className="text-3xl">📭</p>
            <p className="text-sm font-bold text-gray-400">No CTAs created yet.</p>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">Create your first Call-To-Action card to display actionable external links directly on the homepage hero.</p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-bold text-black uppercase tracking-wider"
              style={{ background: GOLD }}
            >
              Create First CTA
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase tracking-widest font-mono text-[10px]">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Title & Button</th>
                  <th className="py-3 px-4">Destination URL</th>
                  <th className="py-3 px-4 text-center">New Tab</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ctas.map((item, index) => (
                  <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                    <td className="py-4 px-4 font-mono font-bold text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span>#{item.order ?? index}</span>
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleMoveOrder(index, 'up')} disabled={index === 0} className="hover:text-gold disabled:opacity-30 text-[9px]">▲</button>
                          <button onClick={() => handleMoveOrder(index, 'down')} disabled={index === ctas.length - 1} className="hover:text-gold disabled:opacity-30 text-[9px]">▼</button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">{item.title}</div>
                      <div className="text-[11px] text-yellow-500/90 font-mono mt-0.5">Button: [{item.buttonText}]</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-gray-400 max-w-xs truncate">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold underline underline-offset-2">
                        {item.url}
                      </a>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.openInNewTab ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800 text-gray-400'}`}>
                        {item.openInNewTab ? 'New Tab' : 'Same Tab'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleItem(item)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${item.enabled ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
                      >
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === item.id ? (
                        <span className="inline-flex items-center gap-1">
                          <button onClick={() => handleDelete(item.id)} className="px-2 py-1 rounded bg-red-600 text-white font-bold text-[10px]">Confirm</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded bg-gray-700 text-gray-300 font-bold text-[10px]">Cancel</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-[#0c0c14] p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white">{editingId ? 'Edit CTA Card' : 'Create New CTA Card'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">CTA Title / Description</label>
                <input
                  type="text"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Visit SBG Gaming Portal"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Button Text</label>
                  <input
                    type="text"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="e.g., Visit Website"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 font-mono"
                    value={order}
                    onChange={e => setOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Destination URL (http:// or https://)</label>
                <input
                  type="url"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 font-mono"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">Must start with http:// or https://. javascript: and data: schemes are strictly rejected.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 accent-yellow-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">Enable CTA</span>
                    <span className="block text-[10px] text-gray-400">Show on public homepage</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openInNewTab}
                    onChange={e => setOpenInNewTab(e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 accent-yellow-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">Open in New Tab</span>
                    <span className="block text-[10px] text-gray-400">Adds target="_blank"</span>
                  </div>
                </label>
              </div>

              {/* Live Preview Inside Modal */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live CTA Card Preview</p>
                <div className="p-4 rounded-xl border border-yellow-500/30 bg-black/60 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-sm font-black text-white">{title || 'CTA Title Preview'}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-xs">{url || 'https://example.com'}</p>
                  </div>
                  <div
                    className="px-6 py-2.5 rounded-lg text-black font-black text-xs uppercase tracking-widest shadow-md shrink-0 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}
                  >
                    {buttonText || 'Button Text'} {openInNewTab ? '↗' : '→'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)` }}
                >
                  {saving ? 'Saving...' : (editingId ? 'Update CTA' : 'Create CTA')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
