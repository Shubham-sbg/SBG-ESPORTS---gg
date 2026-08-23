import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateApplication } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowRight, ArrowLeft, Target, Users, Zap } from "lucide-react";

const GAMES = ["Free Fire", "BGMI", "Valorant", "COD Mobile"];
const ROLES = ["Fragger", "IGL (In-Game Leader)", "Support", "Sniper", "All-Rounder", "Content Creator", "Manager"];
const RANKS = { "Free Fire": ["Bronze","Silver","Gold","Platinum","Diamond","Heroic","Grandmaster"], BGMI: ["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Conqueror"], Valorant: ["Iron","Bronze","Silver","Gold","Platinum","Diamond","Immortal","Radiant"], "COD Mobile": ["Rookie","Veteran","Elite","Pro","Master","Legendary"] };

export default function JoinPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const { mutate: apply, isPending } = useCreateApplication();
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", whatsapp: "", game: "", role: "", gameUid: "", rank: "", experience: "", achievements: "", about: "", youtube: "", instagram: "", availability: "" });

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.fullName || !form.email || !form.game || !form.role) { toast({ title: "Please fill required fields", variant: "destructive" }); return; }
    apply(form as any, {
      onSuccess: () => setSubmitted(true),
      onError: () => toast({ title: "Submission failed. Please try again.", variant: "destructive" }),
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#060611" }}>
        <motion.div className="glass rounded-2xl p-12 max-w-md text-center border border-[rgba(34,197,94,0.2)]"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.1)] border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="font-orbitron text-2xl font-black text-white mb-3">Application Submitted!</h2>
          <p className="text-slate-400 font-inter text-sm leading-relaxed mb-6">
            Thank you for applying to SBG ARMY. Our management team will review your application and contact you via WhatsApp/Email within 3-5 business days.
          </p>
          <div className="px-4 py-3 rounded-lg bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.15)] text-orange-400 text-xs font-inter">
            Application ID: #{Date.now().toString().slice(-6)}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Recruitment Open</p>
          <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">Join the Army</h1>
          <p className="text-slate-400 font-inter">Apply to compete at the highest level with SBG ARMY.</p>
        </motion.div>

        {/* Why join */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[{ icon: Target, label: "Win Tournaments" }, { icon: Users, label: "Elite Team" }, { icon: Zap, label: "Grow Your Brand" }].map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.label} className="glass rounded-xl p-4 text-center border border-[rgba(255,255,255,0.05)]">
                <Icon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-white text-xs font-semibold font-inter">{b.label}</div>
              </div>
            );
          })}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-orbitron transition-all ${step >= s ? "bg-[#ff6b00] text-white" : "bg-[rgba(255,255,255,0.05)] text-slate-500"}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 transition-all ${step > s ? "bg-orange-500" : "bg-[rgba(255,255,255,0.06)]"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 font-inter mb-8">
          <span>Basic Info</span><span>Game Details</span><span>Profile</span>
        </div>

        <div className="glass rounded-2xl p-8 border border-[rgba(255,255,255,0.07)]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="font-orbitron text-white font-bold mb-6">Personal Information</h2>
                {[["fullName", "Full Name *"], ["email", "Email Address *"], ["whatsapp", "WhatsApp Number"]].map(([k, label]) => (
                  <div key={k}>
                    <label className="text-slate-400 text-xs font-inter block mb-1">{label}</label>
                    <input value={(form as any)[k]} onChange={(e) => upd(k, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm" placeholder={label.replace(" *", "")} />
                  </div>
                ))}
                <div>
                  <label className="text-slate-400 text-xs font-inter block mb-2">Game *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GAMES.map((g) => (
                      <button type="button" key={g} onClick={() => upd("game", g)}
                        className={`py-2.5 rounded-lg text-xs font-semibold font-inter transition-all ${form.game === g ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-inter block mb-2">Role *</label>
                  <select value={form.role} onChange={(e) => upd("role", e.target.value)} className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm">
                    <option value="">Select your role</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="font-orbitron text-white font-bold mb-6">Game Details</h2>
                {[["gameUid", "Game UID / Player ID"], ["experience", "Years of experience"]].map(([k, label]) => (
                  <div key={k}>
                    <label className="text-slate-400 text-xs font-inter block mb-1">{label}</label>
                    <input value={(form as any)[k]} onChange={(e) => upd(k, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm" placeholder={label} />
                  </div>
                ))}
                {form.game && (RANKS as any)[form.game] && (
                  <div>
                    <label className="text-slate-400 text-xs font-inter block mb-2">Current Rank</label>
                    <div className="flex flex-wrap gap-2">
                      {(RANKS as any)[form.game].map((r: string) => (
                        <button type="button" key={r} onClick={() => upd("rank", r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-inter transition-all ${form.rank === r ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-slate-400 text-xs font-inter block mb-1">Tournament Achievements</label>
                  <textarea value={form.achievements} onChange={(e) => upd("achievements", e.target.value)} rows={3}
                    className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm resize-none" placeholder="List your notable achievements..." />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-inter block mb-2">Availability</label>
                  <select value={form.availability} onChange={(e) => upd("availability", e.target.value)} className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm">
                    <option value="">Select availability</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="weekends_only">Weekends Only</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="font-orbitron text-white font-bold mb-6">Your Profile</h2>
                <div>
                  <label className="text-slate-400 text-xs font-inter block mb-1">About You</label>
                  <textarea value={form.about} onChange={(e) => upd("about", e.target.value)} rows={4}
                    className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm resize-none" placeholder="Tell us about yourself, your playstyle, and why you want to join SBG ARMY..." />
                </div>
                {[["youtube", "YouTube Channel URL"], ["instagram", "Instagram Profile URL"]].map(([k, label]) => (
                  <div key={k}>
                    <label className="text-slate-400 text-xs font-inter block mb-1">{label}</label>
                    <input value={(form as any)[k]} onChange={(e) => upd(k, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg input-dark font-inter text-sm" placeholder={label} />
                  </div>
                ))}
                <div className="p-4 rounded-xl bg-[rgba(255,107,0,0.05)] border border-[rgba(255,107,0,0.15)]">
                  <p className="text-slate-400 text-xs font-inter leading-relaxed">
                    By submitting, you agree to our terms and confirm that all information provided is accurate. Our team will review your application within 3-5 business days.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white text-sm font-inter transition-all">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#ff6b00] hover:bg-[#e55e00] text-white font-semibold text-sm font-inter transition-colors">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-[#ff6b00] hover:bg-[#e55e00] disabled:opacity-50 text-white font-bold text-sm font-inter transition-colors">
                {isPending ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
