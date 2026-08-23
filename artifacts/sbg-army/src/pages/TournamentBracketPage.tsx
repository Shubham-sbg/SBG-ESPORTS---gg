import { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Combobox from '@/components/shared/Combobox';

interface BracketMatch {
  id: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  status: 'upcoming' | 'live' | 'completed';
  time?: string;
}

interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

/**
 * Builds a single-elimination bracket from a list of approved team names.
 * Produces real rounds — Quarter Finals / Semi Finals / Grand Final — based
 * on how many teams have been approved.  All future match slots are "upcoming".
 */
function buildBracket(teams: string[]): BracketRound[] {
  if (teams.length < 2) return [];

  // Pad to next power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const padded = [...teams];
  while (padded.length < size) padded.push('BYE');

  const roundNames = (count: number): string[] => {
    if (count === 2) return ['GRAND FINAL'];
    if (count === 4) return ['SEMI FINALS', 'GRAND FINAL'];
    if (count === 8) return ['QUARTER FINALS', 'SEMI FINALS', 'GRAND FINAL'];
    if (count === 16) return ['ROUND OF 16', 'QUARTER FINALS', 'SEMI FINALS', 'GRAND FINAL'];
    return Array.from({ length: Math.log2(count) }, (_, i) =>
      i === Math.log2(count) - 1 ? 'GRAND FINAL' : `ROUND ${i + 1}`
    );
  };

  const names = roundNames(size);
  const rounds: BracketRound[] = [];
  let current = padded;

  for (let r = 0; r < names.length; r++) {
    const matches: BracketMatch[] = [];
    for (let m = 0; m < current.length / 2; m++) {
      matches.push({
        id: `r${r}m${m}`,
        teamA: current[m * 2] ?? '—',
        teamB: current[m * 2 + 1] ?? '—',
        status: 'upcoming',
      });
    }
    rounds.push({ name: names[r], matches });
    // Next round slots are TBD
    current = Array(current.length / 2).fill('TBD');
  }

  return rounds;
}

function MatchCard({ match, primary, accent }: { match: BracketMatch; primary: string; accent: string }) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  return (
    <div className={`relative bg-white/[0.03] border rounded-xl overflow-hidden transition-all duration-300 hover:border-orange-500/30 w-56 ${
      isLive ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-white/10'
    }`}>
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
      )}
      {match.time && (
        <div className="px-3 py-1.5 bg-white/3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-600">⏱ {match.time}</span>
          <span className={`text-xs font-black ${isLive ? 'text-red-400 animate-pulse' : isCompleted ? 'text-green-400' : 'text-blue-400'}`}>
            {isLive ? '🔴 LIVE' : isCompleted ? 'DONE' : 'SOON'}
          </span>
        </div>
      )}
      <div className={`flex items-center justify-between px-3 py-2.5 ${isCompleted && match.winner === match.teamA ? 'bg-green-500/5' : ''}`}>
        <span className={`font-black text-xs leading-tight flex-1 ${
          isCompleted ? (match.winner === match.teamA ? 'text-white' : 'text-gray-600') : 'text-gray-300'
        }`}>{match.teamA || '—'}</span>
        {isCompleted ? (
          <span className={`ml-2 font-black text-sm w-6 text-center ${match.winner === match.teamA ? 'text-green-400' : 'text-gray-600'}`}>
            {match.scoreA ?? 0}
          </span>
        ) : isLive ? (
          <span className="ml-2 font-black text-sm w-6 text-center text-red-400">{match.scoreA ?? '—'}</span>
        ) : null}
      </div>
      <div className="h-px bg-white/5" />
      <div className={`flex items-center justify-between px-3 py-2.5 ${isCompleted && match.winner === match.teamB ? 'bg-green-500/5' : ''}`}>
        <span className={`font-black text-xs leading-tight flex-1 ${
          isCompleted ? (match.winner === match.teamB ? 'text-white' : 'text-gray-600') : 'text-gray-300'
        }`}>{match.teamB || '—'}</span>
        {isCompleted ? (
          <span className={`ml-2 font-black text-sm w-6 text-center ${match.winner === match.teamB ? 'text-green-400' : 'text-gray-600'}`}>
            {match.scoreB ?? 0}
          </span>
        ) : isLive ? (
          <span className="ml-2 font-black text-sm w-6 text-center text-red-400">{match.scoreB ?? '—'}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function TournamentBracketPage() {
  const { db, loading } = useDatabase();
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  const tournaments = (db.tournaments ?? []).filter(t => t.visible);

  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournament) {
      setSelectedTournament(tournaments[0].id);
    }
  }, [tournaments]);

  const current = tournaments.find(t => t.id === selectedTournament);

  // ── Build bracket from REAL approved registrations only ─────────────────
  const bracket = useMemo<BracketRound[]>(() => {
    if (!current) return [];
    const approvedTeams = (db.registrations ?? [])
      .filter(r => r.tournamentId === current.id && r.status === 'approved')
      .map(r => r.teamName)
      .filter(Boolean);
    return buildBracket(approvedTeams);
  }, [current, db.registrations]);

  const approvedCount = useMemo(() => {
    if (!current) return 0;
    return (db.registrations ?? []).filter(r => r.tournamentId === current.id && r.status === 'approved').length;
  }, [current, db.registrations]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative pt-24 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">
                🏆 LIVE BRACKETS
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white">TOURNAMENT <span style={{ color: db.settings.primaryColor }}>BRACKETS</span></h1>
              <p className="text-gray-400 mt-2">Real-time match progression — built from approved registrations</p>
            </div>
            {tournaments.length > 0 && (
              <div className="flex-shrink-0">
                <label className="block text-xs font-black text-gray-500 tracking-widest uppercase mb-2">SELECT TOURNAMENT</label>
                <Combobox
                  value={selectedTournament}
                  onChange={e => setSelectedTournament(e.target.value)}
                  className="bg-white/5 border border-white/15 text-white rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-orange-500/50 min-w-[220px]">
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id} className="bg-black">{t.title}</option>
                  ))}
                </Combobox>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tournament Info */}
      {current && (
        <section className="px-4 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-6 p-5 bg-white/[0.03] border border-white/8 rounded-2xl">
              {[
                { label: 'Game', value: current.game, icon: '🎮' },
                { label: 'Prize Pool', value: current.prizePool, icon: '💰' },
                { label: 'Format', value: current.type, icon: '🏆' },
                { label: 'Status', value: current.registrationStatus, icon: '📊' },
                { label: 'Date', value: current.matchDate, icon: '📅' },
                { label: 'Approved Teams', value: approvedCount > 0 ? String(approvedCount) : 'None yet', icon: '✅' },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-widest">{item.label}</div>
                    <div className="font-black text-white text-sm">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bracket */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-24">
              <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading bracket…</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="font-black text-white text-2xl mb-3">No Tournaments Available</h3>
              <p className="text-gray-500 mb-8">Create a tournament in the Admin Panel first.</p>
              <a href="/tournaments" className="px-8 py-4 rounded-xl font-black text-sm uppercase text-black"
                style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` }}>
                VIEW TOURNAMENTS
              </a>
            </div>
          ) : bracket.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="font-black text-white text-2xl mb-3">No Approved Registrations</h3>
              <p className="text-gray-500 mb-8">
                Brackets generate automatically once registrations are approved.<br />
                Approve registrations from the Admin Panel → Registrations.
              </p>
              <a href="/tournaments" className="px-8 py-4 rounded-xl font-black text-sm uppercase text-black"
                style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}, ${db.settings.accentColor})` }}>
                VIEW REGISTRATIONS
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-8 items-start min-w-max pb-8">
                {bracket.map((round, roundIdx) => (
                  <div key={round.name} className="flex flex-col">
                    {/* Round Header */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase"
                        style={{ background: roundIdx === bracket.length - 1 ? `linear-gradient(135deg, ${db.settings.primaryColor}33, ${db.settings.accentColor}22)` : 'rgba(255,255,255,0.05)', color: roundIdx === bracket.length - 1 ? db.settings.primaryColor : '#999', border: `1px solid ${roundIdx === bracket.length - 1 ? db.settings.primaryColor + '44' : 'rgba(255,255,255,0.08)'}` }}>
                        {roundIdx === bracket.length - 1 ? '👑 ' : ''}{round.name}
                      </div>
                    </div>

                    {/* Matches */}
                    <div className="flex flex-col" style={{ gap: `${Math.pow(2, roundIdx) * 20}px` }}>
                      {round.matches.map(match => (
                        <div key={match.id} className="flex items-center">
                          <MatchCard match={match} primary={db.settings.primaryColor} accent={db.settings.accentColor} />
                          {roundIdx < bracket.length - 1 && (
                            <div className="flex items-center ml-0">
                              <div className="w-8 h-px bg-white/10" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Champion slot */}
                <div className="flex flex-col items-center justify-center" style={{ marginTop: '60px' }}>
                  <div className="text-center mb-4">
                    <div className="text-xs font-black text-yellow-400 tracking-widest uppercase mb-2">🏆 CHAMPION</div>
                  </div>
                  <div className="w-56 p-6 rounded-2xl text-center"
                    style={{ background: `linear-gradient(135deg, ${db.settings.primaryColor}22, ${db.settings.accentColor}11)`, border: `2px solid ${db.settings.primaryColor}44` }}>
                    <div className="text-3xl mb-2">👑</div>
                    <div className="font-black text-white text-sm">
                      {bracket[bracket.length - 1]?.matches[0]?.winner || 'TBD'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">To Be Determined</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
