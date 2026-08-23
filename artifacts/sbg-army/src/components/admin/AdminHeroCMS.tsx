import { useState, useEffect } from 'react';
import { getDB, saveDB } from '@/lib/database';
import type { Settings } from '@/lib/database';
import MediaUpload from '@/components/shared/MediaUpload';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

interface Props { onRefresh: () => void }

const GOLD = '#d4af37';

type Tab = 'content' | 'media' | 'cta' | 'background' | 'countdown';

export default function AdminHeroCMS({ onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [form, setForm] = useState<Settings>(() => getDB().settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(getDB().settings); }, []);

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    const db = getDB();
    db.settings = form;
    try {
      await saveDB(db, 'settings');
      onRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Local changes saved') || msg.includes('Server connection error')) {
        onRefresh();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert(msg || 'Failed to save Hero settings.');
      }
    }
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'content',    label: 'Text Content', icon: '✏️' },
    { id: 'media',      label: 'Media',         icon: '🎬' },
    { id: 'cta',        label: 'CTA Buttons',   icon: '🖱️' },
    { id: 'background', label: 'Background',    icon: '✨' },
    { id: 'countdown',  label: 'Countdown',     icon: '⏱️' },
  ];

  const inp = `w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all`;
  const label = (text: string, hint?: string) => (
    <div className="mb-1">
      <span className="text-xs font-black tracking-widest uppercase text-gray-400">{text}</span>
      {hint && <span className="text-xs text-gray-600 ml-2">{hint}</span>}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-black text-xl text-white">Hero Section CMS</h2>
          <p className="text-xs text-gray-500 mt-0.5">Full control over the homepage hero. Changes appear instantly.</p>
        </div>
        <button onClick={save}
          className={`px-5 py-2.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'text-black hover:opacity-90'}`}
          style={!saved ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)` } : {}}>
          {saved ? '✓ Saved!' : 'Save All'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${activeTab === t.id ? 'text-black' : 'text-gray-500 hover:text-white'}`}
            style={activeTab === t.id ? { background: `linear-gradient(135deg, ${GOLD}30, ${GOLD}15)`, color: GOLD } : {}}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Content tab ───────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div>
            {label('Badge Text', '— small label above the main title')}
            <input className={inp} value={(form as any).heroBadgeText ?? ''}
              onChange={e => set('heroBadgeText', e.target.value)}
              placeholder="Professional Esports Organization" />
          </div>
          <div>
            {label('Organization Name', '— the main H1 title')}
            <input className={inp} value={form.organizationName ?? ''}
              onChange={e => set('organizationName', e.target.value)}
              placeholder={ADMIN_BRAND_NAME} />
          </div>
          <div>
            {label('Tagline / Subtitle')}
            <input className={inp} value={form.tagline ?? ''}
              onChange={e => set('tagline', e.target.value)}
              placeholder="Born to Win. Built to Dominate." />
          </div>
          <div>
            {label('Navigation Badge', '— tiny badge under org name in navbar')}
            <input className={inp} value={(form as any).navBadgeText ?? ''}
              onChange={e => set('navBadgeText', e.target.value)}
              placeholder="OFFICIAL PLATFORM" />
          </div>
        </div>
      )}

      {/* ── Media tab ─────────────────────────────────────────── */}
      {activeTab === 'media' && (
        <div className="space-y-5">
          <div>
            {label('Hero Logo', '— large logo shown in hero (leave blank to hide)')}
            <MediaUpload
              value={form.logo ?? ''}
              onChange={url => set('logo', url)}
              accept="image/*"
              hint="PNG with transparent background recommended"
            />
          </div>
          <div>
            {label('Background Video URL')}
            <input className={inp} value={(form as any).heroVideoUrl ?? ''}
              onChange={e => set('heroVideoUrl', e.target.value)}
              placeholder="https://cdn.example.com/hero-bg.mp4" />
            <p className="text-xs text-gray-600 mt-1">MP4 recommended. Plays muted &amp; looped behind hero content.</p>
          </div>
          <div>
            {label('Video Overlay Opacity', '— 0 = invisible, 1 = full')}
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="1" step="0.01"
                className="flex-1 accent-yellow-500"
                value={(form as any).heroOverlayOpacity ?? 0.15}
                onChange={e => set('heroOverlayOpacity', parseFloat(e.target.value))} />
              <span className="text-gold font-bold text-sm w-10 text-right">
                {Math.round(((form as any).heroOverlayOpacity ?? 0.15) * 100)}%
              </span>
            </div>
          </div>
          <div>
            {label('Background Image URL', '— shown if no video is set')}
            <input className={inp} value={(form as any).heroImageUrl ?? ''}
              onChange={e => set('heroImageUrl', e.target.value)}
              placeholder="https://cdn.example.com/hero.jpg" />
          </div>
        </div>
      )}

      {/* ── CTA Buttons tab ───────────────────────────────────── */}
      {activeTab === 'cta' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">The three action buttons shown below the hero headline.</p>
          {[
            { key: 'heroCtaJoinLabel',       label: 'Primary CTA (Join)',       ph: '⚔️ JOIN THE ARMY' },
            { key: 'heroCtaTournamentLabel', label: 'Secondary CTA (Tournament)',ph: '🏆 VIEW TOURNAMENTS' },
            { key: 'heroCtaLiveLabel',       label: 'Tertiary CTA (Live)',       ph: '▶ WATCH LIVE' },
          ].map(({ key, label: lbl, ph }) => (
            <div key={key}>
              {label(lbl)}
              <input className={inp} value={(form as any)[key] ?? ''}
                onChange={e => set(key, e.target.value)}
                placeholder={ph} />
            </div>
          ))}
        </div>
      )}

      {/* ── Background tab ────────────────────────────────────── */}
      {activeTab === 'background' && (
        <div className="space-y-5">
          <div className="space-y-3">
            {[
              { key: 'bgParticlesEnabled', lbl: '3D Particle Animation', desc: 'Rotating wireframe shapes in the hero' },
              { key: 'bgGlowEnabled',      lbl: 'Gold Glow Overlay',     desc: 'Radial gold glow behind hero content' },
            ].map(({ key, lbl, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/2">
                <div>
                  <p className="font-bold text-white text-sm">{lbl}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <button onClick={() => set(key, !((form as any)[key] !== false))}
                  className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${(form as any)[key] !== false ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(form as any)[key] !== false ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
          <div>
            {label('Glow Intensity', `— ${Math.round(((form as any).bgOverlayOpacity ?? 0.07) * 100)}%`)}
            <input type="range" min="0" max="0.4" step="0.01"
              className="w-full accent-yellow-500"
              value={(form as any).bgOverlayOpacity ?? 0.07}
              onChange={e => set('bgOverlayOpacity', parseFloat(e.target.value))} />
          </div>
          <div>
            {label('Animation Speed')}
            <input type="range" min="0.1" max="3" step="0.1"
              className="w-full accent-yellow-500"
              value={(form as any).bgAnimationSpeed ?? 1}
              onChange={e => set('bgAnimationSpeed', parseFloat(e.target.value))} />
            <div className="flex justify-between text-xs text-gray-600 mt-0.5"><span>Very Slow</span><span>Normal (1×)</span><span>Very Fast</span></div>
          </div>
        </div>
      )}

      {/* ── Countdown tab ─────────────────────────────────────── */}
      {activeTab === 'countdown' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/2">
            <div>
              <p className="font-bold text-white text-sm">Show Countdown Timer</p>
              <p className="text-xs text-gray-500">Displays a live countdown in the hero section</p>
            </div>
            <button onClick={() => set('countdownEnabled', !(form as any).countdownEnabled)}
              className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${(form as any).countdownEnabled ? 'bg-yellow-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(form as any).countdownEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div>
            {label('Countdown Title')}
            <input className={inp} value={(form as any).countdownTitle ?? ''}
              onChange={e => set('countdownTitle', e.target.value)}
              placeholder="Next Tournament" />
          </div>
          <div>
            {label('Target Date & Time')}
            <input type="datetime-local" className={inp}
              value={(form as any).countdownTargetDate ? new Date((form as any).countdownTargetDate).toISOString().slice(0, 16) : ''}
              onChange={e => set('countdownTargetDate', e.target.value ? new Date(e.target.value).toISOString() : '')} />
          </div>
          <div>
            {label('Expired Message')}
            <input className={inp} value={(form as any).countdownExpiredMessage ?? ''}
              onChange={e => set('countdownExpiredMessage', e.target.value)}
              placeholder="Tournament in progress!" />
          </div>
        </div>
      )}

      <button onClick={save}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-black' : 'text-black hover:opacity-90'}`}
        style={!saved ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)` } : {}}>
        {saved ? '✓ SAVED!' : 'SAVE HERO SETTINGS'}
      </button>
    </div>
  );
}
