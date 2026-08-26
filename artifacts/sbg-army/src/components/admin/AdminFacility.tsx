import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import { FacilitySection as FacilitySectionType, FacilityStat, Settings, getDB, saveDB } from '@/lib/database';
import FacilitySection from '@/components/FacilitySection';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  facility: FacilitySectionType[];
  facilityStats: FacilityStat[];
  settings?: Settings;
  onRefresh: () => void;
}

const PALETTE = [
  '#f97316', // Orange
  '#ef4444', // Red / Crimson
  '#eab308', // Gold / Yellow
  '#10b981', // Emerald / Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export default function AdminFacility({ facility, facilityStats, settings, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<'header' | 'stats' | 'features' | 'preview'>('header');

  // Header Settings State
  const [headerForm, setHeaderForm] = useState({
    badge: settings?.facilityBadge || 'EXCELLENCE',
    title: settings?.facilityTitle || 'OUR FACILITY',
    subtitle: settings?.facilitySubtitle || 'State-of-the-art gaming environment engineered for elite performance.',
    icon: settings?.facilityIcon || '🏢',
    sectionEnabled: getDB().features?.sections?.facility !== false,
  });

  // Modals & Editing State
  const [editingStat, setEditingStat] = useState<FacilityStat | null>(null);
  const [editingFeature, setEditingFeature] = useState<FacilitySectionType | null>(null);

  const [statForm, setStatForm] = useState({
    label: '',
    value: '',
    color: '#f97316',
    suffix: '+',
    icon: '🏆',
    position: 0,
    visible: true,
    numericEnd: 10,
  });

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [featForm, setFeatForm] = useState({
    title: '',
    description: '',
    icon: '🎮',
    image: '',
    visible: true,
    order: 0,
  });

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ---------------------------------------------------------
  // Header Settings Actions
  // ---------------------------------------------------------
  const saveHeaderSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('saving');
    const db = getDB();
    if (!db.settings) (db as any).settings = {};
    if (!db.features) (db as any).features = { sections: {}, pages: {} };
    if (!db.features.sections) db.features.sections = {} as any;

    db.settings.facilityBadge = headerForm.badge.trim() || 'EXCELLENCE';
    db.settings.facilityTitle = headerForm.title.trim() || 'OUR FACILITY';
    db.settings.facilitySubtitle = headerForm.subtitle.trim();
    db.settings.facilityIcon = headerForm.icon.trim();
    db.features.sections.facility = headerForm.sectionEnabled;

    try {
      await saveDB(db);
      setSaveState('saved');
      showToast('Facility Header & Section settings saved successfully!');
      setTimeout(() => {
        setSaveState('idle');
        onRefresh();
      }, 1200);
    } catch (err: any) {
      setSaveState('idle');
      showToast('Database save failed: ' + (err.message || 'Unknown error'));
    }
  };

  // ---------------------------------------------------------
  // Stat Actions
  // ---------------------------------------------------------
  const openNewStat = () => {
    setEditingStat({ id: 'new', label: '', value: '', color: '#f97316' });
    setStatForm({
      label: 'PRO PLAYERS',
      value: '20+',
      color: '#f97316',
      suffix: '+',
      icon: '🎮',
      position: (facilityStats || []).length,
      visible: true,
      numericEnd: 20,
    });
  };

  const openEditStat = (s: FacilityStat) => {
    setEditingStat(s);
    // Parse numeric end if possible
    const matchNum = s.value ? s.value.match(/^(\d+)(.*)$/) : null;
    const num = matchNum ? parseInt(matchNum[1], 10) : (s.numericEnd ?? 0);
    const suf = matchNum ? matchNum[2] : (s.suffix ?? '');

    setStatForm({
      label: s.label || '',
      value: s.value || '',
      color: s.color || '#f97316',
      suffix: suf,
      icon: s.icon || '🏆',
      position: s.position ?? 0,
      visible: s.visible ?? true,
      numericEnd: num,
    });
  };

  const saveStat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!statForm.label.trim()) {
      alert('Stat label is required');
      return;
    }

    setSaveState('saving');
    const db = getDB();
    if (!db.facilityStats) db.facilityStats = [];

    const computedVal = `${statForm.numericEnd}${statForm.suffix}`;
    const payload: FacilityStat = {
      id: editingStat?.id === 'new' ? `fs_${Date.now()}` : (editingStat?.id || `fs_${Date.now()}`),
      label: statForm.label.trim().toUpperCase(),
      value: computedVal,
      numericEnd: statForm.numericEnd,
      suffix: statForm.suffix,
      color: statForm.color,
      icon: statForm.icon.trim(),
      position: statForm.position,
      visible: statForm.visible,
    };

    if (editingStat?.id === 'new') {
      db.facilityStats.push(payload);
    } else {
      const idx = db.facilityStats.findIndex(s => s.id === editingStat?.id);
      if (idx !== -1) {
        db.facilityStats[idx] = payload;
      } else {
        db.facilityStats.push(payload);
      }
    }

    try {
      await saveDB(db);
      setSaveState('saved');
      showToast(`Stat "${payload.label}" saved successfully!`);
      setTimeout(() => {
        setSaveState('idle');
        setEditingStat(null);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setSaveState('idle');
      showToast('Database save failed: ' + (err.message || 'Unknown error'));
    }
  };

  const deleteStat = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stat counter?')) return;
    const db = getDB();
    db.facilityStats = (db.facilityStats || []).filter(s => s.id !== id);
    try {
      await saveDB(db);
      showToast('Stat removed.');
      onRefresh();
    } catch (err: any) {
      alert('Failed to remove stat: ' + err.message);
    }
  };

  const toggleStatVisibility = async (id: string) => {
    const db = getDB();
    const stat = (db.facilityStats || []).find(s => s.id === id);
    if (stat) {
      stat.visible = stat.visible === false;
      try {
        await saveDB(db);
        onRefresh();
      } catch (err: any) {
        alert('Failed to save visibility: ' + err.message);
      }
    }
  };

  const reorderStat = async (id: string, dir: 'up' | 'down') => {
    const db = getDB();
    if (!db.facilityStats) return;
    const sorted = [...db.facilityStats].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const idx = sorted.findIndex(s => s.id === id);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const tempPos = sorted[idx].position ?? idx;
    sorted[idx].position = sorted[targetIdx].position ?? targetIdx;
    sorted[targetIdx].position = tempPos;

    db.facilityStats = sorted;
    try {
      await saveDB(db);
      onRefresh();
    } catch (err: any) {
      alert('Failed to reorder: ' + err.message);
    }
  };

  const duplicateStat = async (s: FacilityStat) => {
    const db = getDB();
    if (!db.facilityStats) db.facilityStats = [];
    const newStat: FacilityStat = {
      ...s,
      id: `fs_${Date.now()}`,
      label: `${s.label} (COPY)`,
      position: db.facilityStats.length,
    };
    db.facilityStats.push(newStat);
    try {
      await saveDB(db);
      showToast(`Duplicated ${s.label}`);
      onRefresh();
    } catch (err: any) {
      alert('Failed to duplicate: ' + err.message);
    }
  };

  // ---------------------------------------------------------
  // Feature Cards Actions
  // ---------------------------------------------------------
  const openNewFeature = () => {
    setEditingFeature({ id: 'new', title: '', description: '', icon: '🎮', image: '', visible: true, order: (facility || []).length });
    setFeatForm({
      title: '',
      description: '',
      icon: '🎮',
      image: '',
      visible: true,
      order: (facility || []).length,
    });
  };

  const openEditFeature = (f: FacilitySectionType) => {
    setEditingFeature(f);
    setFeatForm({
      title: f.title || '',
      description: f.description || '',
      icon: f.icon || '🎮',
      image: f.image || '',
      visible: f.visible ?? true,
      order: f.order ?? 0,
    });
  };

  const saveFeature = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!featForm.title.trim()) {
      alert('Feature title is required');
      return;
    }

    setSaveState('saving');
    
    let finalImageUrl = featForm.image;
    if (pendingImageFile) {
      try {
        const res = await uploadFileToServer(pendingImageFile);
        finalImageUrl = res.url;
      } catch (err: any) {
        console.warn('Server upload failed for facility image, converting to local DataURL:', err);
        try {
          finalImageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve((ev.target?.result as string) || featForm.image);
            reader.onerror = () => resolve(featForm.image);
            reader.readAsDataURL(pendingImageFile);
          });
        } catch {
          finalImageUrl = featForm.image;
        }
      }
    }

    const db = getDB();
    if (!db.facility) db.facility = [];

    const payload: FacilitySectionType = {
      id: editingFeature?.id === 'new' ? `fac_${Date.now()}` : (editingFeature?.id || `fac_${Date.now()}`),
      title: featForm.title.trim(),
      description: featForm.description.trim(),
      icon: featForm.icon.trim() || '🎮',
      image: finalImageUrl.trim(),
      visible: featForm.visible,
      order: featForm.order,
    };

    if (editingFeature?.id === 'new') {
      db.facility.push(payload);
    } else {
      const idx = db.facility.findIndex(f => f.id === editingFeature?.id);
      if (idx !== -1) {
        db.facility[idx] = payload;
      } else {
        db.facility.push(payload);
      }
    }

    try {
      await saveDB(db);
      setSaveState('saved');
      showToast(`Feature "${payload.title}" saved!`);
      setTimeout(() => {
        setSaveState('idle');
        setPendingImageFile(null);
        setEditingFeature(null);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        setSaveState('saved');
        showToast(`Feature "${payload.title}" saved!`);
        setTimeout(() => {
          setSaveState('idle');
          setPendingImageFile(null);
          setEditingFeature(null);
          onRefresh();
        }, 1000);
      } else {
        setSaveState('idle');
        showToast('Database save failed: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const deleteFeature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this facility feature card?')) return;
    const db = getDB();
    db.facility = (db.facility || []).filter(f => f.id !== id);
    try {
      await saveDB(db);
      showToast('Feature card deleted.');
      onRefresh();
    } catch (err: any) {
      alert('Failed to delete feature: ' + err.message);
    }
  };

  const toggleFeatureVisibility = async (id: string) => {
    const db = getDB();
    const feat = (db.facility || []).find(f => f.id === id);
    if (feat) {
      feat.visible = !feat.visible;
      try {
        await saveDB(db);
        onRefresh();
      } catch (err: any) {
        alert('Failed to toggle visibility: ' + err.message);
      }
    }
  };

  const reorderFeature = async (id: string, dir: 'up' | 'down') => {
    const db = getDB();
    if (!db.facility) return;
    const sorted = [...db.facility].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex(item => item.id === id);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const tempOrder = sorted[idx].order ?? idx;
    sorted[idx].order = sorted[targetIdx].order ?? targetIdx;
    sorted[targetIdx].order = tempOrder;

    db.facility = sorted;
    try {
      await saveDB(db);
      onRefresh();
    } catch (err: any) {
      alert('Failed to reorder: ' + err.message);
    }
  };

  const duplicateFeature = async (f: FacilitySectionType) => {
    const db = getDB();
    if (!db.facility) db.facility = [];
    db.facility.push({
      ...f,
      id: `fac_${Date.now()}`,
      title: `${f.title} (Copy)`,
      order: db.facility.length,
    });
    try {
      await saveDB(db);
      showToast(`Duplicated ${f.title}`);
      onRefresh();
    } catch (err: any) {
      alert('Failed to duplicate: ' + err.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFeatForm(f => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------
  // Bulk Actions
  // ---------------------------------------------------------
  const publishAll = async () => {
    if (!confirm('Publish all stats and facility feature cards?')) return;
    const db = getDB();
    if (db.facility) db.facility.forEach(f => { f.visible = true; });
    if (db.facilityStats) db.facilityStats.forEach(s => { s.visible = true; });
    try {
      await saveDB(db);
      showToast('All facility items published!');
      onRefresh();
    } catch (err: any) {
      alert('Publish failed: ' + err.message);
    }
  };

  const resetDefaults = async () => {
    if (!confirm('⚠️ Reset facility section to original default configuration?')) return;
    const db = getDB();
    db.facility = [
      { id: 'fac1', title: '4K Gaming Monitors', description: '240Hz ultra-fast displays for competitive edge', icon: '🖥️', image: '', visible: true, order: 0 },
      { id: 'fac2', title: 'Fiber Internet', description: '1Gbps dedicated gaming connection, zero lag', icon: '🌐', image: '', visible: true, order: 1 },
      { id: 'fac3', title: 'Pro Peripherals', description: 'Top-tier mice, keyboards, and headsets', icon: '🖱️', image: '', visible: true, order: 2 },
      { id: 'fac4', title: 'Coaching Staff', description: 'Expert coaches and performance analysts', icon: '🧠', image: '', visible: true, order: 3 },
    ];
    db.facilityStats = [
      { id: 'fs1', label: 'PRO PLAYERS', value: '20+', numericEnd: 20, suffix: '+', color: '#f97316', icon: '🎮', visible: true, position: 0 },
      { id: 'fs2', label: 'TOURNAMENTS', value: '50+', numericEnd: 50, suffix: '+', color: '#ef4444', icon: '🏆', visible: true, position: 1 },
      { id: 'fs3', label: 'WIN RATE', value: '78%', numericEnd: 78, suffix: '%', color: '#eab308', icon: '🏅', visible: true, position: 2 },
      { id: 'fs4', label: 'TITLES', value: '15', numericEnd: 15, suffix: '', color: '#3b82f6', icon: '👥', visible: true, position: 3 },
    ];
    if (!db.settings) (db as any).settings = {};
    db.settings.facilityBadge = 'EXCELLENCE';
    db.settings.facilityTitle = 'OUR FACILITY';
    db.settings.facilitySubtitle = 'State-of-the-art gaming environment engineered for elite performance.';
    db.settings.facilityIcon = '🏢';

    try {
      await saveDB(db);
      showToast('Reset facility section to defaults.');
      onRefresh();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  const sortedStats = [...(facilityStats || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const sortedFeatures = [...(facility || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black font-extrabold px-5 py-3 rounded-xl shadow-2xl animate-bounce flex items-center gap-2 text-sm border border-emerald-300">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/3 border border-white/8 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <h2 className="font-black text-xl text-white tracking-wide">Facility Section Manager</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${headerForm.sectionEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {headerForm.sectionEnabled ? 'SECTION ACTIVE ON WEBSITE' : 'SECTION HIDDEN'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Manage section headers, count-up stats, icons, and feature cards stored in the production database.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={publishAll}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1">
            <span>⚡</span> Publish All
          </button>
          <button
            onClick={resetDefaults}
            className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white border border-white/10 text-xs font-bold transition-all">
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('header')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'header' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
          <span>⚙️</span> Section Header & Settings
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'stats' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
          <span>📊</span> Stat Counter Cards ({sortedStats.length})
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'features' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
          <span>🎴</span> Feature Cards ({sortedFeatures.length})
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
          <span>👁️</span> Live Public Preview
        </button>
      </div>

      {/* --------------------------------------------------------- */}
      {/* TAB 1: SECTION HEADER & SETTINGS                          */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'header' && (
        <form onSubmit={saveHeaderSettings} className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <div>
              <h3 className="font-black text-white text-base">Facility Section Title & Visibility</h3>
              <p className="text-xs text-gray-400">Configure the title, eyebrow badge, subtitle, and main icon displayed at the top of the Facility section.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-gray-300">Show Section on Homepage</span>
              <input
                type="checkbox"
                checked={headerForm.sectionEnabled}
                onChange={e => setHeaderForm(f => ({ ...f, sectionEnabled: e.target.checked }))}
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-black/50"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Eyebrow Badge (Small uppercase tag)
              </label>
              <input
                type="text"
                value={headerForm.badge}
                onChange={e => setHeaderForm(f => ({ ...f, badge: e.target.value }))}
                placeholder="EXCELLENCE"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Section Main Icon (Emoji)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={headerForm.icon}
                  onChange={e => setHeaderForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🏢"
                  className="w-24 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white text-center focus:outline-none focus:border-orange-500"
                />
                <div className="flex gap-1">
                  {['🏢', '🎮', '⚡', '🏟️', '🏛️', '🚀', '🔥', '🏆'].map(ico => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setHeaderForm(f => ({ ...f, icon: ico }))}
                      className={`w-9 h-9 rounded-lg border text-base flex items-center justify-center transition-all ${headerForm.icon === ico ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                      {ico}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Section Title (H2 Heading)
            </label>
            <input
              type="text"
              value={headerForm.title}
              onChange={e => setHeaderForm(f => ({ ...f, title: e.target.value }))}
              placeholder="OUR FACILITY"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Section Subtitle / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={headerForm.subtitle}
              onChange={e => setHeaderForm(f => ({ ...f, subtitle: e.target.value }))}
              placeholder="State-of-the-art gaming environment engineered for elite performance..."
              className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Live Header Preview Box */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center space-y-2">
            <span className="text-[10px] font-black tracking-[0.25em] text-orange-400 uppercase">
              {headerForm.badge || 'EXCELLENCE'}
            </span>
            <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
              {headerForm.icon && <span>{headerForm.icon}</span>}
              <span>{headerForm.title || 'OUR FACILITY'}</span>
            </h3>
            {headerForm.subtitle && (
              <p className="text-xs text-gray-400 max-w-lg mx-auto">{headerForm.subtitle}</p>
            )}
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-2" />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saveState !== 'idle'}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50">
              {saveState === 'saving' ? 'Saving to Database...' : saveState === 'saved' ? '✓ Saved!' : 'Save Header Settings'}
            </button>
          </div>
        </form>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 2: STAT COUNTER CARDS                                 */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-2xl p-4">
            <div>
              <h3 className="font-black text-white text-sm">Facility Stat Counters</h3>
              <p className="text-xs text-gray-400">Display count-ups like "20+ Pro Players", "78% Win Rate", or "15 Titles".</p>
            </div>
            <button
              onClick={openNewStat}
              className="px-4 py-2 bg-orange-500 text-black font-extrabold text-xs rounded-xl hover:bg-orange-400 transition-all flex items-center gap-1 shadow-md shadow-orange-500/20">
              <span>+</span> Add Stat Counter
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedStats.map((s, idx) => (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${s.visible !== false ? 'bg-white/3 border-white/10 hover:border-orange-500/40' : 'bg-white/1 border-white/5 opacity-60'}`}>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {s.icon && <span className="text-xl">{s.icon}</span>}
                    <span className="text-2xl font-black" style={{ color: s.color || '#f97316' }}>
                      {s.value || `${s.numericEnd ?? ''}${s.suffix ?? ''}`}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: s.color || '#f97316' }}
                      title={s.color}
                    />
                  </div>
                  <p className="font-extrabold text-xs text-gray-200 uppercase tracking-widest truncate">{s.label}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                    <span>Pos: {s.position ?? idx}</span>
                    <span>•</span>
                    <span className={s.visible !== false ? 'text-emerald-400' : 'text-gray-500'}>
                      {s.visible !== false ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => reorderStat(s.id, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-30 text-xs">
                      ▲
                    </button>
                    <button
                      onClick={() => reorderStat(s.id, 'down')}
                      disabled={idx === sortedStats.length - 1}
                      className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-30 text-xs">
                      ▼
                    </button>
                    <button
                      onClick={() => toggleStatVisibility(s.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold ${s.visible !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                      {s.visible !== false ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={() => duplicateStat(s)}
                      className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-bold hover:bg-blue-500/20">
                      Copy
                    </button>
                    <button
                      onClick={() => openEditStat(s)}
                      className="px-2 py-1 rounded-lg bg-white/10 text-gray-200 text-[11px] font-bold hover:bg-white/20">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteStat(s.id)}
                      className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold hover:bg-red-500/20">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 3: FEATURE SHOWCASE CARDS                             */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-2xl p-4">
            <div>
              <h3 className="font-black text-white text-sm">Facility Feature Cards</h3>
              <p className="text-xs text-gray-400">Display equipment, infrastructure, and coaching features on the homepage.</p>
            </div>
            <button
              onClick={openNewFeature}
              className="px-4 py-2 bg-orange-500 text-black font-extrabold text-xs rounded-xl hover:bg-orange-400 transition-all flex items-center gap-1 shadow-md shadow-orange-500/20">
              <span>+</span> Add Feature Card
            </button>
          </div>

          <div className="space-y-3">
            {sortedFeatures.map((f, idx) => (
              <div
                key={f.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${f.visible !== false ? 'bg-white/3 border-white/10 hover:border-orange-500/40' : 'bg-white/1 border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-4 min-w-0">
                  {f.image ? (
                    <Image src={f.image} alt="" objectFit="cover" className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-2xl flex items-center justify-center flex-shrink-0">
                      {f.icon || '🎮'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-black text-white text-sm truncate">{f.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{f.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-1">
                      <span>Order: {f.order ?? idx}</span>
                      <span>•</span>
                      <span className={f.visible !== false ? 'text-emerald-400' : 'text-gray-500'}>
                        {f.visible !== false ? 'Published' : 'Draft / Hidden'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => reorderFeature(f.id, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-30 text-xs">
                    ▲
                  </button>
                  <button
                    onClick={() => reorderFeature(f.id, 'down')}
                    disabled={idx === sortedFeatures.length - 1}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-30 text-xs">
                    ▼
                  </button>

                  <button
                    onClick={() => toggleFeatureVisibility(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${f.visible !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                    {f.visible !== false ? 'Published' : 'Hidden'}
                  </button>

                  <button
                    onClick={() => duplicateFeature(f)}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20">
                    Copy
                  </button>

                  <button
                    onClick={() => openEditFeature(f)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 text-gray-200 text-xs font-bold hover:bg-white/20">
                    Edit
                  </button>

                  <button
                    onClick={() => deleteFeature(f.id)}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20">
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 4: LIVE PUBLIC PREVIEW                                */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👁️</span>
              <span className="font-extrabold">Public Website Live Preview</span>
            </div>
            <span>Exact rendering as seen by public users</span>
          </div>

          <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-4">
            <FacilitySection
              facility={facility}
              facilityStats={facilityStats}
              settings={settings}
              disableDirectFetch={true}
            />
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL: EDIT / ADD STAT                                    */}
      {/* --------------------------------------------------------- */}
      {editingStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={saveStat} className="bg-[#0e1017] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingStat.id === 'new' ? 'Add Stat Counter' : 'Edit Stat Counter'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingStat(null)}
                className="text-gray-400 hover:text-white font-black text-xl">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Label (e.g. PRO PLAYERS)
              </label>
              <input
                type="text"
                required
                value={statForm.label}
                onChange={e => setStatForm(f => ({ ...f, label: e.target.value }))}
                placeholder="PRO PLAYERS"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Count Number
                </label>
                <input
                  type="number"
                  value={statForm.numericEnd}
                  onChange={e => setStatForm(f => ({ ...f, numericEnd: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Suffix (e.g. +, %, x)
                </label>
                <input
                  type="text"
                  value={statForm.suffix}
                  onChange={e => setStatForm(f => ({ ...f, suffix: e.target.value }))}
                  placeholder="+"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={statForm.icon}
                  onChange={e => setStatForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🏆"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Position / Order
                </label>
                <input
                  type="number"
                  value={statForm.position}
                  onChange={e => setStatForm(f => ({ ...f, position: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Stat Number Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={statForm.color}
                  onChange={e => setStatForm(f => ({ ...f, color: e.target.value }))}
                  className="h-10 w-14 rounded-xl cursor-pointer bg-transparent border border-white/20"
                />
                <input
                  type="text"
                  value={statForm.color}
                  onChange={e => setStatForm(f => ({ ...f, color: e.target.value }))}
                  className="w-28 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStatForm(f => ({ ...f, color: c }))}
                      style={{ backgroundColor: c }}
                      className="w-6 h-6 rounded-full border border-black/40 hover:scale-110 transition-all"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Visibility
              </label>
              <select
                value={statForm.visible ? 'true' : 'false'}
                onChange={e => setStatForm(f => ({ ...f, visible: e.target.value === 'true' }))}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500">
                <option value="true" className="bg-gray-900">Visible on Website</option>
                <option value="false" className="bg-gray-900">Hidden / Draft</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={saveState !== 'idle'}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-sm rounded-xl transition-all disabled:opacity-50">
                {saveState === 'saving' ? 'Saving...' : 'Save Stat'}
              </button>
              <button
                type="button"
                onClick={() => setEditingStat(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-sm rounded-xl">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL: EDIT / ADD FEATURE CARD                            */}
      {/* --------------------------------------------------------- */}
      {editingFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form onSubmit={saveFeature} className="bg-[#0e1017] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingFeature.id === 'new' ? 'Add Feature Card' : 'Edit Feature Card'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFeature(null)}
                className="text-gray-400 hover:text-white font-black text-xl">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Card Title
              </label>
              <input
                type="text"
                required
                value={featForm.title}
                onChange={e => setFeatForm(f => ({ ...f, title: e.target.value }))}
                placeholder="4K Gaming Monitors"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={featForm.description}
                onChange={e => setFeatForm(f => ({ ...f, description: e.target.value }))}
                placeholder="240Hz ultra-fast displays for competitive edge"
                className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={featForm.icon}
                  onChange={e => setFeatForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🖥️"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={featForm.order}
                  onChange={e => setFeatForm(f => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Custom Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                {featForm.image && (
                  <Image src={featForm.image} alt="" objectFit="cover" className="w-12 h-12 rounded-xl object-cover border border-white/20" />
                )}
                <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 rounded-xl transition-all">
                  Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {featForm.image && (
                  <button
                    type="button"
                    onClick={() => setFeatForm(f => ({ ...f, image: '' }))}
                    className="text-xs text-red-400 hover:underline">
                    Remove Image
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Visibility Status
              </label>
              <select
                value={featForm.visible ? 'true' : 'false'}
                onChange={e => setFeatForm(f => ({ ...f, visible: e.target.value === 'true' }))}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500">
                <option value="true" className="bg-gray-900">Published</option>
                <option value="false" className="bg-gray-900">Draft / Hidden</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={saveState !== 'idle'}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-sm rounded-xl transition-all disabled:opacity-50">
                {saveState === 'saving' ? 'Saving...' : 'Save Feature Card'}
              </button>
              <button
                type="button"
                onClick={() => setEditingFeature(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-sm rounded-xl">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
