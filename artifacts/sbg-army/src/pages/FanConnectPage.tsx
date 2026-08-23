import { useEffect, useRef, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { trackPageVisit } from '@/lib/analytics';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getDB, saveDB, FanMessage } from '@/lib/database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

type FanType = FanMessage['type'];

export default function FanConnectPage() {
  const { db } = useDatabase();
  const tracked = useRef(false);
  const [activeTab, setActiveTab] = useState<FanType>('feedback');
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    applyTheme(db.settings);
    if (!tracked.current) { trackPageVisit('/fan-connect'); tracked.current = true; }
  }, [db.settings]);

  const links = [
    { id: 'discord', label: 'Join Discord', icon: '💬', url: db.settings.socialDiscord, color: '#5865F2' },
    { id: 'youtube', label: 'Subscribe on YouTube', icon: '▶️', url: db.settings.socialYoutube, color: '#FF0000' },
    { id: 'instagram', label: 'Follow on Instagram', icon: '📸', url: db.settings.socialInstagram, color: '#E1306C' },
    { id: 'twitter', label: 'Follow on Twitter', icon: '🐦', url: db.settings.socialTwitter, color: '#1DA1F2' },
  ].filter(l => l.url);

  const submit = () => {
    setError('');
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    const db2 = getDB();
    if (!db2.fan_messages) db2.fan_messages = [];
    const msg: FanMessage = {
      id: `fm_${Date.now()}`,
      type: activeTab,
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      message: form.message.trim() || undefined,
      read: false,
      createdAt: Date.now(),
    };
    db2.fan_messages.push(msg);
    saveDB(db2);
    setSubmitted(true);
    setForm({ name: '', email: '', whatsapp: '', message: '' });
  };

  const TABS: { id: FanType; label: string; icon: string }[] = [
    { id: 'feedback', label: 'Send Feedback', icon: '💡' },
    { id: 'newsletter', label: 'Newsletter', icon: '📧' },
    { id: 'other', label: 'Other', icon: '✉️' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            ⭐ Fan Connect
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Connect With <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>{db.settings.organizationName || PUBLIC_BRAND_NAME}</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">Join the community, share your feedback, and stay connected with us.</p>
        </div>

        {/* Social Links */}
        {links.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/3 hover:border-white/20 hover:bg-white/5 transition-all duration-300 text-center group">
                <span className="text-3xl">{l.icon}</span>
                <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{l.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Contact Form */}
        <div className="rounded-2xl border border-white/5 bg-white/3 p-8">
          <h2 className="font-black text-xl text-white mb-6">Get In Touch</h2>

          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setSubmitted(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t.id ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {submitted ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-black text-lg text-white mb-2">Message Sent!</h3>
              <p className="text-gray-400 text-sm">We'll get back to you soon.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 px-6 py-2 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">Send Another</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Your Name *</label>
                  <input className="inp" placeholder="Enter your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email (optional)</label>
                  <input className="inp" placeholder="you@email.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">WhatsApp Number (optional)</label>
                <input className="inp" placeholder="+91 9876543210" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
              </div>
              {activeTab !== 'newsletter' && (
                <div>
                  <label className="label">Message</label>
                  <textarea className="inp min-h-[100px]" placeholder="Write your message..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={submit}
                className="w-full py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all"
                style={{ background: 'var(--sbg-primary, #ff6b00)' }}>
                {activeTab === 'newsletter' ? 'Subscribe to Newsletter' : 'Submit Message'}
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
