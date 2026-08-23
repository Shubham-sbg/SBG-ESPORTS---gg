import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { getTournaments, getTeams, getBracketForTournament } from '@/lib/api';
import BracketViewer from '@/components/BracketViewer';
import type { Tournament, TournamentTeam, TournamentBracket } from '@/lib/types';
import { Trophy, Users, Calendar, Gamepad2, ExternalLink, ChevronLeft } from 'lucide-react';

const RED  = '#e8192c';
const GOLD = '#d4af37';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:        { label: 'Draft',           color: '#6b7280' },
  registration: { label: '✅ Open for Registration', color: '#10b981' },
  ongoing:      { label: '🔴 Live',          color: RED },
  completed:    { label: '🏆 Completed',    color: GOLD },
  cancelled:    { label: '❌ Cancelled',    color: '#ef4444' },
};

type Tab = 'info' | 'bracket' | 'teams' | 'prizes';

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [tab, setTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTournaments(),
      getTeams(),
      getBracketForTournament(id),
    ]).then(([tournaments, allTeams, b]) => {
      setTournament(tournaments.find(t => t.id === id) ?? null);
      setTeams(allTeams.filter(t => t.tournamentId === id && t.status === 'approved'));
      setBracket(b);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="pt-32 text-center text-gray-500">
      <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
      Loading…
    </div>
  );

  if (!tournament) return (
    <div className="pt-32 text-center">
      <p className="text-gray-500 text-xl">Tournament not found.</p>
      <Link href="/tournaments" className="mt-6 inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
        <ChevronLeft size={16} /> Back to Tournaments
      </Link>
    </div>
  );

  const st = STATUS_LABEL[tournament.status] ?? STATUS_LABEL.draft;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'info',    label: 'ℹ️ Info' },
    { key: 'bracket', label: '🏆 Bracket' },
    { key: 'teams',   label: `👥 Teams (${teams.length})` },
    { key: 'prizes',  label: '💰 Prizes' },
  ];

  return (
    <div className="pt-20 min-h-screen">
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0000, #1a0000)' }}>
        {tournament.banner
          ? <img src={tournament.banner} alt={tournament.title} className="w-full h-full object-cover opacity-40" />
          : <div className="w-full h-full flex items-center justify-center"><Trophy size={80} style={{ color: `${RED}20` }} /></div>
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, rgba(3,3,3,0.5) 60%, transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-6">
          <Link href="/tournaments" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
            <ChevronLeft size={14} /> All Tournaments
          </Link>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase" style={{ background: `${RED}20`, color: RED, border: `1px solid ${RED}30` }}>
                  <Gamepad2 size={10} className="inline mr-1" />{tournament.game}
                </span>
                <span className="text-sm font-bold" style={{ color: st.color }}>{st.label}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white uppercase">{tournament.title}</h1>
              {tournament.subtitle && <p className="text-gray-400 mt-1">{tournament.subtitle}</p>}
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gold-gradient">{tournament.prizePool}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-widest">Prize Pool</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Teams',    value: `${teams.length}/${tournament.maxTeams}`, icon: Users },
            { label: 'Start',    value: tournament.startDate, icon: Calendar },
            { label: 'Format',   value: tournament.format === 'single_elimination' ? 'KO Bracket' : tournament.format === 'round_robin' ? 'Round Robin' : 'Double Elim.', icon: Trophy },
            { label: 'Entry',    value: tournament.entryFee === 0 ? 'FREE' : `₹${tournament.entryFee}`, icon: Trophy },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
              <p className="font-black text-white text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Register CTA */}
        {tournament.status === 'registration' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link href={`/register/${tournament.id}`}
              className="flex-1 py-4 rounded-xl text-center font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(232,25,44,0.4)]"
              style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>
              🎯 Register Your Team
            </Link>
            {tournament.streamUrl && (
              <a href={tournament.streamUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
                style={{ border: `1px solid ${GOLD}30`, color: GOLD }}>
                <ExternalLink size={16} /> Watch Live
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/5 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px"
              style={{
                color: tab === t.key ? RED : '#6b7280',
                borderColor: tab === t.key ? RED : 'transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Info */}
        {tab === 'info' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="font-black text-white text-lg uppercase tracking-widest mb-4">About</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line">{tournament.description}</p>
              {tournament.contactWhatsApp && (
                <a href={`https://wa.me/${tournament.contactWhatsApp}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:scale-105"
                  style={{ background: '#25d366', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}>
                  💬 Contact on WhatsApp
                </a>
              )}
            </div>
            <div>
              <h2 className="font-black text-white text-lg uppercase tracking-widest mb-4">Rules</h2>
              {tournament.rules.length > 0
                ? <ul className="space-y-2">
                    {tournament.rules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-400 text-sm">
                        <span className="text-red-500 font-black flex-shrink-0 mt-0.5">{i + 1}.</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                : <p className="text-gray-600">No rules specified yet.</p>
              }
            </div>
          </div>
        )}

        {/* Bracket */}
        {tab === 'bracket' && (
          bracket
            ? <BracketViewer bracket={bracket} teams={teams} />
            : <div className="text-center py-24 text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 opacity-10" />
                <p>Bracket has not been generated yet.</p>
                <p className="text-sm mt-2">Check back once registration closes.</p>
              </div>
        )}

        {/* Teams */}
        {tab === 'teams' && (
          <div>
            {teams.length === 0
              ? <p className="text-gray-500 text-center py-20">No approved teams yet.</p>
              : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team, i) => (
                    <div key={team.id} className="p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm"
                          style={{ background: `${RED}20`, color: RED }}>
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-black text-white">{team.name}</p>
                          <p className="text-xs text-gray-500">Captain: {team.captain}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {team.players.map((p, pi) => (
                          <div key={pi} className="flex items-center justify-between text-xs text-gray-500">
                            <span>{p.name}</span>
                            <span className="font-mono text-gray-600">{p.gameId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* Prizes */}
        {tab === 'prizes' && (
          <div className="max-w-2xl mx-auto">
            {tournament.prizes.length === 0
              ? <p className="text-gray-500 text-center py-20">Prize details coming soon.</p>
              : (
                <div className="space-y-4">
                  {tournament.prizes.sort((a, b) => a.rank - b.rank).map(p => (
                    <div key={p.rank} className={`flex items-center justify-between p-5 rounded-2xl ${p.highlight ? 'scale-[1.02]' : ''}`}
                      style={{
                        background: p.rank === 1 ? `${GOLD}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${p.rank === 1 ? `${GOLD}35` : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      <div>
                        <p className="font-black text-white text-lg">{p.label}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-2xl ${p.rank === 1 ? 'text-gold-gradient' : 'text-white'}`}>{p.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}
