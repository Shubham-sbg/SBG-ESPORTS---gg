import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getDB, saveDB } from '@/lib/database';
import type { FeedbackReport } from '@/lib/database';
import Combobox from '@/components/shared/Combobox';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';
const GOLD_DARK = '#b8960c';

type Category = FeedbackReport['category'];
type Priority = FeedbackReport['priority'];

interface CategoryMeta {
  value: Category;
  icon: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

const CATEGORIES: CategoryMeta[] = [
  { value: 'Bug Report',          icon: '🐛', label: 'Bug Report',          desc: 'Something is broken or not working',       color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  { value: 'UI Problem',          icon: '🎨', label: 'UI Problem',          desc: 'Visual or layout issues',                  color: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
  { value: 'Feature Request',     icon: '✨', label: 'Feature Request',     desc: 'Suggest a new feature or improvement',     color: GOLD,      bg: 'rgba(212,175,55,0.08)' },
  { value: 'Performance Issue',   icon: '⚡', label: 'Performance Issue',   desc: 'Slowness, lag or loading problems',        color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  { value: 'Security Report',     icon: '🔒', label: 'Security Report',     desc: 'Vulnerability or security concern',        color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  { value: 'Tournament Feedback', icon: '🏆', label: 'Tournament Feedback', desc: 'Feedback about tournaments and matches',   color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { value: 'General Feedback',    icon: '💬', label: 'General Feedback',    desc: 'Anything else on your mind',               color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
];

const PRIORITY_OPTS: { value: Priority; label: string; color: string }[] = [
  { value: 'low',      label: 'Low',      color: '#6b7280' },
  { value: 'medium',   label: 'Medium',   color: '#eab308' },
  { value: 'high',     label: 'High',     color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua))     return 'Microsoft Edge';
  if (/OPR\//.test(ua))     return 'Opera';
  if (/Chrome\//.test(ua))  return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua))  return 'Safari';
  return 'Unknown';
}

const BLANK_FORM = {
  title: '',
  description: '',
  name: '',
  email: '',
  username: '',
  discord: '',
  device: '',
  browser: '',
  priority: 'medium' as Priority,
  screenshotUrl: '',
};

export default function FeedbackPage() {
  const { db, loading } = useDatabase();
  const [category, setCategory] = useState<Category | null>(null);
  const [form, setForm]         = useState({ ...BLANK_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId]   = useState<string | null>(null);

  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  // auto-fill device/browser once
  useEffect(() => {
    setForm(f => ({
      ...f,
      device:  navigator.platform || 'Unknown',
      browser: detectBrowser(navigator.userAgent),
    }));
  }, []);

  const set = (k: keyof typeof BLANK_FORM, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const canSubmit = form.title.trim().length > 0 && form.description.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !category) return;
    setSubmitting(true);
    const id = 'fb_' + Date.now();
    const newReport: FeedbackReport = {
      id,
      category,
      priority:     form.priority,
      status:       'open',
      title:        form.title.trim(),
      description:  form.description.trim(),
      name:         form.name.trim()         || undefined,
      email:        form.email.trim()        || undefined,
      username:     form.username.trim()     || undefined,
      discord:      form.discord.trim()      || undefined,
      device:       form.device.trim()       || undefined,
      browser:      form.browser.trim()      || undefined,
      screenshotUrl: form.screenshotUrl.trim() || undefined,
      read:         false,
      createdAt:    Date.now(),
    };
    const current = getDB();
    current.feedback = [...(current.feedback || []), newReport];
    await saveDB(current);
    setSuccessId(id);
    setSubmitting(false);
  }

  function reset() {
    setCategory(null);
    setForm({ ...BLANK_FORM, device: navigator.platform || 'Unknown', browser: detectBrowser(navigator.userAgent) });
    setSuccessId(null);
  }

  const pageTitle    = db.settings?.feedbackPageTitle    || 'FEEDBACK & SUPPORT';
  const pageSubtitle = db.settings?.feedbackPageSubtitle || 'Help us improve the {PUBLIC_BRAND_NAME} platform';

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)',
        }} />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-black uppercase tracking-[0.3em] mb-3" style={{ color: GOLD }}>{db.settings.organizationName || PUBLIC_BRAND_NAME}</p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">{pageTitle}</h1>
            <p className="text-gray-400 text-base md:text-lg">{pageSubtitle}</p>
          </motion.div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 pb-24">

        {/* ── Success State ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {successId ? (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl border p-10 text-center"
              style={{ background: '#111114', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <div className="text-6xl mb-5">✅</div>
              <h2 className="text-2xl font-black text-white mb-2">Report Submitted!</h2>
              <p className="text-gray-400 mb-4">We'll review and respond within <span className="text-white font-bold">24–48 hours</span>.</p>
              <div className="inline-block rounded-xl px-5 py-2 mb-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Ticket ID &nbsp;</span>
                <span className="font-mono text-sm font-bold" style={{ color: GOLD }}>{successId}</span>
              </div>
              <br />
              <button onClick={reset}
                className="font-black uppercase tracking-widest text-black text-sm px-8 py-3 rounded-xl transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})` }}
              >
                Submit Another
              </button>
            </motion.div>

          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* ── Step 1 – Category picker ─────────────────── */}
              <div className="mb-8">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                  {category ? '1. Category' : 'Select a Category'}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => (
                    <motion.button key={cat.value} type="button"
                      onClick={() => setCategory(cat.value)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="text-left rounded-2xl border p-4 transition-all"
                      style={{
                        background:   category === cat.value ? cat.bg : '#111114',
                        borderColor:  category === cat.value ? cat.color + '60' : 'rgba(255,255,255,0.06)',
                        boxShadow:    category === cat.value ? `0 0 16px ${cat.color}22` : 'none',
                      }}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="font-bold text-white text-sm">{cat.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: category === cat.value ? cat.color : '#6b7280' }}>{cat.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ── Step 2 – Full form (animates in) ─────────── */}
              <AnimatePresence>
                {category && (
                  <motion.form key="fields"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-5"
                  >
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 pt-2">2. Details</h2>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        Title <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text" value={form.title} onChange={e => set('title', e.target.value)}
                        placeholder="Short summary of your report"
                        className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-1"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        Description <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                        placeholder="Please describe the issue or request in detail…"
                        className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none resize-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        required
                      />
                    </div>

                    {/* Name / Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Name</label>
                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                          placeholder="Your name (optional)"
                          className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                          placeholder="your@email.com (optional)"
                          className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    </div>

                    {/* Username / Discord */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Username / IGN</label>
                        <input type="text" value={form.username} onChange={e => set('username', e.target.value)}
                          placeholder="In-game name (optional)"
                          className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Discord</label>
                        <input type="text" value={form.discord} onChange={e => set('discord', e.target.value)}
                          placeholder="username#0000 (optional)"
                          className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    </div>

                    {/* Device / Browser */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Device / OS</label>
                        <input type="text" value={form.device} onChange={e => set('device', e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Browser</label>
                        <input type="text" value={form.browser} onChange={e => set('browser', e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Priority</label>
                      <Combobox value={form.priority} onChange={e => set('priority', e.target.value as Priority)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: PRIORITY_OPTS.find(p => p.value === form.priority)?.color || '#fff' }}
                      >
                        {PRIORITY_OPTS.map(p => (
                          <option key={p.value} value={p.value} style={{ background: '#111114', color: p.color }}>{p.label}</option>
                        ))}
                      </Combobox>
                    </div>

                    {/* Screenshot URL */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Screenshot URL</label>
                      <input type="url" value={form.screenshotUrl} onChange={e => set('screenshotUrl', e.target.value)}
                        placeholder="https://imgur.com/… (optional)"
                        className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={reset}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-300 transition-colors hover:text-white"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        ← Back
                      </button>
                      <button type="submit" disabled={!canSubmit}
                        className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-black text-sm transition-opacity"
                        style={{
                          background:   canSubmit ? `linear-gradient(135deg,${GOLD},${GOLD_DARK})` : 'rgba(255,255,255,0.1)',
                          color:        canSubmit ? '#000' : '#555',
                          cursor:       canSubmit ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {submitting ? 'Submitting…' : 'Submit Report'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
