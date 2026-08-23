import { useState } from 'react';
import { getDB, saveDB, ContactMessage } from '@/lib/database';

export default function ContactSection() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', projectTitle: '', message: '',
  });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setError('');
    if (!form.firstName.trim()) { setError('First name is required.'); return; }
    if (!form.email.trim() || !form.email.includes('@')) { setError('A valid email is required.'); return; }
    if (!form.message.trim()) { setError('Message cannot be empty.'); return; }

    const db = getDB();
    if (!db.contact_messages) db.contact_messages = [];

    const msg: ContactMessage = {
      id: `cm_${Date.now()}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      projectTitle: form.projectTitle.trim(),
      message: form.message.trim(),
      read: false,
      createdAt: Date.now(),
    };

    db.contact_messages.push(msg);
    saveDB(db);
    setSubmitted(true);
    setForm({ firstName: '', lastName: '', email: '', projectTitle: '', message: '' });
  };

  return (
    <section id="contact" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            📬 Contact Us
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Reach Us <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>Now</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
            Got a collaboration idea, sponsorship proposal, or just want to connect? Drop us a message.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm p-8">
          {submitted ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-black text-xl text-white mb-2">Message Sent!</h3>
              <p className="text-gray-400 text-sm">We'll get back to you as soon as possible.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all duration-300 hover:opacity-90"
                style={{ background: 'var(--sbg-primary, #ff6b00)' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    className="inp"
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    className="inp"
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  className="inp"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Project Title</label>
                <input
                  className="inp"
                  placeholder="e.g. Sponsorship Proposal, Collaboration Idea"
                  value={form.projectTitle}
                  onChange={e => setForm(f => ({ ...f, projectTitle: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Message *</label>
                <textarea
                  className="inp min-h-[130px] resize-none"
                  placeholder="Tell us about your project or inquiry..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-medium">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--sbg-primary, #ff6b00)' }}>
                Send Message
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
