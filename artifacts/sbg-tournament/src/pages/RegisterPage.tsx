import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { getTournaments, registerTeam } from '@/lib/api';
import type { Tournament, TeamPlayer } from '@/lib/types';
import { ChevronLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const RED = '#e8192c';
const GOLD = '#d4af37';
const FIELD = "w-full px-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none focus:border-red-500/40 transition-all placeholder-gray-700";

const MODE_SIZES: Record<string, number> = { solo: 1, duo: 2, trio: 3, squad: 4 };

export default function RegisterPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [teamName, setTeamName] = useState('');
  const [captain, setCaptain] = useState('');
  const [captainContact, setCaptainContact] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [players, setPlayers] = useState<TeamPlayer[]>([{ name: '', gameId: '', role: '' }]);

  useEffect(() => {
    if (!id) return;
    getTournaments().then(list => {
      setTournament(list.find(t => t.id === id) ?? null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!tournament) return;
    const size = MODE_SIZES[tournament.gameMode] ?? 4;
    setPlayers(Array.from({ length: size }, () => ({ name: '', gameId: '', role: '' })));
  }, [tournament]);

  const setPlayer = (i: number, field: keyof TeamPlayer, val: string) => {
    setPlayers(p => p.map((pl, pi) => pi === i ? { ...pl, [field]: val } : pl));
  };
  const addPlayer = () => setPlayers(p => [...p, { name: '', gameId: '', role: '' }]);
  const removePlayer = (i: number) => setPlayers(p => p.filter((_, pi) => pi !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;
    setError('');

    if (!teamName.trim() || !captain.trim() || !captainContact.trim()) {
      setError('Team name, captain name, and WhatsApp number are required.'); return;
    }
    if (players.some(p => !p.name.trim() || !p.gameId.trim())) {
      setError('All player names and game IDs are required.'); return;
    }

    setBusy(true);
    const res = await registerTeam({
      tournamentId: tournament.id,
      teamName: teamName.trim(),
      captain: captain.trim(),
      captainContact: captainContact.trim(),
      captainEmail: captainEmail.trim(),
      players: players.map(p => ({ name: p.name.trim(), gameId: p.gameId.trim(), role: p.role?.trim() })),
    });
    setBusy(false);

    if (res.ok) setDone(true);
    else setError(res.message || 'Registration failed. Please try again.');
  };

  if (loading) return <div className="pt-32 text-center text-gray-500">Loading…</div>;

  if (!tournament) return (
    <div className="pt-32 text-center">
      <p className="text-gray-500">Tournament not found.</p>
      <Link href="/tournaments" className="mt-4 inline-flex items-center gap-1 text-sm text-red-400"><ChevronLeft size={14} /> Back</Link>
    </div>
  );

  if (tournament.status !== 'registration') return (
    <div className="pt-32 text-center max-w-md mx-auto px-4">
      <p className="text-xl font-black text-white mb-3">Registration Closed</p>
      <p className="text-gray-500 mb-6">This tournament is not accepting registrations.</p>
      <Link href={`/tournament/${tournament.id}`} className="text-red-400 hover:text-red-300 transition-colors">View Tournament →</Link>
    </div>
  );

  if (done) return (
    <div className="pt-32 text-center max-w-md mx-auto px-4 fade-in">
      <CheckCircle2 size={64} className="mx-auto mb-6" style={{ color: '#10b981' }} />
      <h2 className="text-2xl font-black text-white mb-3">Registration Submitted!</h2>
      <p className="text-gray-400 mb-2">Your team <strong className="text-white">{teamName}</strong> has been submitted for approval.</p>
      <p className="text-gray-500 text-sm mb-8">The tournament admin will review and approve your registration. You will be contacted via WhatsApp.</p>
      {tournament.contactWhatsApp && (
        <a href={`https://wa.me/${tournament.contactWhatsApp}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mb-4 px-5 py-2.5 rounded-xl text-sm font-black text-white"
          style={{ background: '#25d366' }}>💬 Contact Organizer</a>
      )}
      <br />
      <Link href={`/tournament/${tournament.id}`} className="text-red-400 hover:text-red-300 transition-colors text-sm">← Back to Tournament</Link>
    </div>
  );

  const size = MODE_SIZES[tournament.gameMode] ?? 4;

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/tournament/${tournament.id}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft size={14} /> {tournament.title}
        </Link>

        <div className="text-center mb-10">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase mb-2" style={{ color: RED }}>Team Registration</p>
          <h1 className="text-3xl font-black text-white uppercase">{tournament.title}</h1>
          <p className="text-gray-500 mt-2">{tournament.game} · {tournament.gameMode.toUpperCase()} · {size} players per team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team info */}
          <div className="p-6 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center" style={{ background: `${RED}30`, color: RED }}>1</span>
              Team Information
            </h2>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Team Name *</label>
              <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Alpha Squad" className={FIELD} required />
            </div>
          </div>

          {/* Captain */}
          <div className="p-6 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center" style={{ background: `${RED}30`, color: RED }}>2</span>
              Team Captain
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Captain Name *</label>
                <input value={captain} onChange={e => setCaptain(e.target.value)} placeholder="Full name" className={FIELD} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">WhatsApp Number *</label>
                <input value={captainContact} onChange={e => setCaptainContact(e.target.value)} placeholder="+91 XXXXX XXXXX" className={FIELD} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Email (optional)</label>
                <input value={captainEmail} onChange={e => setCaptainEmail(e.target.value)} type="email" placeholder="captain@example.com" className={FIELD} />
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="p-6 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center" style={{ background: `${RED}30`, color: RED }}>3</span>
                Players ({players.length}/{size})
              </h2>
              {players.length < size + 2 && (
                <button type="button" onClick={addPlayer}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-all hover:border-white/25"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                  <Plus size={12} /> Add
                </button>
              )}
            </div>
            <div className="space-y-3">
              {players.map((p, i) => (
                <div key={i} className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: i === 0 ? GOLD : RED }}>
                      {i === 0 ? '★ Captain / IGL' : `Player ${i + 1}`}
                    </span>
                    {players.length > size && i > 0 && (
                      <button type="button" onClick={() => removePlayer(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={p.name} onChange={e => setPlayer(i, 'name', e.target.value)} placeholder="Player name" className={FIELD} required />
                    <input value={p.gameId} onChange={e => setPlayer(i, 'gameId', e.target.value)} placeholder="Game ID / UID" className={FIELD} required />
                  </div>
                  <input value={p.role ?? ''} onChange={e => setPlayer(i, 'role', e.target.value)} placeholder="Role (optional — IGL, Support, Fragger…)" className={FIELD} />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl text-sm text-red-400" style={{ background: 'rgba(232,25,44,0.08)', border: '1px solid rgba(232,25,44,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${RED}, #b00020)`, boxShadow: `0 8px 32px ${RED}40` }}>
            {busy ? 'Submitting…' : '🎯 Submit Registration'}
          </button>

          <p className="text-center text-[11px] text-gray-600">
            Registration is pending admin approval. You will be contacted on WhatsApp.
          </p>
        </form>
      </div>
    </div>
  );
}
