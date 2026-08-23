import React, { useState } from 'react';
import { THEME_REGISTRY, ThemeId, resolveThemeBranding } from '@/lib/themeBranding';
import { useDatabase } from '@/hooks/useDatabase';
import { updateDBCache, saveCollection } from '@/lib/database';
import { applyTheme } from '@/lib/applyTheme';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

const PREV_THEME_STORAGE_KEY = 'sbg_previous_theme_backup';

export default function AdminDesignManager() {
  const { db, refresh, activeTheme: currentThemeFromDb } = useDatabase();
  const activeTheme = currentThemeFromDb || 'classic-sbg-army';
  const [previousTheme, setPreviousTheme] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PREV_THEME_STORAGE_KEY) || 'classic-sbg-army';
    } catch {
      return 'classic-sbg-army';
    }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<ThemeId | null>(null);

  const handlePublish = async (themeToPublish: ThemeId) => {
    setSaving(true);
    setError(null);
    setSaveSuccess(null);
    try {
      // Store previous theme for instant rollback
      if (activeTheme && activeTheme !== themeToPublish) {
        setPreviousTheme(activeTheme);
        try {
          localStorage.setItem(PREV_THEME_STORAGE_KEY, activeTheme);
        } catch {}
      }

      // Optimistically update local cache and DOM immediately for 0ms lag
      const now = Date.now();
      const themeData = { activeTheme: themeToPublish, updatedAt: now };
      const updatedSettings = { ...db.settings, activeTheme: themeToPublish };
      updateDBCache('themeSettings', themeData);
      updateDBCache('settings', updatedSettings);
      applyTheme(resolveThemeBranding(updatedSettings, themeToPublish));
      refresh();

      // Persist to server API
      const token = '' || '';
      const res = await fetch('/api/theme', { credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activeTheme: themeToPublish }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server returned HTTP ${res.status}`);
      }

      // Ensure persistence to collections
      await saveCollection('themeSettings', themeData).catch(() => {});

      const themeObj = THEME_REGISTRY.find(t => t.id === themeToPublish);
      const name = themeObj ? themeObj.name : themeToPublish;
      setSaveSuccess(`Theme successfully activated & published: "${name}"`);
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to update active theme setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async () => {
    if (!previousTheme) return;
    await handlePublish(previousTheme as ThemeId);
  };

  const isCurrentActive = (id: ThemeId) => {
    if (activeTheme === id) return true;
    if (id === 'classic-sbg-army' && activeTheme === 'classic') return true;
    if (id === 'new-esports' && activeTheme === 'elite') return true;
    return false;
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <h2 className="text-2xl font-black text-white tracking-wider">DESIGN & THEME MANAGER</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Choose between Classic variants (${ADMIN_BRAND_NAME} vs SBG ESPORTS) and Modern Pro Esports layouts. All theme switches are instantaneous, database-persisted, and 100% data-safe.
          </p>
        </div>

        {previousTheme && previousTheme !== activeTheme && (
          <button
            onClick={handleRollback}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold text-xs hover:bg-yellow-500/20 transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
            title={`Rollback to ${previousTheme}`}
          >
            <span>↩️</span> Quick Rollback to ({previousTheme})
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-5 py-3.5 rounded-xl text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-5 py-3.5 rounded-xl text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Theme Selection Grid */}
      <div className="space-y-6">
        {/* Section 1: Classic Designs */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">
              Classic Website Themes (Production Baseline)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-400">
              2 Branding Variants
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {THEME_REGISTRY.filter(t => t.category === 'classic').map((theme) => {
              const active = isCurrentActive(theme.id);
              return (
                <div
                  key={theme.id}
                  className={`rounded-2xl p-6 border transition-all relative flex flex-col justify-between ${
                    active
                      ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                      : 'bg-[#111116] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-black tracking-wider px-2.5 py-1 rounded-lg bg-white/10 text-white">
                        {theme.badge}
                      </span>
                      {active ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          Currently Active
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-semibold">Available</span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-white tracking-wide">{theme.name}</h4>
                    <div className="text-xs text-amber-400/90 font-bold mb-2">
                      Brand Display: <span className="text-white bg-white/10 px-2 py-0.5 rounded">{theme.brandName}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{theme.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setPreviewThemeId(theme.id)}
                      className="px-4 py-2 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-1.5"
                    >
                      <span>👁️</span> Preview
                    </button>

                    {active ? (
                      <span className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs uppercase tracking-wider border border-amber-500/30">
                        Active Live
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePublish(theme.id)}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-amber-400 hover:text-black transition-all hover:scale-105 disabled:opacity-50"
                      >
                        {saving ? 'Publishing...' : 'Activate & Publish'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Modern & Specialty Themes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">
              Modern & Esports Layouts
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-400">
              Pro Designs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {THEME_REGISTRY.filter(t => t.category !== 'classic').map((theme) => {
              const active = isCurrentActive(theme.id);
              return (
                <div
                  key={theme.id}
                  className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                    active
                      ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
                      : 'bg-[#111116] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-black tracking-wider px-2 py-0.5 rounded bg-white/10 text-white">
                        {theme.badge}
                      </span>
                      {active && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-500 text-white uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-white">{theme.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{theme.description}</p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewThemeId(theme.id)}
                      className="px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-1"
                    >
                      <span>👁️</span> Preview
                    </button>

                    {active ? (
                      <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePublish(theme.id)}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-lg bg-white/90 text-black font-black text-xs uppercase hover:bg-white transition-all disabled:opacity-50"
                      >
                        {saving ? '...' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewThemeId && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f15] border border-white/20 rounded-2xl max-w-6xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <span className="text-xl">👁️</span>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Live Theme Preview: {THEME_REGISTRY.find(t => t.id === previewThemeId)?.name}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Viewing responsive layout preview in sandbox mode (does not alter live site).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handlePublish(previewThemeId);
                    setPreviewThemeId(null);
                  }}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 text-black hover:bg-amber-300 uppercase tracking-wider transition-all"
                >
                  Publish This Theme
                </button>
                <button
                  onClick={() => setPreviewThemeId(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black overflow-hidden relative">
              <iframe
                src={`/?previewTheme=${previewThemeId}`}
                className="w-full h-full border-0"
                title="Theme Sandbox Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
