import { useEffect, useRef, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { trackPageVisit } from '@/lib/analytics';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getDB, saveDB, CollabRequest } from '@/lib/database';

export default function CollaboratePage() {
  const { db } = useDatabase();
  const tracked = useRef(false);
  const [form, setForm] = useState({ name: '', organization: '', purpose: '', budget: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    applyTheme(db.settings);
    if (!tracked.current) { trackPageVisit('/collaborate'); tracked.current = true; }
  }, [db.settings]);

  const submit = () => {
    setError('');
    if (!form.name.trim() || !form.organization.trim() || !form.purpose.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.'); return;
    }
    const db2 = getDB();
    if (!db2.collab_requests) db2.collab_requests = [];
    const req: CollabRequest = {
      id: `cr_${Date.now()}`,
      name: form.name.trim(),
      organization: form.organization.trim(),
      purpose: form.purpose.trim(),
      budget: form.budget.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      message: form.message.trim() || undefined,
      read: false,
      status: 'new',
      createdAt: Date.now(),
    };
    db2.collab_requests.push(req);
    saveDB(db2);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-24 pb-20 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            🤝 Collaborations
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Partner With <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>Us</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">Interested in sponsorship, content collaboration, or business partnerships? Reach out to us.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-8">
          {submitted ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-black text-xl text-white mb-2">Request Submitted!</h3>
              <p className="text-gray-400 text-sm">Our team will review your request and get back to you within 48 hours.</p>
              <button onClick={() => { setSubmitted(false); setForm({ name: '', organization: '', purpose: '', budget: '', email: '', phone: '', message: '' }); }}
                className="mt-6 px-6 py-2.5 rounded-lg bg-orange-500 text-black text-sm font-bold hover:bg-orange-400">Submit Another</button>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="font-black text-xl text-white">Partnership Inquiry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="label">Your Name *</label><input className="inp" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="label">Organization *</label><input className="inp" placeholder="Company / Brand / Channel" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} /></div>
                <div><label className="label">Email *</label><input className="inp" placeholder="your@email.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><label className="label">Phone / WhatsApp</label><input className="inp" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div><label className="label">Purpose *</label><input className="inp" placeholder="e.g. Sponsorship, Content Collab, Tournament Partner" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} /></div>
              <div><label className="label">Budget (optional)</label><input className="inp" placeholder="e.g. ₹10,000 or Open to discuss" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
              <div><label className="label">Additional Details</label><textarea className="inp min-h-[100px]" placeholder="Tell us more about the collaboration..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={submit}
                className="w-full py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all"
                style={{ background: 'var(--sbg-primary, #ff6b00)' }}>
                Submit Partnership Request
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
