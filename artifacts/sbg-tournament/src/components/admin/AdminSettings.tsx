import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/api';
import type { TnmtSettings } from '@/lib/types';

const RED  = '#e8192c';
const GOLD = '#d4af37';
const INPUT = "w-full px-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none focus:border-red-500/40 transition-all placeholder-gray-700";

const SOCIAL_FIELDS: { key: keyof TnmtSettings; label: string; ph: string }[] = [
  { key: 'socialDiscord',   label: 'Discord',   ph: 'https://discord.gg/…' },
  { key: 'socialYoutube',   label: 'YouTube',   ph: 'https://youtube.com/@…' },
  { key: 'socialInstagram', label: 'Instagram', ph: 'https://instagram.com/…' },
  { key: 'socialTwitter',   label: 'Twitter/X', ph: 'https://twitter.com/…' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const [form, setForm] = useState<TnmtSettings>({
    organizationName: 'SBG ARMY ENTREPRENEUR',
    tagline: 'COMPETE. CONQUER. CHAMPION.',
    primaryColor: RED,
    footerText: 'Built for Champions.',
  });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getSettings().then(setForm); }, []);

  const set = <K extends keyof TnmtSettings>(k: K, v: TnmtSettings[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setBusy(true);
    await saveSettings(form);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setBusy(false);
  };

  const Toggle = ({ label, desc, val, onToggle }: { label: string; desc?: string; val: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        <p className="font-bold text-white text-sm">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-all ${val ? 'bg-red-500' : 'bg-gray-700'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${val ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Settings</h2>
        <p className="text-xs text-gray-500 mt-1">Tournament platform configuration</p>
      </div>

      {/* Brand */}
      <div className="p-6 rounded-2xl space-y-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="font-black text-white text-xs uppercase tracking-widest">🎨 Brand</h3>
        <Field label="Organization Name">
          <input value={form.organizationName} onChange={e => set('organizationName', e.target.value)} placeholder="SBG ARMY ENTREPRENEUR" className={INPUT} />
        </Field>
        <Field label="Tagline">
          <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="COMPETE. CONQUER. CHAMPION." className={INPUT} />
        </Field>
        <Field label="Logo URL">
          <input value={form.logo ?? ''} onChange={e => set('logo', e.target.value)} placeholder="https://…/logo.png" className={INPUT} />
        </Field>
        <Field label="Footer Text">
          <input value={form.footerText ?? ''} onChange={e => set('footerText', e.target.value)} placeholder="Built for Champions." className={INPUT} />
        </Field>
      </div>

      {/* Announcement */}
      <div className="p-6 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="font-black text-white text-xs uppercase tracking-widest">📢 Announcement Banner</h3>
        <Toggle
          label="Show Announcement"
          desc="Display a banner at the top of all pages"
          val={form.announcementEnabled ?? false}
          onToggle={() => set('announcementEnabled', !(form.announcementEnabled ?? false))}
        />
        {form.announcementEnabled && (
          <Field label="Announcement Text">
            <input value={form.announcementText ?? ''} onChange={e => set('announcementText', e.target.value)} placeholder="Registration open for BGMI Pro League S2!" className={INPUT} />
          </Field>
        )}
      </div>

      {/* Contact */}
      <div className="p-6 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="font-black text-white text-xs uppercase tracking-widest">📬 Contact</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="WhatsApp">
            <input value={form.contactWhatsApp ?? ''} onChange={e => set('contactWhatsApp', e.target.value)} placeholder="+91XXXXXXXXXX" className={INPUT} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.contactEmail ?? ''} onChange={e => set('contactEmail', e.target.value)} placeholder="contact@sbgarmy.gg" className={INPUT} />
          </Field>
        </div>
      </div>

      {/* Social */}
      <div className="p-6 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="font-black text-white text-xs uppercase tracking-widest">🌐 Social Links</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {SOCIAL_FIELDS.map(({ key, label, ph }) => (
            <Field key={key} label={label}>
              <input value={(form as any)[key] ?? ''} onChange={e => set(key, e.target.value)} placeholder={ph} className={INPUT} />
            </Field>
          ))}
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={busy}
        className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-[1.01] disabled:opacity-50"
        style={{
          background: saved ? '#10b981' : `linear-gradient(135deg, ${RED}, #b00020)`,
          boxShadow: saved ? '0 4px 20px rgba(16,185,129,0.3)' : `0 4px 24px ${RED}30`,
        }}>
        {busy ? 'Saving…' : saved ? '✓ Settings Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
