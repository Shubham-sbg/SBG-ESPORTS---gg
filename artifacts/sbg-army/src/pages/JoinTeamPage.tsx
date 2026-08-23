import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import type { RecruitmentOpening } from '@/lib/database';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Combobox from '@/components/shared/Combobox';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const ROLES = [
  'IGL (In-Game Leader)',
  'Entry Fragger / Assaulter',
  'Sniper / AWPer',
  'Support / Healer',
  'Strategist',
  'Duelist / Initiator',
  'Content Creator / Streamer',
  'Video Editor / Designer',
  'Coach / Analyst',
  'Team Manager',
  'Other Position',
];

const GAMES = ['BGMI', 'Valorant', 'Free Fire', 'COD Mobile', 'League of Legends', 'Counter-Strike 2', 'Other / Multi-Game'];

interface FormData {
  openingId: string;
  openingTitle: string;
  name: string;
  age: string;
  email: string;
  whatsapp: string;
  country: string;
  game: string;
  role: string;
  ign: string;
  uid: string;
  rank: string;
  experienceYears: number;
  currentOrg: string;
  achievements: string;
  about: string;
  availability: string;
  youtube: string;
  instagram: string;
  discord: string;
  portfolioUrl: string;
  resumeUrl: string;
  photoUrl: string;
  customAnswers: Record<string, string>;
  termsAccepted: boolean;
}

const INITIAL_FORM: FormData = {
  openingId: '',
  openingTitle: '',
  name: '',
  age: '18',
  email: '',
  whatsapp: '',
  country: 'India',
  game: 'BGMI',
  role: 'Entry Fragger / Assaulter',
  ign: '',
  uid: '',
  rank: '',
  experienceYears: 1,
  currentOrg: '',
  achievements: '',
  about: '',
  availability: '15-20 hours/week',
  youtube: '',
  instagram: '',
  discord: '',
  portfolioUrl: '',
  resumeUrl: '',
  photoUrl: '',
  customAnswers: {},
  termsAccepted: false,
};

export default function JoinTeamPage() {
  const { db, loading } = useDatabase();
  const [openings, setOpenings] = useState<RecruitmentOpening[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<RecruitmentOpening | null>(null);

  const [form, setForm]         = useState<FormData>(INITIAL_FORM);
  const [step, setStep]         = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto]   = useState(false);
  const [done, setDone]         = useState(false);
  const [appId, setAppId]       = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  // Load active openings & check URL query params
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || "") + '/api/recruitment/openings')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.openings)) {
          setOpenings(data.openings);

          // Check if openingId is in URL query
          const params = new URLSearchParams(window.location.search);
          const qId = params.get('openingId');
          if (qId) {
            const matched = data.openings.find((o: RecruitmentOpening) => o.id === qId);
            if (matched) {
              setSelectedOpening(matched);
              setForm(f => ({
                ...f,
                openingId: matched.id,
                openingTitle: matched.title,
                game: matched.game || f.game,
                role: matched.position === 'Player' ? 'Entry Fragger / Assaulter' : matched.position,
              }));
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const setField = (k: keyof FormData, val: any) => setForm(f => ({ ...f, [k]: val }));

  const handleSelectOpening = (op: RecruitmentOpening | null) => {
    setSelectedOpening(op);
    if (op) {
      setForm(f => ({
        ...f,
        openingId: op.id,
        openingTitle: op.title,
        game: op.game || f.game,
      }));
    } else {
      setForm(f => ({ ...f, openingId: '', openingTitle: '' }));
    }
  };

  // Upload handler for photo & resume
  const handleFileUpload = async (file: File, target: 'photo' | 'resume') => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    if (target === 'photo') setUploadingPhoto(true);
    else setUploadingResume(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/recruitment/upload', { credentials: "include",
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        const data = await res.json();
        if (data.ok && data.url) {
          if (target === 'photo') setField('photoUrl', data.url);
          else setField('resumeUrl', data.url);
        } else {
          alert(data.error || 'Failed to upload file. Please try again.');
        }

        if (target === 'photo') setUploadingPhoto(false);
        else setUploadingResume(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert('Upload failed.');
      if (target === 'photo') setUploadingPhoto(false);
      else setUploadingResume(false);
    }
  };

  // Submit Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.termsAccepted) {
      setError('Please accept the recruitment terms & consent.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        openingId: form.openingId,
        openingTitle: form.openingTitle || selectedOpening?.title || '',
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        age: form.age,
        country: form.country,
        game: form.game,
        ign: form.ign,
        uid: form.uid,
        role: form.role,
        currentOrg: form.currentOrg,
        rank: form.rank,
        experienceYears: form.experienceYears,
        experience: `${form.experienceYears} Years Competitive Experience`,
        achievements: form.achievements,
        about: form.about,
        youtube: form.youtube,
        instagram: form.instagram,
        socials: {
          youtube: form.youtube,
          instagram: form.instagram,
          discord: form.discord,
          portfolioUrl: form.portfolioUrl,
        },
        resumeUrl: form.resumeUrl,
        photoUrl: form.photoUrl,
        customAnswers: form.customAnswers,
        availability: form.availability,
      };

      const res = await fetch((import.meta.env.VITE_API_URL || "") + '/api/recruitment/apply', { credentials: "include",
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok) {
        setAppId(data.id);
        setDone(true);
      } else {
        setError(data.error || 'Failed to submit application. Please check your form and try again.');
      }
    } catch (err) {
      setError('Network error. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col justify-between">
        <Navbar settings={db.settings} navigation={db.navigation} />
        <div className="pt-28 pb-20 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white/3 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-amber-500/10">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl mx-auto animate-bounce">
              🏆
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wider">APPLICATION SUBMITTED!</h2>
              <p className="text-xs text-amber-400 font-mono mt-1">Application ID: {appId}</p>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Thank you for applying to ${PUBLIC_BRAND_NAME}. Our esports management team will review your application against our active roster requirements. If selected, we will contact you on WhatsApp or Discord!
            </p>
            <div className="pt-2">
              <a href="/" className="inline-block w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/20">
                Back to Homepage
              </a>
            </div>
          </div>
        </div>
        <Footer settings={db.settings} navigation={db.navigation} />
      </div>
    );
  }

  const inpClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors';
  const lblClass = 'block text-[10px] font-black text-gray-400 tracking-wider uppercase mb-1.5';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col justify-between">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              OFFICIAL ${PUBLIC_BRAND_NAME} RECRUITMENT
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-wider">
              JOIN THE <span className="text-amber-400" style={{ textShadow: '0 0 30px #d4af3788' }}>ESPORTS ARMY</span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto">
              Compete under the ${PUBLIC_BRAND_NAME} banner in tier-1 competitive leagues. Fill out the application below to be scouted by our management team.
            </p>
          </div>

          {/* Active Openings Selector */}
          {openings.length > 0 && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider">Active Recruitment Openings</span>
                {selectedOpening && (
                  <button onClick={() => handleSelectOpening(null)} className="text-[10px] text-amber-400 hover:underline">
                    Clear Selection (General Application)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {openings.map(op => {
                  const isSelected = selectedOpening?.id === op.id;
                  return (
                    <div
                      key={op.id}
                      onClick={() => handleSelectOpening(op)}
                      className={`cursor-pointer border rounded-xl p-3.5 transition-all ${isSelected ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-white/10 bg-white/3 hover:bg-white/5'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {op.position}
                        </span>
                        <span className="text-[10px] text-gray-400">{op.game}</span>
                      </div>
                      <h4 className="font-bold text-white text-xs truncate">{op.title}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{op.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between gap-2 max-w-xl mx-auto">
            {[
              { num: 1, label: 'Personal Info' },
              { num: 2, label: 'Gaming Profile' },
              { num: 3, label: 'Media & Files' },
              { num: 4, label: 'Motivation' },
            ].map(s => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div
                  onClick={() => step > s.num && setStep(s.num)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs cursor-pointer transition-all ${step === s.num ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : step > s.num ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="hidden sm:inline text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
                {s.num < 4 && <div className={`flex-1 h-px ${step > s.num ? 'bg-amber-500/50' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white/3 border border-white/8 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* ── STEP 1: PERSONAL INFORMATION ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider border-b border-white/8 pb-3">
                  Step 1: Personal Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lblClass}>Full Name *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="Your legal full name"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Email Address *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                      placeholder="your.email@gmail.com"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>WhatsApp / Phone Number *</label>
                    <input
                      required
                      type="text"
                      value={form.whatsapp}
                      onChange={e => setField('whatsapp', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Age *</label>
                    <input
                      required
                      type="number"
                      min="12"
                      max="40"
                      value={form.age}
                      onChange={e => setField('age', e.target.value)}
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Country *</label>
                    <input
                      required
                      type="text"
                      value={form.country}
                      onChange={e => setField('country', e.target.value)}
                      placeholder="India"
                      className={inpClass}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.name || !form.email || !form.whatsapp) {
                        alert('Please fill out all required personal fields.');
                        return;
                      }
                      setStep(2);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/20">
                    Next: Gaming Profile →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: GAMING PROFILE ── */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider border-b border-white/8 pb-3">
                  Step 2: Gaming & Competitive Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lblClass}>Primary Game *</label>
                    <Combobox
                      value={form.game}
                      onChange={e => setField('game', e.target.value)}
                      className={inpClass}>
                      {GAMES.map(g => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
                    </Combobox>
                  </div>

                  <div>
                    <label className={lblClass}>Role Applying For *</label>
                    <Combobox
                      value={form.role}
                      onChange={e => setField('role', e.target.value)}
                      className={inpClass}>
                      {ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
                    </Combobox>
                  </div>

                  <div>
                    <label className={lblClass}>In-Game Name (IGN) *</label>
                    <input
                      required
                      type="text"
                      value={form.ign}
                      onChange={e => setField('ign', e.target.value)}
                      placeholder="e.g. SBG_Mortal"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>In-Game UID / Player ID *</label>
                    <input
                      required
                      type="text"
                      value={form.uid}
                      onChange={e => setField('uid', e.target.value)}
                      placeholder="e.g. 5123456789"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Current Rank *</label>
                    <input
                      required
                      type="text"
                      value={form.rank}
                      onChange={e => setField('rank', e.target.value)}
                      placeholder="e.g. Conqueror / Radiant / Ace Dominator"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Years of Competitive Experience *</label>
                    <input
                      type="number"
                      min="0"
                      value={form.experienceYears}
                      onChange={e => setField('experienceYears', Number(e.target.value))}
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Current or Previous Team / Org</label>
                    <input
                      type="text"
                      value={form.currentOrg}
                      onChange={e => setField('currentOrg', e.target.value)}
                      placeholder="e.g. Free Agent / Org Name"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Weekly Availability</label>
                    <input
                      type="text"
                      value={form.availability}
                      onChange={e => setField('availability', e.target.value)}
                      placeholder="e.g. 20+ hours/week"
                      className={inpClass}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 border border-white/10 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.ign || !form.uid || !form.rank) {
                        alert('Please fill out IGN, Game UID, and Rank.');
                        return;
                      }
                      setStep(3);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/20">
                    Next: Media & Attachments →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: MEDIA & ATTACHMENTS ── */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider border-b border-white/8 pb-3">
                  Step 3: Document Attachments & Social Media
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Profile Photo Upload */}
                  <div className="space-y-2">
                    <label className={lblClass}>Profile Photo (PNG/JPG)</label>
                    <div className="border-2 border-dashed border-white/10 hover:border-amber-500/40 rounded-2xl p-4 text-center transition-all bg-white/2">
                      {form.photoUrl ? (
                        <div className="flex items-center gap-3">
                          <img src={form.photoUrl} alt="Avatar" className="w-12 h-12 rounded-xl object-cover border border-amber-500/40" />
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-xs text-emerald-400 font-bold block">✓ Photo Uploaded</span>
                            <span className="text-[10px] text-gray-500 truncate block">{form.photoUrl}</span>
                          </div>
                          <button onClick={() => setField('photoUrl', '')} className="text-xs text-red-400">✕</button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'photo')}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label htmlFor="photo-upload" className="cursor-pointer space-y-1 block">
                            <div className="text-2xl">📸</div>
                            <span className="text-xs font-bold text-amber-400 block">
                              {uploadingPhoto ? 'Uploading Photo...' : 'Upload Profile Photo'}
                            </span>
                            <span className="text-[10px] text-gray-500 block">PNG, JPG up to 10MB</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div className="space-y-2">
                    <label className={lblClass}>Resume / Gameplay Portfolio PDF</label>
                    <div className="border-2 border-dashed border-white/10 hover:border-amber-500/40 rounded-2xl p-4 text-center transition-all bg-white/2">
                      {form.resumeUrl ? (
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">📄</div>
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-xs text-emerald-400 font-bold block">✓ Resume Uploaded</span>
                            <span className="text-[10px] text-gray-500 truncate block">{form.resumeUrl}</span>
                          </div>
                          <button onClick={() => setField('resumeUrl', '')} className="text-xs text-red-400">✕</button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'resume')}
                            className="hidden"
                            id="resume-upload"
                          />
                          <label htmlFor="resume-upload" className="cursor-pointer space-y-1 block">
                            <div className="text-2xl">📑</div>
                            <span className="text-xs font-bold text-amber-400 block">
                              {uploadingResume ? 'Uploading Document...' : 'Upload Resume / PDF'}
                            </span>
                            <span className="text-[10px] text-gray-500 block">PDF, DOC, DOCX up to 10MB</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={lblClass}>YouTube Channel / Montage Link</label>
                    <input
                      type="text"
                      value={form.youtube}
                      onChange={e => setField('youtube', e.target.value)}
                      placeholder="youtube.com/@yourchannel"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Instagram Handle</label>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={e => setField('instagram', e.target.value)}
                      placeholder="@yourhandle"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Discord Tag</label>
                    <input
                      type="text"
                      value={form.discord}
                      onChange={e => setField('discord', e.target.value)}
                      placeholder="username#1234 or username"
                      className={inpClass}
                    />
                  </div>

                  <div>
                    <label className={lblClass}>Portfolio / Stream / Highlights URL</label>
                    <input
                      type="text"
                      value={form.portfolioUrl}
                      onChange={e => setField('portfolioUrl', e.target.value)}
                      placeholder="twitch.tv/username or drive/portfolio link"
                      className={inpClass}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3 border border-white/10 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/20">
                    Next: Final Submission →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: MOTIVATION & SUBMISSION ── */}
            {step === 4 && (
              <div className="space-y-5">
                <h3 className="text-base font-black text-white uppercase tracking-wider border-b border-white/8 pb-3">
                  Step 4: Experience & Motivation
                </h3>

                <div>
                  <label className={lblClass}>Past Tournament Achievements & Placements *</label>
                  <textarea
                    rows={3}
                    value={form.achievements}
                    onChange={e => setField('achievements', e.target.value)}
                    placeholder="List official tournaments won, top 8 finishes, or notable esports events..."
                    className={inpClass + ' resize-none'}
                  />
                </div>

                <div>
                  <label className={lblClass}>Why do you want to join {PUBLIC_BRAND_NAME}? *</label>
                  <textarea
                    required
                    rows={4}
                    value={form.about}
                    onChange={e => setField('about', e.target.value)}
                    placeholder="Tell us about your competitive mindset, why {PUBLIC_BRAND_NAME}, and what makes you stand out..."
                    className={inpClass + ' resize-none'}
                  />
                </div>

                {/* Custom Questions if configured on Opening */}
                {selectedOpening?.customQuestions && selectedOpening.customQuestions.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-white/8">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Position Specific Questions</h4>
                    {selectedOpening.customQuestions.map(q => (
                      <div key={q.id}>
                        <label className={lblClass}>{q.label} {q.required && '*'}</label>
                        <input
                          type={q.type === 'number' ? 'number' : 'text'}
                          required={q.required}
                          value={form.customAnswers[q.label] || ''}
                          onChange={e => setField('customAnswers', { ...form.customAnswers, [q.label]: e.target.value })}
                          className={inpClass}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Terms Checkbox */}
                <div className="bg-white/2 p-4 rounded-xl border border-white/8 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.termsAccepted}
                      onChange={e => setField('termsAccepted', e.target.checked)}
                      className="mt-0.5 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs text-gray-300 leading-relaxed">
                      I confirm that all provided gaming details, IDs, and achievements are true. I agree to comply with {PUBLIC_BRAND_NAME} code of conduct and consent to being contacted by esports management.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
                    ⚠ {error}
                  </div>
                )}

                <div className="pt-4 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-3 border border-white/10 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all">
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !form.termsAccepted || !form.about}
                    className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-40 shadow-xl shadow-amber-500/20">
                    {submitting ? 'Submitting Application...' : 'Submit Official Application 🚀'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
