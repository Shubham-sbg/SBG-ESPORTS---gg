import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useEffect, useRef, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { trackPageVisit } from '@/lib/analytics';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tournament, Registration, getDB, saveDB } from '@/lib/database';
import ExpandableText from '@/components/common/ExpandableText';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

interface RegForm {
  teamName: string;
  leaderName: string;
  leaderUid: string;
  leaderWhatsApp: string;
  leaderAge: string;
  player2Name: string;
  player2Uid: string;
  player3Name: string;
  player3Uid: string;
  player4Name: string;
  player4Uid: string;
  substituteUid: string;
  paymentScreenshot: string;
  followProof: string;
  agreeTerms: boolean;
}

const EMPTY_FORM: RegForm = {
  teamName: '', leaderName: '', leaderUid: '', leaderWhatsApp: '', leaderAge: '',
  player2Name: '', player2Uid: '', player3Name: '', player3Uid: '',
  player4Name: '', player4Uid: '', substituteUid: '',
  paymentScreenshot: '', followProof: '', agreeTerms: false,
};

function RegistrationModal({ tournament, onClose }: { tournament: Tournament; onClose: () => void }) {
  const [form, setForm] = useState<RegForm>(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const isPaid = tournament.entryType === 'paid';

  const set = (k: keyof RegForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleImg = (field: 'paymentScreenshot' | 'followProof', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set(field, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (step === 1) {
      if (!form.teamName.trim()) return 'Team name is required.';
      if (!form.leaderName.trim()) return 'Team leader name is required.';
      if (!form.leaderUid.trim()) return 'Team leader UID is required.';
      if (!form.leaderWhatsApp.trim()) return 'WhatsApp number is required.';
      if (!form.leaderAge.trim()) return 'Leader age is required.';
    }
    if (step === 2) {
      if (!form.player2Uid.trim()) return 'Player 2 UID is required.';
      if (!form.player3Uid.trim()) return 'Player 3 UID is required.';
    }
    if (step === 3) {
      if (isPaid && !form.paymentScreenshot) return 'Payment screenshot is required.';
      if (!form.followProof) return 'Follow proof screenshot is required.';
      if (!form.agreeTerms) return 'You must agree to the terms.';
    }
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const submit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setTimeout(() => {
      const reg: Registration = {
        id: `reg_${Date.now()}`,
        tournamentId: tournament.id,
        tournamentTitle: tournament.title,
        teamName: form.teamName.trim(),
        leaderName: form.leaderName.trim(),
        leaderUid: form.leaderUid.trim(),
        leaderWhatsApp: form.leaderWhatsApp.trim(),
        leaderAge: form.leaderAge.trim(),
        player2Uid: form.player2Uid.trim() || undefined,
        player3Uid: form.player3Uid.trim() || undefined,
        player4Uid: form.player4Uid.trim() || undefined,
        substituteUid: form.substituteUid.trim() || undefined,
        paymentScreenshot: form.paymentScreenshot || undefined,
        paymentStatus: isPaid ? 'pending' : 'verified',
        status: 'pending',
        createdAt: Date.now(),
      };
      const db = getDB();
      if (!db.registrations) db.registrations = [];
      db.registrations.push(reg);
      saveDB(db);
      setSubmitting(false);
      setDone(true);
    }, 500);
  };

  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';
  const label = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5';

  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-md p-8 text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <h3 className="font-black text-2xl text-white">Registration Submitted!</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your team <span className="text-orange-400 font-bold">{form.teamName}</span> has been registered for <span className="text-white font-semibold">{tournament.title}</span>.
          {isPaid && <> Your payment is under review.</>} We'll contact you on WhatsApp.
        </p>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest hover:bg-orange-400 transition-colors">
          DONE
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-lg my-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-white">Register for Tournament</h3>
            <p className="text-orange-400 text-xs font-bold mt-0.5 truncate">{tournament.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl font-bold leading-none ml-4">✕</button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-4 flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-white/10'}`} />
          ))}
        </div>
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-500 font-semibold">
            Step {step} of 3 — {step === 1 ? 'Team Leader Info' : step === 2 ? 'Team Members' : 'Payment & Proof'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div><label className={label}>Team Name *</label><input className={inp} placeholder="e.g. SBG Soldiers" value={form.teamName} onChange={e => set('teamName', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>Leader Name *</label><input className={inp} placeholder="Full name" value={form.leaderName} onChange={e => set('leaderName', e.target.value)} /></div>
                <div><label className={label}>Leader Age *</label><input className={inp} placeholder="e.g. 18" value={form.leaderAge} onChange={e => set('leaderAge', e.target.value)} /></div>
              </div>
              <div><label className={label}>Leader UID / Player ID *</label><input className={inp} placeholder={`Your ${tournament.game} UID`} value={form.leaderUid} onChange={e => set('leaderUid', e.target.value)} /></div>
              <div><label className={label}>WhatsApp Number *</label><input className={inp} placeholder="+91 9876543210" value={form.leaderWhatsApp} onChange={e => set('leaderWhatsApp', e.target.value)} /></div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs text-gray-500 pb-1">Enter UID and name for each team member. Player 2 and 3 are required.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Player 2 Name</label><input className={inp} placeholder="Name" value={form.player2Name} onChange={e => set('player2Name', e.target.value)} /></div>
                <div><label className={label}>Player 2 UID *</label><input className={inp} placeholder="UID" value={form.player2Uid} onChange={e => set('player2Uid', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Player 3 Name</label><input className={inp} placeholder="Name" value={form.player3Name} onChange={e => set('player3Name', e.target.value)} /></div>
                <div><label className={label}>Player 3 UID *</label><input className={inp} placeholder="UID" value={form.player3Uid} onChange={e => set('player3Uid', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Player 4 Name</label><input className={inp} placeholder="Name (optional)" value={form.player4Name} onChange={e => set('player4Name', e.target.value)} /></div>
                <div><label className={label}>Player 4 UID</label><input className={inp} placeholder="UID (optional)" value={form.player4Uid} onChange={e => set('player4Uid', e.target.value)} /></div>
              </div>
              <div><label className={label}>Substitute UID (optional)</label><input className={inp} placeholder="Sub player UID" value={form.substituteUid} onChange={e => set('substituteUid', e.target.value)} /></div>
            </>
          )}

          {step === 3 && (
            <>
              {isPaid && (
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                  <p className="text-orange-400 text-xs font-bold mb-1">Entry Fee: ₹{tournament.entryFee}</p>
                  <p className="text-gray-400 text-xs">Pay via UPI and upload your payment screenshot below.</p>
                </div>
              )}
              {isPaid && (
                <div>
                  <label className={label}>Payment Screenshot *</label>
                  <div className={`${inp} cursor-pointer flex items-center gap-3 p-3`} onClick={() => document.getElementById('pay-proof')?.click()}>
                    {form.paymentScreenshot ? (
                      <><Image src={form.paymentScreenshot} alt="" objectFit="contain" className="h-10 rounded object-contain" /><span className="text-green-400 text-xs font-bold">✓ Uploaded</span></>
                    ) : (
                      <span className="text-gray-500 text-sm">📸 Click to upload payment screenshot</span>
                    )}
                  </div>
                  <input id="pay-proof" type="file" accept="image/*" className="hidden" onChange={e => handleImg('paymentScreenshot', e)} />
                </div>
              )}
              <div>
                <label className={label}>Follow Proof Screenshot *</label>
                <p className="text-gray-600 text-xs mb-2">Upload a screenshot showing you follow ${PUBLIC_BRAND_NAME} on Instagram/YouTube.</p>
                <div className={`${inp} cursor-pointer flex items-center gap-3 p-3`} onClick={() => document.getElementById('follow-proof')?.click()}>
                  {form.followProof ? (
                    <><Image src={form.followProof} alt="" objectFit="contain" className="h-10 rounded object-contain" /><span className="text-green-400 text-xs font-bold">✓ Uploaded</span></>
                  ) : (
                    <span className="text-gray-500 text-sm">📸 Click to upload follow proof</span>
                  )}
                </div>
                <input id="follow-proof" type="file" accept="image/*" className="hidden" onChange={e => handleImg('followProof', e)} />
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${form.agreeTerms ? 'bg-orange-500 border-orange-500' : 'border-white/20 group-hover:border-orange-500/50'}`}
                  onClick={() => set('agreeTerms', !form.agreeTerms)}>
                  {form.agreeTerms && <span className="text-black text-xs font-black">✓</span>}
                </div>
                <span className="text-gray-400 text-xs leading-relaxed">I confirm that all provided information is accurate and I agree to ${PUBLIC_BRAND_NAME} tournament rules and code of conduct.</span>
              </label>
            </>
          )}

          {error && <p className="text-red-400 text-xs font-semibold bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          {step > 1 && (
            <button onClick={() => { setStep(s => s - 1); setError(''); }}
              className="px-6 py-3 rounded-xl bg-white/10 text-gray-300 text-sm font-bold hover:bg-white/15 transition-colors">
              ← Back
            </button>
          )}
          <button
            onClick={step === 3 ? submit : next}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest hover:bg-orange-400 disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting...' : step === 3 ? 'SUBMIT REGISTRATION' : 'NEXT →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TournamentCard({ t, onRegister }: { t: Tournament; onRegister: (t: Tournament) => void }) {
  const now = Date.now();
  const deadline = new Date(t.registrationDeadline).getTime();
  const isExpired = deadline < now;
  const isClosed = t.registrationStatus === 'closed' || isExpired;
  const isPaused = t.registrationStatus === 'paused';

  const statusColor = isClosed
    ? 'bg-red-500/20 text-red-400'
    : isPaused
    ? 'bg-yellow-500/20 text-yellow-400'
    : 'bg-green-500/20 text-green-400';

  const statusLabel = isClosed ? 'Closed' : isPaused ? 'Paused' : 'Open';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden hover:border-orange-500/30 transition-all duration-300">
      <div className="relative">
        {t.logo ? (
          <Image src={t.logo} alt={t.title} objectFit="cover" className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff6b0022, #e9456022)' }}>
            <span className="text-4xl">🏆</span>
          </div>
        )}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold ${statusColor}`}>
          {statusLabel}
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-black text-white text-lg leading-tight">{t.title}</h3>
          <p className="text-orange-400 text-sm font-semibold mt-0.5">{t.game} · {t.type}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/5">
            <p className="text-gray-500">Prize Pool</p>
            <p className="text-white font-bold mt-0.5">{t.prizePool || '—'}</p>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <p className="text-gray-500">Entry Fee</p>
            <p className="text-white font-bold mt-0.5">
              {t.entryType === 'free' ? 'FREE' : `₹${t.entryFee}`}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <p className="text-gray-500">Slots</p>
            <p className="text-white font-bold mt-0.5">{t.slots}</p>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <p className="text-gray-500">Match Date</p>
            <p className="text-white font-bold mt-0.5">{t.matchDate || '—'}</p>
          </div>
        </div>

        {t.description && (
          <ExpandableText text={t.description} limit={150} className="text-gray-500 text-xs leading-relaxed" />
        )}

        {!isClosed && (
          <div className="text-xs text-gray-500">
            Registration deadline: <span className="text-orange-400">{t.registrationDeadline}</span>
          </div>
        )}

        <button
          onClick={() => !isClosed && !isPaused && onRegister(t)}
          disabled={isClosed || isPaused}
          className={`w-full py-2.5 rounded-xl text-center text-sm font-bold tracking-widest uppercase transition-all
            ${isClosed
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : isPaused
              ? 'bg-yellow-500/20 text-yellow-500 cursor-not-allowed'
              : 'bg-orange-500 text-black hover:bg-orange-400 cursor-pointer'
            }`}>
          {isClosed ? 'Registration Closed' : isPaused ? 'Registration Paused' : 'Register Now'}
        </button>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const { db, loading } = useDatabase();
  const tracked = useRef(false);
  const [registeringFor, setRegisteringFor] = useState<Tournament | null>(null);

  useEffect(() => {
    if (!loading) {
      applyTheme(db.settings);
      if (!tracked.current) {
        trackPageVisit('/tournaments');
        tracked.current = true;
      }
    }
  }, [loading, db.settings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const visibleTournaments = (db.tournaments || []).filter(t => t.visible);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-400 text-xs font-bold tracking-[0.3em] uppercase mb-3">Compete</p>
            <h1 className="font-black text-4xl md:text-5xl text-white tracking-tight">
              TOURNAMENTS
            </h1>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Join official {PUBLIC_BRAND_NAME} tournaments. Register your team and compete for glory.
            </p>
          </div>

          {visibleTournaments.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-5">🏆</div>
              <h2 className="font-black text-xl text-white mb-2">No Tournaments Yet</h2>
              <p className="text-gray-500 text-sm">Check back soon. New tournaments are being added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleTournaments.map(t => (
                <TournamentCard key={t.id} t={t} onRegister={setRegisteringFor} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />

      {registeringFor && (
        <RegistrationModal tournament={registeringFor} onClose={() => setRegisteringFor(null)} />
      )}
    </div>
  );
}
