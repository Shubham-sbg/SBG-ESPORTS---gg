import { useState, useRef } from 'react';
import { Ad, getDB, saveDB } from '@/lib/database';
import AdminAdProviderManager from './AdminAdProviderManager';
import { uploadFileToServer } from '@/lib/uploadService';

interface Props {
  ads: Ad[];
  onRefresh: () => void;
}

const AD_TYPES: { value: string; label: string }[] = [
  { value: 'banner', label: 'Banner Ad' },
  { value: 'popup', label: 'Popup Ad' },
  { value: 'popunder', label: 'Popunder Ad' },
  { value: 'sidebar', label: 'Sidebar Ad' },
  { value: 'header', label: 'Header Ad' },
  { value: 'footer', label: 'Footer Ad' },
  { value: 'between-content', label: 'Between-Content Ad' },
  { value: 'homepage-only', label: 'Homepage-Only Ad' },
  { value: 'all-pages', label: 'All-Pages Ad' },
  { value: 'adsense', label: 'Google AdSense Script' },
  { value: 'custom-html', label: 'Custom HTML Script' },
  { value: 'iframe', label: 'Iframe Ad' },
  { value: 'image-click', label: 'Image Click Ad' },
  { value: 'link-redirect', label: 'Link Redirect Ad' },
  { value: 'native', label: 'Native Ad' },
  { value: 'interstitial', label: 'Interstitial Ad' },
  { value: 'push-notification', label: 'Push Notification Ad' },
  { value: 'reward-video', label: 'Reward Video Ad' },
  { value: 'video-ad', label: 'Video Ad (Upload)' },
  { value: 'custom', label: '✨ Custom Ad Type (Type custom value)' },
];

const PLACEMENTS: { value: string; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'popup', label: 'Popup' },
  { value: 'popunder', label: 'Popunder' },
  { value: 'between-content', label: 'Between Content' },
  { value: 'homepage-only', label: 'Homepage Only' },
  { value: 'all-pages', label: 'All Pages' },
  { value: 'hero', label: 'Hero Banner' },
  { value: 'inline', label: 'Inline' },
  { value: 'floating', label: 'Floating' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'popup-video', label: 'Popup Video' },
  { value: 'reward-video', label: 'Reward Video' },
  { value: 'custom', label: '✨ Custom Placement (Type custom value)' },
];

const DEVICE_TARGETS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Devices' },
  { value: 'mobile', label: 'Mobile Only' },
  { value: 'desktop', label: 'Desktop Only' },
  { value: 'tablet', label: 'Tablet Only' },
];

const VIDEO_PLACEMENTS: string[] = ['homepage-only', 'dashboard', 'between-content', 'popup-video', 'reward-video'];

type FormState = {
  title: string;
  adType: string;
  placement: string;
  customAdType: string;
  customPlacement: string;
  imageUrl: string;
  link: string;
  script: string;
  iframeSrc: string;
  videoUrl: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  deviceTarget: string;
};

const BLANK_FORM: FormState = {
  title: '',
  adType: 'banner',
  placement: 'header',
  customAdType: '',
  customPlacement: '',
  imageUrl: '',
  link: '',
  script: '',
  iframeSrc: '',
  videoUrl: '',
  enabled: true,
  startDate: '',
  endDate: '',
  deviceTarget: 'all',
};

function isVideoType(adType: string) {
  return adType === 'video-ad' || adType === 'reward-video';
}

function isScriptType(adType: string) {
  return adType === 'adsense' || adType === 'custom-html';
}

function isIframeType(adType: string) {
  return adType === 'iframe';
}

export default function AdminAds({ ads, onRefresh }: Props) {
  const [viewTab, setViewTab] = useState<'providers' | 'units'>('providers');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditId(null);
    setForm(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (ad: Ad) => {
    setEditId(ad.id);
    const standardAdTypes = AD_TYPES.map(t => t.value).filter(v => v !== 'custom');
    const standardPlacements = PLACEMENTS.map(p => p.value).filter(v => v !== 'custom');
    const isCustomType = ad.adType && !standardAdTypes.includes(ad.adType);
    const isCustomPlace = ad.placement && !standardPlacements.includes(ad.placement);

    setForm({
      title: ad.title || '',
      adType: isCustomType ? 'custom' : (ad.adType || 'banner'),
      placement: isCustomPlace ? 'custom' : ad.placement,
      customAdType: isCustomType ? (ad.adType || '') : '',
      customPlacement: isCustomPlace ? (ad.placement || '') : '',
      imageUrl: ad.imageUrl || '',
      link: ad.link || '',
      script: ad.script || '',
      iframeSrc: ad.iframeSrc || '',
      videoUrl: ad.videoUrl || '',
      enabled: ad.enabled,
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
      deviceTarget: ad.deviceTarget || 'all',
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFileToServer(file);
      setForm(f => ({ ...f, imageUrl: res.url }));
    } catch (err: any) {
      console.warn('Server image upload failed, converting file to local DataURL preview:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setForm(f => ({ ...f, imageUrl: event.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxDuration = 120;
    const minDuration = 10;
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = async () => {
      URL.revokeObjectURL(video.src);
      if (video.duration < minDuration) {
        alert(`Video must be at least ${minDuration} seconds long.`);
        return;
      }
      if (video.duration > maxDuration) {
        alert(`Video must not exceed ${maxDuration} seconds (2 minutes).`);
        return;
      }
      try {
        const res = await uploadFileToServer(file, { allowVideo: true });
        setForm(f => ({ ...f, videoUrl: res.url }));
      } catch (err: any) {
        console.warn('Server video upload failed, creating object URL:', err);
        setForm(f => ({ ...f, videoUrl: URL.createObjectURL(file) }));
      }
    };
    video.src = URL.createObjectURL(file);
  };

  const saveAd = async () => {
    setSaving(true);
    try {
      const db = getDB();
      const finalAdType = form.adType === 'custom' ? form.customAdType : form.adType;
      const finalPlacement = form.placement === 'custom' ? form.customPlacement : form.placement;

      if (editId) {
        const idx = db.ads.findIndex(a => a.id === editId);
        if (idx !== -1) {
          db.ads[idx] = {
            ...db.ads[idx],
            title: form.title,
            adType: finalAdType,
            placement: finalPlacement,
            imageUrl: form.imageUrl,
            link: form.link,
            script: form.script,
            iframeSrc: form.iframeSrc,
            videoUrl: form.videoUrl,
            enabled: form.enabled,
            startDate: form.startDate,
            endDate: form.endDate,
            deviceTarget: form.deviceTarget,
          };
        }
      } else {
        const newAd: Ad = {
          id: `ad_${Date.now()}`,
          title: form.title,
          adType: finalAdType,
          placement: finalPlacement,
          imageUrl: form.imageUrl,
          link: form.link,
          script: form.script,
          iframeSrc: form.iframeSrc,
          videoUrl: form.videoUrl,
          enabled: form.enabled,
          startDate: form.startDate,
          endDate: form.endDate,
          deviceTarget: form.deviceTarget,
        };
        db.ads.push(newAd);
      }
      await saveDB(db, 'ads');
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        setShowModal(false);
        onRefresh();
      } else {
        alert('Failed to save ad to database. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    try {
      const db = getDB();
      db.ads = db.ads.filter(a => a.id !== id);
      await saveDB(db, 'ads');
      onRefresh();
    } catch {
      alert('Failed to delete ad. Please try again.');
    }
  };

  const toggleAd = async (id: string) => {
    try {
      const db = getDB();
      const ad = db.ads.find(a => a.id === id);
      if (ad) ad.enabled = !ad.enabled;
      await saveDB(db, 'ads');
      onRefresh();
    } catch {
      alert('Failed to toggle ad status.');
    }
  };

  const isVideo = isVideoType(form.adType) || (form.adType === 'custom' && isVideoType(form.customAdType));
  const isScript = isScriptType(form.adType) || (form.adType === 'custom' && isScriptType(form.customAdType));
  const isIframe = isIframeType(form.adType) || (form.adType === 'custom' && isIframeType(form.customAdType));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header & Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-black text-xl text-white">Ads & Monetization Center</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure Ad Networks (Google AdSense / HilltopAds) and manage individual banner/video ad units.</p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewTab('providers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'providers'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Provider Manager
          </button>
          <button
            type="button"
            onClick={() => setViewTab('units')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'units'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📢 Custom Units ({ads.length})
          </button>
        </div>
      </div>

      {viewTab === 'providers' ? (
        <AdminAdProviderManager />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white">Custom Ad Units & Direct Placements</h3>
            <button onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 transition-colors">
              + Add Ad Unit
            </button>
          </div>

          {ads.length === 0 && (
            <div className="p-10 rounded-xl border border-white/5 bg-white/3 text-center text-gray-500 text-sm">
              No custom ads created yet. Click <strong className="text-orange-400">+ Add Ad Unit</strong> to create your first ad.
            </div>
          )}

      <div className="space-y-3">
        {ads.map(ad => (
          <div key={ad.id} className="p-5 rounded-xl border border-white/5 bg-white/3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">{ad.title || ad.adType || 'Untitled Ad'}</span>
                <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 font-semibold">{ad.placement}</span>
                {ad.adType && <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-400">{AD_TYPES.find(t => t.value === ad.adType)?.label || ad.adType}</span>}
                {ad.deviceTarget && ad.deviceTarget !== 'all' && <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">{ad.deviceTarget}</span>}
              </div>
              {(ad.startDate || ad.endDate) && (
                <p className="text-xs text-gray-500 mt-1">
                  {ad.startDate && `From: ${ad.startDate}`} {ad.endDate && `To: ${ad.endDate}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleAd(ad.id)}
                className={`relative w-12 h-6 rounded-full transition-all ${ad.enabled ? 'bg-orange-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${ad.enabled ? 'left-7' : 'left-1'}`} />
              </button>
              <button onClick={() => openEdit(ad)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20 transition-colors">
                Edit
              </button>
              <button onClick={() => deleteAd(ad.id)}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/40 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">{editId ? 'Edit Ad' : 'Create New Ad'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Ad Title</label>
                <input className="inp" placeholder="Enter ad title" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ad Type</label>
                  <select className="inp" value={form.adType}
                    onChange={e => setForm(f => ({ ...f, adType: e.target.value }))}>
                    {AD_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {form.adType === 'custom' && (
                    <div className="mt-2">
                      <input className="inp" placeholder="e.g. video-banner, bottom-sticky" value={form.customAdType}
                        onChange={e => setForm(f => ({ ...f, customAdType: e.target.value }))} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Placement</label>
                  <select className="inp" value={form.placement}
                    onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}>
                    {(isVideo ? VIDEO_PLACEMENTS.map(v => PLACEMENTS.find(p => p.value === v)!).filter(Boolean) : PLACEMENTS).map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  {form.placement === 'custom' && (
                    <div className="mt-2">
                      <input className="inp" placeholder="e.g. sidebar-bottom, pre-roll" value={form.customPlacement}
                        onChange={e => setForm(f => ({ ...f, customPlacement: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>

              {isScript && (
                <div>
                  <label className="label">
                    {form.adType === 'adsense' ? 'Google AdSense Script' : 'Custom HTML / Script'}
                  </label>
                  <textarea className="inp min-h-[120px] font-mono text-xs"
                    placeholder={form.adType === 'adsense'
                      ? '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<ins class="adsbygoogle" ...'
                      : 'Paste your custom HTML or script here...'}
                    value={form.script}
                    onChange={e => setForm(f => ({ ...f, script: e.target.value }))} />
                  <p className="text-xs text-gray-500 mt-1">Script will render safely on the frontend. No source code changes needed.</p>
                </div>
              )}

              {isIframe && (
                <div>
                  <label className="label">Iframe Source URL</label>
                  <input className="inp" placeholder="https://ads.example.com/frame" value={form.iframeSrc}
                    onChange={e => setForm(f => ({ ...f, iframeSrc: e.target.value }))} />
                </div>
              )}

              {isVideo && (
                <div className="space-y-3">
                  <div>
                    <label className="label">Upload Video (10s – 2min max)</label>
                    <div className="flex items-center gap-4 mt-1">
                      {form.videoUrl && (
                        <video src={form.videoUrl} className="h-20 rounded border border-white/10" controls />
                      )}
                      <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">
                        Choose Video
                        <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum 10 seconds. Maximum 2 minutes (120 seconds).</p>
                  </div>
                </div>
              )}

              {!isScript && !isIframe && !isVideo && (
                <div>
                  <label className="label">Ad Image</label>
                  <div className="flex items-center gap-4 mt-1">
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="" className="h-12 rounded object-contain border border-white/10" />
                    )}
                    <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold hover:bg-white/20">
                      Upload Image
                      <input ref={imageRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {!isScript && (
                <div>
                  <label className="label">Destination URL</label>
                  <input className="inp" placeholder="https://advertiser-site.com" value={form.link}
                    onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input className="inp" type="date" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input className="inp" type="date" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Device Targeting</label>
                <select className="inp" value={form.deviceTarget}
                  onChange={e => setForm(f => ({ ...f, deviceTarget: e.target.value }))}>
                  {DEVICE_TARGETS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Enable Ad</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ad will be active and visible on the website</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                  className={`relative w-12 h-6 rounded-full transition-all ${form.enabled ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={saveAd} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Ad'}
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
