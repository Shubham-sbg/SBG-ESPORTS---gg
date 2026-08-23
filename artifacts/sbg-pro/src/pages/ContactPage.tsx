import { useState } from "react";
import { motion } from "framer-motion";
import { useCreateContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Mail, Phone, MessageCircle, ExternalLink } from "lucide-react";

const CATEGORIES = ["General Inquiry", "Sponsorship", "Business Partnership", "Technical Support", "Recruitment", "Media & Press", "Other"];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", category: "General Inquiry", message: "" });
  const [sent, setSent] = useState(false);
  const { mutate: sendContact, isPending } = useCreateContact();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast({ title: "Please fill all fields", variant: "destructive" }); return; }
    sendContact(form as any, {
      onSuccess: () => setSent(true),
      onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Get in Touch</p>
          <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">Contact Us</h1>
          <p className="text-slate-400 font-inter">Reach out for sponsorship, partnerships, support, or general inquiries.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {[
              { icon: Mail, label: "Support Email", value: "support@sbgarmy.in", href: "mailto:support@sbgarmy.in" },
              { icon: MessageCircle, label: "WhatsApp", value: "Available on request", href: "#" },
              { icon: Phone, label: "Sponsorship", value: "sponsorship@sbgarmy.in", href: "mailto:sponsorship@sbgarmy.in" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.a key={item.label} href={item.href} className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] flex items-center gap-4 hover:border-[rgba(255,107,0,0.2)] transition-all group"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,107,0,0.1)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-inter">{item.label}</div>
                    <div className="text-white text-sm font-inter mt-0.5 group-hover:text-orange-400 transition-colors">{item.value}</div>
                  </div>
                </motion.a>
              );
            })}

            <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
              <h3 className="text-white font-semibold font-inter text-sm mb-3">Follow Us</h3>
              <div className="flex flex-wrap gap-2">
                {["YouTube", "Instagram", "Discord", "Telegram"].map((platform) => (
                  <a key={platform} href="#" className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-[rgba(255,255,255,0.08)] hover:text-orange-400 hover:border-[rgba(255,107,0,0.3)] transition-all font-inter flex items-center gap-1">
                    {platform} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.08)]">
              <div className="text-orange-400 text-xs font-semibold font-inter mb-1">Response Time</div>
              <div className="text-slate-400 text-sm font-inter">General: Within 24-48 hours</div>
              <div className="text-slate-400 text-sm font-inter">Sponsorship: Within 3-5 business days</div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {sent ? (
              <motion.div className="glass rounded-2xl p-12 text-center border border-[rgba(34,197,94,0.2)]"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="font-orbitron text-xl font-bold text-white mb-2">Message Sent!</h2>
                <p className="text-slate-400 font-inter text-sm">We'll get back to you as soon as possible.</p>
              </motion.div>
            ) : (
              <motion.form onSubmit={handleSubmit} className="glass rounded-2xl p-8 border border-[rgba(255,255,255,0.07)] space-y-5"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="font-orbitron text-white font-bold mb-2">Send a Message</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-xs font-inter block mb-1">Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-inter block mb-1">Email *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm" placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-inter block mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-inter block mb-1">Message *</label>
                  <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={6} className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm resize-none" placeholder="Write your message here..." />
                </div>
                <button type="submit" disabled={isPending}
                  className="w-full py-3.5 bg-[#ff6b00] hover:bg-[#e55e00] disabled:opacity-50 text-white font-bold rounded-xl font-inter text-sm transition-colors">
                  {isPending ? "Sending..." : "Send Message"}
                </button>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
