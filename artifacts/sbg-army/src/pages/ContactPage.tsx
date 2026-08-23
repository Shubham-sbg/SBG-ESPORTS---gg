import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { getDB, saveDB } from '@/lib/database';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { sanitizeUrl } from '@/lib/sanitizeUrl';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

type Category = 'general' | 'support' | 'bug' | 'feedback' | 'business' | 'recruitment';

const CATEGORIES: { value: Category; label: string; icon: string; desc: string }[] = [
  { value: 'support', label: 'Player Support', icon: '🎮', desc: 'Account, orders, dashboard issues' },
  { value: 'bug', label: 'Bug Report', icon: '🐛', desc: 'Found something broken?' },
  { value: 'feedback', label: 'Feedback', icon: '💬', desc: 'Suggestions and ideas' },
  { value: 'recruitment', label: 'Recruitment', icon: '⚔️', desc: 'Apply to join the team' },
  { value: 'business', label: 'Business / Sponsorship', icon: '🤝', desc: 'Partnership and sponsorship inquiries' },
  { value: 'general', label: 'General', icon: '📧', desc: 'Everything else' },
];

const BUSINESS_HOURS = [
  { day: 'Monday – Friday', hours: '10:00 AM – 8:00 PM IST' },
  { day: 'Saturday', hours: '11:00 AM – 6:00 PM IST' },
  { day: 'Sunday', hours: 'Closed' },
];

/** Sanitize user input — strip leading/trailing whitespace, limit length */
function sanitize(value: string, maxLen = 2000) {
  return value.trim().slice(0, maxLen);
}

/** Validate email format */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactPage() {
  const { db, loading } = useDatabase();
  const [category, setCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isValidEmail(form.email)) e.email = 'Please enter a valid email address.';
    if (!form.message.trim()) e.message = 'Message is required.';
    else if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const db = getDB();
      const msg = {
        id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        firstName: sanitize(form.name, 100),
        lastName: '',
        email: sanitize(form.email, 200),
        projectTitle: category ? `[${category}]` : '[Contact Form]',
        message: sanitize(form.message, 2000),
        read: false,
        createdAt: Date.now(),
      };
      db.contact_messages = [...(db.contact_messages ?? []), msg];
      await saveDB(db, 'contact_messages');
      setDone(true);
    } catch {
      setServerError('Failed to send. Please try WhatsApp or email directly.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = (hasErr: boolean) =>
    `w-full bg-white/5 border ${hasErr ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 ${hasErr ? 'focus:ring-red-500/30' : 'focus:ring-gold/30'} focus:border-gold/40 transition-all`;

  const contactLinks = [
    {
      icon: '📧',
      label: 'Email',
      value: db.settings?.supportEmail || 'Use the contact form',
      href: db.settings?.supportEmail ? sanitizeUrl(`mailto:${db.settings.supportEmail}`) : undefined,
      ariaLabel: db.settings?.supportEmail ? `Email us at ${db.settings.supportEmail}` : 'Send us an email via the contact form',
    },
    {
      icon: '📱',
      label: 'WhatsApp',
      value: 'Chat with us',
      href: db.settings?.supportWhatsApp ? sanitizeUrl(`https://wa.me/${db.settings.supportWhatsApp}`) : undefined,
      ariaLabel: 'Contact us on WhatsApp',
    },
    {
      icon: '💬',
      label: 'Discord',
      value: 'Join our server',
      href: db.settings?.socialDiscord ? sanitizeUrl(db.settings.socialDiscord) : undefined,
      ariaLabel: 'Join our Discord server',
    },
    {
      icon: '📸',
      label: 'Instagram',
      value: '@sbgarmy',
      href: db.settings?.socialInstagram ? sanitizeUrl(db.settings.socialInstagram) : undefined,
      ariaLabel: 'Follow us on Instagram',
    },
  ].filter(c => c.href && c.href !== '#');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">

          {/* Page header */}
          <header className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-6">
              <span className="text-gold text-sm font-black tracking-widest uppercase">Get In Touch</span>
            </div>
            <h1 className="text-5xl font-black tracking-wider mb-4">
              <span className="text-white">CONTACT </span>
              <span style={{
                background: 'linear-gradient(135deg, #d4af37, #f5e27e 50%, #b8960c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>US</span>
            </h1>
            <div className="w-16 h-1 mx-auto mb-4" style={{
              background: 'linear-gradient(90deg, transparent, #d4af37, transparent)'
            }} aria-hidden="true" />
            <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
              Have a question, bug to report, or want to partner with us? We're here to help.
              Reach out via the form or any of our contact channels below.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Sidebar — contact info */}
            <aside className="space-y-4" aria-label="Contact information">

              {/* Contact links */}
              <div>
                <h2 className="text-xs font-black text-gray-500 tracking-[0.4em] uppercase mb-4">Quick Contact</h2>
                <div className="space-y-3">
                  {contactLinks.length > 0 ? contactLinks.map(c => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.href?.startsWith('http') ? '_blank' : undefined}
                      rel={c.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      aria-label={c.ariaLabel}
                      className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-gold/20 hover:bg-gold/[0.03] transition-all group focus:outline-none focus:ring-2 focus:ring-gold/30"
                    >
                      <span className="text-2xl flex-shrink-0" aria-hidden="true">{c.icon}</span>
                      <div>
                        <p className="text-[10px] text-gray-500 font-black tracking-[0.4em] uppercase">{c.label}</p>
                        <p className="text-white text-sm font-bold group-hover:text-gold transition-colors">{c.value}</p>
                      </div>
                    </a>
                  )) : (
                    /* Default links when settings aren't loaded */
                    [
                      { icon: '📱', label: 'WhatsApp', value: 'Chat with us', href: '#' },
                      { icon: '💬', label: 'Discord', value: 'Join our server', href: '#' },
                      { icon: '📸', label: 'Instagram', value: '@sbgarmy', href: '#' },
                    ].map(c => (
                      <div key={c.label} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4">
                        <span className="text-2xl" aria-hidden="true">{c.icon}</span>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black tracking-[0.4em] uppercase">{c.label}</p>
                          <p className="text-white text-sm font-bold">{c.value}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Business hours */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                <h2 className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase mb-4">Business Hours</h2>
                <dl className="space-y-2.5">
                  {BUSINESS_HOURS.map(({ day, hours }) => (
                    <div key={day} className="flex justify-between items-center gap-2">
                      <dt className="text-xs text-gray-500 font-bold">{day}</dt>
                      <dd className={`text-xs font-black ${hours === 'Closed' ? 'text-red-400/70' : 'text-white'}`}>
                        {hours}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-gray-600">Response time: within 24 hours</p>
                </div>
              </div>

              {/* Response time */}
              <div className="bg-gold/[0.04] border border-gold/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                  <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Team Online</p>
                </div>
                <p className="text-xs text-gray-500">Our team is available during business hours to help you with any questions.</p>
              </div>
            </aside>

            {/* Form */}
            <div className="lg:col-span-2">
              {done ? (
                <div className="h-full flex items-center justify-center bg-white/[0.03] border border-white/5 rounded-2xl p-10 text-center min-h-[400px]">
                  <div>
                    <div className="text-6xl mb-5" aria-label="Success" role="img">✅</div>
                    <h3 className="text-white font-black text-2xl mb-2 tracking-widest uppercase">Message Sent!</h3>
                    <p className="text-gray-400 text-sm mb-2">We'll get back to you within 24 hours.</p>
                    <p className="text-gray-600 text-xs mb-8">Check your spam folder if you don't hear from us.</p>
                    <button
                      onClick={() => {
                        setDone(false);
                        setCategory(null);
                        setForm({ name: '', email: '', message: '' });
                        setErrors({});
                      }}
                      className="px-8 py-3 border border-gold/30 text-gold hover:text-white hover:border-gold/60 rounded-xl text-sm font-black tracking-widest uppercase transition-all focus:outline-none focus:ring-2 focus:ring-gold/40"
                    >
                      Send Another →
                    </button>
                  </div>
                </div>
              ) : !category ? (
                /* Category selector */
                <div>
                  <p className="text-sm text-gray-400 mb-5 font-bold">What can we help you with?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Contact categories">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        role="listitem"
                        className="flex items-start gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4 text-left hover:border-gold/30 hover:bg-gold/[0.03] transition-all group focus:outline-none focus:ring-2 focus:ring-gold/30"
                        aria-label={`${c.label} — ${c.desc}`}
                      >
                        <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">{c.icon}</span>
                        <div>
                          <p className="text-white font-black text-sm group-hover:text-gold transition-colors">{c.label}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{c.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Contact form */
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                    <button
                      onClick={() => setCategory(null)}
                      className="text-gray-500 hover:text-white transition-colors text-sm font-bold focus:outline-none focus:underline"
                      aria-label="Go back to category selection"
                    >
                      ← Back
                    </button>
                    <span className="text-gray-600 mx-1" aria-hidden="true">|</span>
                    <span className="text-gold font-black text-sm">
                      {CATEGORIES.find(c => c.value === category)?.icon}{' '}
                      {CATEGORIES.find(c => c.value === category)?.label}
                    </span>
                  </div>

                  <form onSubmit={submit} className="space-y-5" noValidate aria-label="Contact form">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label htmlFor="contact-name" className="block text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase mb-2">
                          Name <span className="text-red-400" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="contact-name"
                          required
                          type="text"
                          autoComplete="name"
                          maxLength={100}
                          className={inp(!!errors.name)}
                          value={form.name}
                          onChange={e => set('name', e.target.value)}
                          placeholder="Your name"
                          aria-describedby={errors.name ? 'contact-name-error' : undefined}
                          aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                          <p id="contact-name-error" className="mt-1 text-xs text-red-400" role="alert">{errors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="contact-email" className="block text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase mb-2">
                          Email <span className="text-red-400" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="contact-email"
                          required
                          type="email"
                          autoComplete="email"
                          maxLength={200}
                          className={inp(!!errors.email)}
                          value={form.email}
                          onChange={e => set('email', e.target.value)}
                          placeholder="your@email.com"
                          aria-describedby={errors.email ? 'contact-email-error' : undefined}
                          aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                          <p id="contact-email-error" className="mt-1 text-xs text-red-400" role="alert">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="contact-message" className="block text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase mb-2">
                        Message <span className="text-red-400" aria-hidden="true">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        maxLength={2000}
                        rows={7}
                        className={inp(!!errors.message) + ' resize-none'}
                        value={form.message}
                        onChange={e => set('message', e.target.value)}
                        placeholder={
                          category === 'bug'
                            ? 'Describe the bug: what happened, steps to reproduce, device/browser...'
                            : category === 'feedback'
                            ? 'Share your suggestions, ideas, or what you love about ${PUBLIC_BRAND_NAME}...'
                            : category === 'recruitment'
                            ? 'Tell us about your gaming background, role, game, and UID...'
                            : category === 'business'
                            ? 'Tell us about your company, sponsorship goals, and budget...'
                            : 'Your message...'
                        }
                        aria-describedby={errors.message ? 'contact-message-error' : 'contact-message-hint'}
                        aria-invalid={!!errors.message}
                      />
                      <div className="flex justify-between items-center mt-1">
                        {errors.message ? (
                          <p id="contact-message-error" className="text-xs text-red-400" role="alert">{errors.message}</p>
                        ) : (
                          <p id="contact-message-hint" className="text-xs text-gray-700">Minimum 10 characters</p>
                        )}
                        <span className={`text-xs tabular-nums ${form.message.length > 1800 ? 'text-orange-400' : 'text-gray-700'}`}>
                          {form.message.length}/2000
                        </span>
                      </div>
                    </div>

                    {/* Server error */}
                    {serverError && (
                      <div
                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-start gap-2"
                        role="alert"
                      >
                        <span className="text-lg flex-shrink-0" aria-hidden="true">⚠️</span>
                        <div>
                          <p className="font-bold">{serverError}</p>
                          <p className="text-xs text-red-400/70 mt-1">
                            You can also reach us on WhatsApp or Discord directly.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 text-black font-black rounded-xl text-sm tracking-widest uppercase transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold/60"
                      style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}
                      aria-busy={submitting}
                    >
                      {submitting ? '⏳ Sending...' : 'Send Message →'}
                    </button>

                    <p className="text-[10px] text-gray-700 text-center">
                      We typically respond within 24 hours during business hours.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer settings={db.settings} navigation={db.navigation} />
      <ScrollToTop />
    </div>
  );
}
