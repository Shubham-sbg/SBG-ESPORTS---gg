import { getImageUrl } from '@/lib/imageResolver';
import { useState, useEffect } from 'react';
import type { Settings } from '@/lib/database';
import { getDB, saveDB } from '@/lib/database';
import { applyTheme } from '@/lib/applyTheme';
import { apiDownloadBackup, apiRestoreBackup } from '@/lib/wsClient';
import MediaUpload from '@/components/shared/MediaUpload';
import Combobox from '@/components/shared/Combobox';

import { uploadFileToServer } from '@/lib/uploadService';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';

interface Props { settings: Settings; onRefresh: () => void }

const THEME_PRESETS = [
  { name: 'Gold Esports',  primary: '#d4af37', secondary: '#0a0a0f', accent: '#ff6b00' },
  { name: 'Cyber Orange', primary: '#ff6b00', secondary: '#1a1a2e', accent: '#e94560' },
  { name: 'Neon Cyan',    primary: '#00d4ff', secondary: '#0a0a1a', accent: '#0066ff' },
  { name: 'Purple Fire',  primary: '#9945ff', secondary: '#0a0a1a', accent: '#ff0080' },
  { name: 'Matrix Green', primary: '#00ff88', secondary: '#050f05', accent: '#00d4ff' },
  { name: 'Ice White',    primary: '#ffffff', secondary: '#0a0a0f', accent: '#d4af37' },
];

const SOCIAL_FIELDS: { key: keyof Settings; label: string; icon: string; ph: string }[] = [
  { key: 'socialDiscord',   label: 'Discord',   icon: '💬', ph: 'https://discord.gg/…' },
  { key: 'socialYoutube',   label: 'YouTube',   icon: '▶️', ph: 'https://youtube.com/@…' },
  { key: 'socialInstagram', label: 'Instagram', icon: '📷', ph: 'https://instagram.com/…' },
  { key: 'socialTwitter',   label: 'Twitter/X', icon: '🐦', ph: 'https://twitter.com/…' },
  { key: 'socialFacebook',  label: 'Facebook',  icon: '📘', ph: 'https://facebook.com/…' },
  { key: 'socialWhatsApp',  label: 'WhatsApp',  icon: '💚', ph: 'https://wa.me/…' },
];

export default function AdminSettings({ settings, onRefresh }: Props) {
  const [form, setForm] = useState<Settings>(settings);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [backupState, setBackupState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [restoreState, setRestoreState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'brand' | 'theme' | 'hero' | 'footer' | 'seo' | 'stats' | 'loading' | 'social' | 'contact' | 'maintenance' | 'backup'>('brand');

  useEffect(() => { setForm(settings); }, [settings]);

  const set = (key: keyof Settings | string, value: string | boolean | number | string[]) => {
    const updated = { ...form, [key]: value } as Settings;
    setForm(updated);
    if (['primaryColor', 'secondaryColor', 'accentColor'].includes(key as string)) {
      applyTheme(updated);
    }
  };

  const handleSave = async () => {
    setSaveState('saving');
    setSaveError('');
    try {
      const savePromise = (async () => {
        const updatedForm = { ...form };
        const ensureUploaded = async (val?: string, filename = 'asset.png'): Promise<string> => {
          if (!val || !val.startsWith('data:')) return val || '';
          try {
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Upload timeout')), 6000)
            );
            const res = await Promise.race([uploadFileToServer(val, { filename }), timeoutPromise]);
            return res.url;
          } catch (uploadErr) {
            console.warn(`Server upload for ${filename} failed, preserving DataURL/local asset:`, uploadErr);
            return val;
          }
        };

        if (updatedForm.logo?.startsWith('data:')) {
          updatedForm.logo = await ensureUploaded(updatedForm.logo, 'logo.png');
        }
        if (updatedForm.favicon?.startsWith('data:')) {
          updatedForm.favicon = await ensureUploaded(updatedForm.favicon, 'favicon.png');
        }
        if (updatedForm.appleTouchIcon?.startsWith('data:')) {
          updatedForm.appleTouchIcon = await ensureUploaded(updatedForm.appleTouchIcon, 'apple-touch-icon.png');
        }
        if (updatedForm.upiQr?.startsWith('data:')) {
          updatedForm.upiQr = await ensureUploaded(updatedForm.upiQr, 'upi-qr.png');
        }
        if ((updatedForm as any).loadingLogo?.startsWith('data:')) {
          (updatedForm as any).loadingLogo = await ensureUploaded((updatedForm as any).loadingLogo, 'loading-logo.png');
        }

        setForm(updatedForm);

        const db = getDB();
        db.settings = updatedForm;
        if (updatedForm.activeTheme) {
          db.themeSettings = {
            ...db.themeSettings,
            activeTheme: updatedForm.activeTheme,
            updatedAt: Date.now(),
          };
        }

        await saveDB(db, 'settings');
        if (updatedForm.activeTheme) {
          await saveDB(db, 'themeSettings').catch(() => {});
        }
        onRefresh();
      })();

      const overallTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Site Settings save request timed out (12s)')), 12000)
      );

      await Promise.race([savePromise, overallTimeout]);

      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e: any) {
      console.error('Settings save failed:', e);
      setSaveError(e?.message ?? 'Save failed — check your login session.');
      setSaveState('error');
    }
  };

  const handleBackup = async () => {
    setBackupState('busy');
    try { await apiDownloadBackup(); setBackupState('done'); }
    catch { setBackupState('error'); }
    setTimeout(() => setBackupState('idle'), 3000);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setRestoreState('busy');
    try { await apiRestoreBackup(file); onRefresh(); setRestoreState('done'); }
    catch { setRestoreState('error'); }
    setTimeout(() => setRestoreState('idle'), 3000);
    e.target.value = '';
  };

  const TABS = [
    { id: 'brand',       label: 'Brand',       icon: '🎨' },
    { id: 'theme',       label: 'Theme',       icon: '🌈' },
    { id: 'hero',        label: 'Hero',        icon: '🚀' },
    { id: 'footer',      label: 'Footer',      icon: '🦶' },
    { id: 'seo',         label: 'SEO',         icon: '🔍' },
    { id: 'stats',       label: 'Stats',       icon: '📊' },
    { id: 'loading',     label: 'Loading',     icon: '⚡' },
    { id: 'social',      label: 'Social',      icon: '🌐' },
    { id: 'contact',     label: 'Contact',     icon: '📬' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'backup',      label: 'Backup',      icon: '💾' },
  ] as const;

  const DEFAULT_STATS = [
    { value: '50+',  label: 'Players',       numericEnd: 50,  suffix: '+', visible: true, position: 0, icon: '🎮' },
    { value: '100+', label: 'Tournaments',   numericEnd: 100, suffix: '+', visible: true, position: 1, icon: '🏆' },
    { value: '5+',   label: 'Championships', numericEnd: 5,   suffix: '+', visible: true, position: 2, icon: '🏅' },
    { value: '10K+', label: 'Community',     numericEnd: 10,  suffix: 'K+', visible: true, position: 3, icon: '👥' },
  ];

  const stats: NonNullable<Settings['heroStats']> =
    form.heroStats ?? DEFAULT_STATS;

  const setStats = (updated: NonNullable<Settings['heroStats']>) =>
    set('heroStats', updated as unknown as string);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-2">⚙️ SITE SETTINGS</h2>
          <p className="text-xs text-gray-500 mt-1">Global configuration for the entire SBG ESPORTS platform</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="px-7 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          style={{
            background: saveState === 'saved' ? '#10b981' : saveState === 'error' ? '#e94560' : `linear-gradient(135deg, ${GOLD}, #b8960c)`,
            boxShadow: `0 0 20px ${saveState === 'saved' ? '#10b98140' : GOLD + '30'}`,
          }}
        >
          {saveState === 'saving' && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
          {saveState === 'saving' ? 'SAVING…' : saveState === 'saved' ? '✓ SAVED!' : saveState === 'error' ? '✗ ERROR' : 'SAVE ALL'}
        </button>
      </div>

      {saveError && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-400 font-bold border border-red-400/25 bg-red-400/5">
          ⚠ {saveError}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            style={activeTab === tab.id ? {
              background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08)`,
              color: GOLD, border: `1px solid ${GOLD}30`,
            } : { color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }}>
            <span>{tab.icon}</span> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── BRAND TAB ── */}
      {activeTab === 'brand' && (
        <div className="space-y-6">
          {/* Logo Upload */}
          <Section title="🖼️ Logo" desc="Uploaded to server — displayed in navbar, splash, and everywhere">
            <div className="flex flex-col sm:flex-row items-start gap-8">
              <MediaUpload
                imageUrl={form.logo}
                onImageChange={url => set('logo', url)}
                label="Organization Logo"
                size="xl"
                shape="square"
                showBgRemove
                useServerUpload
                hint="PNG with transparent background recommended. Auto background removal works great for logos on white/solid backgrounds."
              />
              <div className="flex-1 space-y-4">
                <Field label="Organization Name">
                  <Input imageUrl={form.organizationName} onChange={v => set('organizationName', v)} placeholder="SBG ESPORTS" />
                </Field>
                <Field label="Tagline">
                  <Input imageUrl={form.tagline} onChange={v => set('tagline', v)} placeholder="BORN TO WIN. BUILT TO DOMINATE." />
                </Field>
                <Field label="Announcement Banner">
                  <Input value={(form as any).announcementText ?? ''} onChange={v => set('announcementText' as any, v)} placeholder="Announcement shown at top of site…" />
                </Field>
                <Field label="Hero Badge Text">
                  <Input value={(form as any).heroBadgeText ?? ''} onChange={v => set('heroBadgeText' as any, v)} placeholder="Professional Esports Organization" />
                  <p className="text-[10px] text-gray-500 mt-1">The line shown above your logo on the homepage</p>
                </Field>
              </div>
            </div>
          </Section>

          {/* Favicon & Apple Touch Icon */}
          <Section title="🏷️ Favicon & Mobile App Icons" desc="Upload custom icons for browser tabs, bookmarks, and mobile home screens">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
                <MediaUpload
                  imageUrl={form.favicon ?? ''}
                  onImageChange={url => set('favicon', url)}
                  label="Website Favicon (.ico, .png, .svg)"
                  size="md"
                  shape="square"
                  useServerUpload
                  hint="Displayed in browser tabs and bookmarks. Square PNG or ICO recommended."
                />
                <Field label="Direct Favicon URL (Optional)">
                  <Input imageUrl={form.favicon ?? ''} onChange={v => set('favicon', v)} placeholder="/favicon.ico or https://..." />
                </Field>
              </div>

              <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
                <MediaUpload
                  imageUrl={form.appleTouchIcon ?? ''}
                  onImageChange={url => set('appleTouchIcon', url)}
                  label="Apple Touch Icon (.png)"
                  size="md"
                  shape="square"
                  useServerUpload
                  hint="Displayed when users add your site to their iOS / Android home screen (180x180 PNG recommended)."
                />
                <Field label="Direct Apple Touch Icon URL (Optional)">
                  <Input imageUrl={form.appleTouchIcon ?? ''} onChange={v => set('appleTouchIcon', v)} placeholder="/apple-touch-icon.png or https://..." />
                </Field>
              </div>
            </div>
          </Section>

          {/* Player Auth */}
          <Section title="🔐 Player Registration" desc="Control how players sign up and log in">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
              <div>
                <p className="text-sm font-bold text-white">Google Login</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Show the "Continue with Google" button on the player login page</p>
              </div>
              <button
                onClick={() => set('googleLoginEnabled' as any, !((form as any).googleLoginEnabled ?? true))}
                className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${(form as any).googleLoginEnabled !== false ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${(form as any).googleLoginEnabled !== false ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </Section>

          {/* Payment */}
          <Section title="💳 Payment Settings" desc="UPI payment details for tournaments and shop">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Field label="UPI ID">
                  <Input imageUrl={form.upiId ?? ''} onChange={v => set('upiId', v)} placeholder="yourname@upi" />
                </Field>
              </div>
              <div>
                <MediaUpload
                  imageUrl={form.upiQr ?? ''}
                  onImageChange={url => set('upiQr', url)}
                  label="UPI QR Code Image"
                  size="lg"
                  shape="square"
                  showBgRemove={false}
                  useServerUpload
                  hint="Upload a clear screenshot of your UPI QR code"
                />
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── HERO TAB ── */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <Section title="🚀 Hero Section Text" desc="Controls the text displayed in the homepage hero section">
            <div className="space-y-4">
              <Field label="Badge Text (above logo)">
                <Input value={(form as any).heroBadgeText ?? ''} onChange={v => set('heroBadgeText' as any, v)} placeholder="Professional Esports Organization" />
              </Field>
              <Field label="Tagline (below name)">
                <Input imageUrl={form.tagline} onChange={v => set('tagline', v)} placeholder="BORN TO WIN. BUILT TO DOMINATE." />
              </Field>
            </div>
          </Section>

          <Section title="🎬 Hero Media" desc="Background video or image shown behind the hero">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Hero Background Video URL">
                <Input value={(form as any).heroVideoUrl ?? ''} onChange={v => set('heroVideoUrl' as any, v)} placeholder="https://cdn.example.com/hero.mp4" />
              </Field>
              <Field label="Hero Background Image URL (fallback)">
                <Input value={(form as any).heroImageUrl ?? ''} onChange={v => set('heroImageUrl' as any, v)} placeholder="https://cdn.example.com/hero.jpg" />
              </Field>
            </div>
            <p className="text-[10px] text-gray-500">Video plays first. Image is used if no video is set or as a poster/fallback frame.</p>
          </Section>

          <Section title="🖱️ Hero CTA Buttons" desc="Configure and toggle the call-to-action buttons in the hero section.">
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Join Button */}
              <div className={`p-4 rounded-xl space-y-4 border transition-all ${(form as any).heroCtaJoinVisible !== false ? 'bg-white/[0.02] border-white/8' : 'bg-black/30 border-red-500/10 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider uppercase text-gray-400">⚔️ Join Button</span>
                  <button
                    onClick={() => set('heroCtaJoinVisible', (form as any).heroCtaJoinVisible !== false ? false : true)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      (form as any).heroCtaJoinVisible !== false
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {(form as any).heroCtaJoinVisible !== false ? '👁️ VISIBLE' : '🙈 HIDDEN'}
                  </button>
                </div>
                <Field label="Label Text">
                  <Input value={(form as any).heroCtaJoinLabel ?? ''} onChange={v => set('heroCtaJoinLabel' as any, v)} placeholder="JOIN THE ARMY" />
                </Field>
              </div>

              {/* Tournament Button */}
              <div className={`p-4 rounded-xl space-y-4 border transition-all ${(form as any).heroCtaTournamentVisible !== false ? 'bg-white/[0.02] border-white/8' : 'bg-black/30 border-red-500/10 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider uppercase text-gray-400">🏆 Tournament Button</span>
                  <button
                    onClick={() => set('heroCtaTournamentVisible', (form as any).heroCtaTournamentVisible !== false ? false : true)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      (form as any).heroCtaTournamentVisible !== false
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {(form as any).heroCtaTournamentVisible !== false ? '👁️ VISIBLE' : '🙈 HIDDEN'}
                  </button>
                </div>
                <Field label="Label Text">
                  <Input value={(form as any).heroCtaTournamentLabel ?? ''} onChange={v => set('heroCtaTournamentLabel' as any, v)} placeholder="VIEW TOURNAMENTS" />
                </Field>
              </div>

              {/* Live/Stream Button */}
              <div className={`p-4 rounded-xl space-y-4 border transition-all ${(form as any).heroCtaLiveVisible !== false ? 'bg-white/[0.02] border-white/8' : 'bg-black/30 border-red-500/10 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider uppercase text-gray-400">▶ Live/Stream Button</span>
                  <button
                    onClick={() => set('heroCtaLiveVisible', (form as any).heroCtaLiveVisible !== false ? false : true)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      (form as any).heroCtaLiveVisible !== false
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {(form as any).heroCtaLiveVisible !== false ? '👁️ VISIBLE' : '🙈 HIDDEN'}
                  </button>
                </div>
                <Field label="Label Text">
                  <Input value={(form as any).heroCtaLiveLabel ?? ''} onChange={v => set('heroCtaLiveLabel' as any, v)} placeholder="WATCH LIVE" />
                </Field>
                <p className="text-[9px] text-gray-500">Toggles the <strong>"Watch Matches"</strong> button on the landing page.</p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── FOOTER TAB ── */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <Section title="🦶 Footer Brand Column" desc="Left column of the footer — badge text and description">
            <div className="space-y-4">
              <Field label="Footer Badge (under org name)">
                <Input value={(form as any).navBadgeText ?? ''} onChange={v => set('navBadgeText' as any, v)} placeholder="Official Platform" />
              </Field>
              <Field label="Footer Description">
                <Input value={(form as any).footerText ?? ''} onChange={v => set('footerText' as any, v)} placeholder="Built for competitive excellence" />
              </Field>
            </div>
          </Section>

          <Section title="📋 Footer Section Titles" desc="Headings for the link columns in the footer">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Quick Links Column Title">
                <Input value={(form as any).footerQuickLinksTitle ?? ''} onChange={v => set('footerQuickLinksTitle' as any, v)} placeholder="Quick Links" />
              </Field>
              <Field label="Explore Column Title">
                <Input value={(form as any).footerExploreTitle ?? ''} onChange={v => set('footerExploreTitle' as any, v)} placeholder="Explore" />
              </Field>
              <Field label="Support Box Title">
                <Input value={(form as any).footerSupportTitle ?? ''} onChange={v => set('footerSupportTitle' as any, v)} placeholder="Official Support" />
              </Field>
              <Field label="Support Box Text">
                <Input value={(form as any).footerSupportText ?? ''} onChange={v => set('footerSupportText' as any, v)} placeholder="Built for competitive excellence." />
              </Field>
            </div>
          </Section>

          <Section title="©️ Copyright" desc="Bottom bar copyright text">
            <Field label="Copyright Text (replaces 'All rights reserved')">
              <Input value={(form as any).footerCopyright ?? ''} onChange={v => set('footerCopyright' as any, v)} placeholder="All rights reserved." />
            </Field>
          </Section>
        </div>
      )}

      {/* ── SEO TAB ── */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <Section title="📢 Recruitment Popup" desc="Manage text for the popup that appears when there are active recruitment openings">
            <div className="space-y-4">
              <Field label="Popup Subtitle (Badge text)">
                <Input value={(form as any).recruitmentPopupSubtitle ?? ''} onChange={v => set('recruitmentPopupSubtitle' as any, v)} placeholder="WE ARE RECRUITING" />
              </Field>
              <Field label="Popup Title (HTML allowed)">
                <Input value={(form as any).recruitmentPopupTitle ?? ''} onChange={v => set('recruitmentPopupTitle' as any, v)} placeholder='JOIN <span class="text-amber-400" style="text-shadow: 0 0 20px #d4af37aa">{db.settings.organizationName || ADMIN_BRAND_NAME}</span>' />
              </Field>
              <Field label="Popup Text/Description">
                <textarea value={(form as any).recruitmentPopupText ?? ''} onChange={e => set('recruitmentPopupText' as any, e.target.value as any)} rows={3} placeholder="We are actively scouting talent for official esports rosters & content teams."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 resize-none placeholder-gray-700" />
              </Field>
            </div>
          </Section>

          <Section title="🔍 Search Engine Optimization" desc="Controls how your site appears in Google and social shares">
            <div className="space-y-4">
              <Field label="Page Title (browser tab & Google)">
                <Input value={(form as any).metaTitle ?? ''} onChange={v => set('metaTitle' as any, v)} placeholder="SBG ESPORTS — Professional Esports Organization" />
              </Field>
              <Field label="Meta Description (Google snippet)">
                <textarea value={(form as any).metaDescription ?? ''} onChange={e => set('metaDescription' as any, e.target.value as any)} rows={3} placeholder="Born to win. Built to dominate. Join SBG ESPORTS — India's premier mobile esports organization."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 resize-none placeholder-gray-700" />
                <p className="text-[10px] text-gray-600 mt-1">Ideal length: 120–160 characters. Current: {((form as any).metaDescription ?? '').length}</p>
              </Field>
              <Field label="Keywords (comma-separated)">
                <Input value={(form as any).seoKeywords ?? ''} onChange={v => set('seoKeywords' as any, v)} placeholder="esports, bgmi, competitive gaming, sbg esports" />
              </Field>
            </div>
          </Section>

          <Section title="🔍 Google Search Console" desc="Verify your site ownership with Google">
            <div className="space-y-4">
              <Field label="Google Verification Meta Tag">
                <Input value={(form as any).gscVerification ?? ''} onChange={v => set('gscVerification' as any, v)} placeholder="e.g. google1234567890abcdef.html or meta tag content" />
                <p className="text-[10px] text-gray-600 mt-1">If using HTML meta tag, paste the content value here.</p>
              </Field>
              <Field label="HTML File Verification">
                <Input value={(form as any).gscHtmlFile ?? ''} onChange={v => set('gscHtmlFile' as any, v)} placeholder="e.g. google1234567890abcdef.html" />
                <p className="text-[10px] text-gray-600 mt-1">If using HTML file upload, enter the filename here.</p>
              </Field>
            </div>
          </Section>

          <Section title="🗺️ Robots & Sitemap" desc="Advanced SEO configuration">
            <div className="space-y-4">
              <Field label="robots.txt (Custom)">
                <textarea value={(form as any).robotsTxt ?? ''} onChange={e => set('robotsTxt' as any, e.target.value)} rows={4} placeholder="User-agent: *
Allow: /"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-yellow-500/40 resize-none placeholder-gray-700" />
              </Field>
              <Field label="sitemap.xml (Custom)">
                <textarea value={(form as any).sitemapXml ?? ''} onChange={e => set('sitemapXml' as any, e.target.value)} rows={4} placeholder="<?xml version='1.0' encoding='UTF-8'?>
<urlset>...</urlset>"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-yellow-500/40 resize-none placeholder-gray-700" />
              </Field>
            </div>
          </Section>

          <Section title="🖼️ Open Graph (Social Share Preview)" desc="Image and description shown when sharing the link on WhatsApp, Twitter, Discord">
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="OG Image URL">
                <Input value={(form as any).seoOgImage ?? ''} onChange={v => set('seoOgImage' as any, v)} placeholder="https://your-cdn.com/og-image.jpg" />
              </Field>
              <div className="text-xs text-gray-500 leading-relaxed pt-6">
                Recommended: 1200×630px JPG or PNG. This image is shown as a preview card when someone shares your link on social media.
              </div>
            </div>
          </Section>

          <Section title="📊 Analytics" desc="Connect third-party analytics to track visitors">
            <Field label="Google Analytics / Tag Manager ID">
              <Input value={(form as any).analyticsId ?? ''} onChange={v => set('analyticsId' as any, v)} placeholder="G-XXXXXXXXXX or GTM-XXXXXXX" />
            </Field>
          </Section>
        </div>
      )}

      {/* ── THEME TAB ── */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <Section title="🎨 Color Theme" desc="Live preview updates as you change colors">
            {/* Presets */}
            <div className="space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick Presets</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {THEME_PRESETS.map(preset => (
                  <button key={preset.name}
                    onClick={() => {
                      set('primaryColor', preset.primary);
                      set('secondaryColor', preset.secondary);
                      set('accentColor', preset.accent);
                    }}
                    className="relative p-3 rounded-xl border text-left transition-all hover:scale-105 group overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${preset.secondary}, ${preset.secondary}dd)`,
                      border: `1px solid ${preset.primary}30`,
                    }}
                  >
                    <div className="flex gap-2 mb-2">
                      {[preset.primary, preset.secondary, preset.accent].map(c => (
                        <div key={c} className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="text-xs font-black text-white tracking-wide">{preset.name}</p>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                      style={{ background: `${preset.primary}15` }}>
                      <span className="text-xs font-black text-white">APPLY →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom pickers */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              {([
                { key: 'primaryColor',   label: 'Primary',   desc: 'Buttons, highlights' },
                { key: 'secondaryColor', label: 'Secondary', desc: 'Background panels' },
                { key: 'accentColor',    label: 'Accent',    desc: 'Alerts, badges' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="space-y-2">
                  <div>
                    <p className="text-xs font-black text-white">{label}</p>
                    <p className="text-[10px] text-gray-500">{desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color" value={(form as any)[key] || '#000000'}
                        onChange={e => set(key, e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0.5 bg-transparent"
                        style={{ border: `2px solid ${(form as any)[key] || '#fff'}40` }}
                      />
                    </div>
                    <input
                      value={(form as any)[key] || ''}
                      onChange={e => set(key, e.target.value)}
                      placeholder="#000000"
                      maxLength={7}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-yellow-500/40"
                    />
                  </div>
                  {/* Preview swatch */}
                  <div className="h-2 rounded-full" style={{ background: (form as any)[key] || '#333' }} />
                </div>
              ))}
            </div>

            {/* Live preview bar */}
            <div className="rounded-xl overflow-hidden mt-2" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: form.secondaryColor }}>
                {form.logo ? (
                  <img src={getImageUrl(form.logo)} alt="Logo" className="h-7 w-auto object-contain" />
                ) : (
                  <div className="h-7 px-2 rounded font-black text-xs flex items-center" style={{ background: form.primaryColor, color: '#000' }}>SBG</div>
                )}
                <span className="font-black text-sm tracking-widest text-white">{form.organizationName || 'SBG ESPORTS'}</span>
                <div className="ml-auto flex gap-2">
                  <div className="px-3 py-1 rounded text-xs font-black text-white" style={{ background: form.primaryColor }}>JOIN</div>
                  <div className="px-3 py-1 rounded text-xs font-black text-white" style={{ background: form.accentColor }}>LIVE</div>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 text-center py-2" style={{ background: 'rgba(0,0,0,0.4)' }}>⬆ Live navbar preview</p>
            </div>
          </Section>
        </div>
      )}

      {/* ── LOADING SCREEN TAB ── */}
      {activeTab === 'loading' && (
        <div className="space-y-6">
          {/* Loading Logo */}
          <Section title="⚡ Loading Screen Logo" desc="Replaces the default SBG square — use a PNG/SVG with transparent background">
            <div className="flex flex-col sm:flex-row items-start gap-8">
              <MediaUpload
                value={(form as any).loadingLogo ?? ''}
                onImageChange={url => set('loadingLogo' as any, url)}
                label="Loading Screen Logo"
                size="xl"
                shape="square"
                showBgRemove
                useServerUpload
                hint="PNG or SVG with transparent background. Displayed inside the energy ring on the loading screen."
              />
              <div className="flex-1 space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Upload your official logo here. It will appear inside the rotating energy ring with a gold breathing glow. Supports PNG, SVG, WebP with transparent background.<br /><br />
                  Leave empty to use the main brand logo from the Brand tab, or the default SBG fallback.
                </p>
                <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', color: '#d4af37' }}>
                  💡 For best results: use a square or circular logo at 512×512px with transparent background.
                </div>
              </div>
            </div>
          </Section>

          {/* Animation & Effects */}
          <Section title="✨ Animation & Effects" desc="Control visual effects on the loading screen">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Particles toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="font-black text-white text-sm">Golden Particles</p>
                  <p className="text-xs text-gray-500 mt-0.5">Floating ember particles around the logo</p>
                </div>
                <button
                  onClick={() => set('loadingParticles' as any, !((form as any).loadingParticles ?? true))}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${(form as any).loadingParticles !== false ? 'bg-yellow-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${(form as any).loadingParticles !== false ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Glow toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="font-black text-white text-sm">Gold Glow Effect</p>
                  <p className="text-xs text-gray-500 mt-0.5">Breathing glow animation on logo</p>
                </div>
                <button
                  onClick={() => set('loadingGlow' as any, !((form as any).loadingGlow ?? true))}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${(form as any).loadingGlow !== false ? 'bg-yellow-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${(form as any).loadingGlow !== false ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Skip button toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="font-black text-white text-sm">Skip Button</p>
                  <p className="text-xs text-gray-500 mt-0.5">Let users skip the loading screen</p>
                </div>
                <button
                  onClick={() => set('loadingSkipButton' as any, !((form as any).loadingSkipButton ?? false))}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${(form as any).loadingSkipButton ? 'bg-yellow-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${(form as any).loadingSkipButton ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Duration slider */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-white text-sm">Duration</p>
                    <p className="text-xs text-gray-500 mt-0.5">How long the loading screen shows</p>
                  </div>
                  <span className="text-yellow-400 font-black text-sm">{((form as any).loadingDuration ?? 2800) / 1000}s</span>
                </div>
                <input
                  type="range" min="1000" max="6000" step="200"
                  value={(form as any).loadingDuration ?? 2800}
                  onChange={e => set('loadingDuration' as any, Number(e.target.value) as any)}
                  className="w-full accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>1s (fast)</span><span>3s (default)</span><span>6s (slow)</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Loading Tips */}
          <Section title="💬 Loading Tips" desc="Rotating messages shown during loading — one per line">
            <Field label="Tips (one per line)">
              <textarea
                value={((form as any).loadingTips ?? []).join('\n')}
                onChange={e => {
                  const lines = e.target.value.split('\n').filter(Boolean);
                  set('loadingTips' as any, lines as any);
                }}
                rows={10}
                placeholder={[
                  'Loading Player Data…',
                  'Connecting to Servers…',
                  'Syncing Tournaments…',
                  'Loading Team Roster…',
                  'Preparing Match Center…',
                  'Checking Live Scores…',
                  'Optimizing Assets…',
                  'Connecting to Community…',
                  'Verifying Security…',
                  'Ready for Battle…',
                ].join('\n')}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 resize-none font-mono"
              />
            </Field>
            <p className="text-xs text-gray-600 -mt-2">Leave empty to use the default tips above. Each line becomes one rotating tip.</p>
          </Section>

          {/* Preview note */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
            <p className="text-xs text-yellow-600 font-bold tracking-widest uppercase">💡 Live Preview</p>
            <p className="text-xs text-gray-500 mt-1">Save changes then reload the page to see the updated loading screen.</p>
          </div>
        </div>
      )}

      {/* ── SOCIAL TAB ── */}
      {activeTab === 'social' && (
        <Section title="🌐 Social Links" desc="Shown in navbar, footer, and contact sections">
          <div className="grid sm:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map(({ key, label, icon, ph }) => (
              <Field key={key} label={`${icon} ${label}`}>
                <Input
                  value={(form as any)[key] ?? ''}
                  onChange={v => set(key as any, v)}
                  placeholder={ph}
                />
              </Field>
            ))}
          </div>
        </Section>
      )}

      {/* ── CONTACT TAB ── */}
      {activeTab === 'contact' && (
        <Section title="📬 Support & Contact" desc="WhatsApp and email for support links">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="💚 Support WhatsApp">
              <Input value={(form as any).supportWhatsApp ?? ''} onChange={v => set('supportWhatsApp' as any, v)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="📧 Support Email">
              <Input value={(form as any).supportEmail ?? ''} onChange={v => set('supportEmail' as any, v)} placeholder="support@sbgarmy.gg" />
            </Field>
          </div>
        </Section>
      )}

      {/* ── STATS TAB ── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <Section
            title="📊 Hero Stats Counter"
            desc="These numbers appear in the hero section with an animated count-up effect. You can hide individual stats below or disable the entire section in Feature Control."
          >
            <div className="p-3 mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between flex-wrap gap-2 text-xs text-yellow-200">
              <span className="flex items-center gap-2">
                <span>💡</span>
                <span>To hide or show the entire <strong>Hero Stats Counter</strong> bar on the homepage, use <strong>Feature Control → Hero Stats Counter (ON/OFF)</strong>.</span>
              </span>
            </div>

            <div className="space-y-4">
              {stats.map((stat, idx) => (
                <div key={idx} className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl items-start sm:items-center transition-opacity ${stat.visible === false ? 'opacity-50 bg-black/40' : ''}`}
                  style={{ background: stat.visible === false ? 'rgba(0,0,0,0.3)' : 'rgba(212,175,55,0.04)', border: stat.visible === false ? '1px border-gray-800' : '1px solid rgba(212,175,55,0.12)' }}>
                  {/* Status Indicator */}
                  <div className="flex flex-col items-center">
                    <span className="text-lg select-none" title="Stat item">📈</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${stat.visible === false ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                      {stat.visible === false ? 'HIDDEN' : 'VISIBLE'}
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Display Value">
                      <Input
                        value={stat.value}
                        onChange={v => {
                          const updated = stats.map((s, i) => i === idx ? { ...s, value: v } : s);
                          setStats(updated);
                        }}
                        placeholder="50+"
                      />
                    </Field>
                    <Field label="Label">
                      <Input
                        value={stat.label}
                        onChange={v => {
                          const updated = stats.map((s, i) => i === idx ? { ...s, label: v } : s);
                          setStats(updated);
                        }}
                        placeholder="Players"
                      />
                    </Field>
                    <Field label="Count-Up To (number)">
                      <Input
                        type="text"
                        value={String(stat.numericEnd ?? '')}
                        onChange={v => {
                          const parsed = parseInt(v.replace(/[^0-9]/g, ''), 10) || 0;
                          const updated = stats.map((s, i) => i === idx ? { ...s, numericEnd: parsed } : s);
                          setStats(updated);
                        }}
                        placeholder="50"
                      />
                    </Field>
                    <Field label="Suffix (e.g. +, K+)">
                      <Input
                        value={stat.suffix}
                        onChange={v => {
                          const updated = stats.map((s, i) => i === idx ? { ...s, suffix: v } : s);
                          setStats(updated);
                        }}
                        placeholder="+"
                      />
                    </Field>
                    <Field label="Icon (Emoji)">
                      <Input
                        value={stat.icon || ''}
                        onChange={v => {
                          const updated = stats.map((s, i) => i === idx ? { ...s, icon: v } : s);
                          setStats(updated);
                        }}
                        placeholder="🏆"
                      />
                    </Field>
                    <Field label="Position">
                      <Input
                        type="number"
                        value={String(stat.position ?? idx)}
                        onChange={v => {
                          const updated = stats.map((s, i) => i === idx ? { ...s, position: Number(v) } : s);
                          setStats(updated);
                        }}
                      />
                    </Field>
                    <Field label="Visible">
                      <Combobox
                        value={stat.visible === false ? 'false' : 'true'}
                        onChange={e => {
                          const updated = stats.map((s, i) => i === idx ? { ...s, visible: e.target.value === 'true' } : s);
                          setStats(updated);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 transition-colors"
                      >
                        <option value="true" className="bg-[#1a1a1a]">Yes</option>
                        <option value="false" className="bg-[#1a1a1a]">No</option>
                      </Combobox>
                    </Field>
                  </div>

                  {/* Preview chip */}
                  <div className="flex flex-col items-center min-w-[64px]">
                    <span className="text-xl font-black"
                      style={{ background: 'linear-gradient(135deg,#d4af37,#f5e27e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {stat.suffix.startsWith('K') ? `${stat.numericEnd}K+` : `${stat.numericEnd}${stat.suffix}`}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500">{stat.label}</span>
                  </div>

                  {/* Actions: Hide/Show & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const updated = stats.map((s, i) => i === idx ? { ...s, visible: s.visible === false ? true : false } : s);
                        setStats(updated);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                        stat.visible === false 
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30' 
                          : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30'
                      }`}
                      title={stat.visible === false ? 'Show this stat' : 'Hide this stat'}
                    >
                      {stat.visible === false ? '👁️ Show' : '🙈 Hide'}
                    </button>
                    <button
                      onClick={() => setStats(stats.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-sm"
                      title="Remove stat"
                    >✕</button>
                  </div>
                </div>
              ))}

              {/* Add new stat */}
              <button
                onClick={() => setStats([...stats, { value: '0+', label: 'New Stat', numericEnd: 0, suffix: '+', visible: true, position: stats.length, icon: '⭐' }])}
                className="w-full py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all hover:scale-[1.01] active:scale-95"
                style={{ border: `1px dashed rgba(212,175,55,0.35)`, color: GOLD, background: 'rgba(212,175,55,0.03)' }}
              >
                + Add Stat
              </button>

              <p className="text-[11px] text-gray-600 leading-relaxed">
                <strong className="text-gray-400">Count-Up To</strong> — the number the animation counts up to on scroll.<br />
                <strong className="text-gray-400">Suffix</strong> — appended after the number. Use <code className="text-gold">+</code> for "50+", or <code className="text-gold">K+</code> for "10K+".
              </p>
            </div>
          </Section>

          {/* Live Preview */}
          <Section title="👁 Live Preview" desc="This is how the stats bar looks on the hero section">
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-5 py-8 rounded-xl"
              style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.05)' }}>
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-12">
                  <div className="text-center">
                    <div className="text-3xl font-black"
                      style={{ background: 'linear-gradient(135deg,#d4af37,#f5e27e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {stat.suffix.startsWith('K') ? `${stat.numericEnd}K+` : `${stat.numericEnd}${stat.suffix}`}
                    </div>
                    <div className="text-[10px] font-black tracking-[0.3em] uppercase mt-1 text-white/30">{stat.label}</div>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="h-10 w-px hidden sm:block"
                      style={{ background: 'linear-gradient(to bottom,transparent,rgba(212,175,55,0.3),transparent)' }} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-600 mt-3 text-center">Numbers animate with a count-up effect when the hero section scrolls into view</p>
          </Section>
        </div>
      )}

      {/* ── MAINTENANCE TAB ── */}
      {activeTab === 'maintenance' && (
        <Section title="🔧 Maintenance Mode" desc="When enabled, visitors see a maintenance page instead of the site">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: form.maintenanceMode ? 'rgba(233,69,96,0.08)' : 'rgba(16,185,129,0.05)', border: `1px solid ${form.maintenanceMode ? 'rgba(233,69,96,0.25)' : 'rgba(16,185,129,0.15)'}` }}>
              <div>
                <p className="font-black text-white">Maintenance Mode</p>
                <p className="text-xs text-gray-500 mt-1">
                  {form.maintenanceMode ? '🔴 Site is currently offline for visitors' : '🟢 Site is live and accessible'}
                </p>
              </div>
              <button onClick={() => set('maintenanceMode', !form.maintenanceMode)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${form.maintenanceMode ? 'bg-red-500' : 'bg-emerald-600'}`}>
                <div className={`absolute top-1.5 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-300 ${form.maintenanceMode ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
            {form.maintenanceMode && (
              <Field label="Maintenance Message">
                <textarea
                  imageUrl={form.maintenanceMessage}
                  onChange={e => set('maintenanceMessage', e.target.value)}
                  rows={3}
                  placeholder="We are upgrading our systems. Back soon!"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 resize-none"
                />
              </Field>
            )}
          </div>
        </Section>
      )}

      {/* ── BACKUP TAB ── */}
      {activeTab === 'backup' && (
        <Section title="💾 Database Backup & Restore" desc="Download or restore your complete site database">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={handleBackup} disabled={backupState === 'busy'}
                className="py-4 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: backupState === 'done' ? '#10b981' : backupState === 'error' ? '#e94560' : `linear-gradient(135deg, ${GOLD}, #b8960c)`,
                  color: '#000',
                }}>
                {backupState === 'busy' && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                {backupState === 'done' ? '✓ Downloaded!' : backupState === 'error' ? '✗ Failed' : '⬇ Download Backup'}
              </button>

              <label className="py-4 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ background: restoreState === 'done' ? '#10b981' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}>
                {restoreState === 'busy' && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {restoreState === 'done' ? '✓ Restored!' : restoreState === 'error' ? '✗ Failed' : '⬆ Restore Backup'}
                <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
              </label>
            </div>
            <p className="text-xs text-gray-600">Backup includes all data: roster, matches, news, sponsors, settings, and all other collections. Restore will overwrite current data.</p>
          </div>
        </Section>
      )}

      {/* Bottom save */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="flex-1 py-4 rounded-2xl font-black text-base uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: saveState === 'saved' ? '#10b981' : saveState === 'error' ? '#e94560' : `linear-gradient(135deg, ${GOLD}, #b8960c)`,
            boxShadow: `0 4px 24px ${GOLD}30`,
          }}
        >
          {saveState === 'saving' && <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
          {saveState === 'saving' ? 'SAVING CHANGES…' : saveState === 'saved' ? '✓ ALL CHANGES SAVED!' : saveState === 'error' ? '✗ SAVE FAILED — CHECK SESSION' : 'SAVE ALL CHANGES'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl space-y-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div>
        <h3 className="font-black text-white text-sm tracking-widest">{title}</h3>
        {desc && <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-yellow-500/40 transition-colors placeholder-gray-700"
    />
  );
}
