import { useEffect, useState } from 'react';
import { getTournaments, getTeams, getBrackets } from '@/lib/api';
import type { Tournament, TournamentTeam, TournamentBracket } from '@/lib/types';
import { Trophy, Users, Swords, GitBranch, Clock, CheckCircle2, Radio } from 'lucide-react';

const RED  = '#e8192c';
const GOLD = '#d4af37';

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams]             = useState<TournamentTeam[]>([]);
  const [brackets, setBrackets]       = useState<TournamentBracket[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([getTournaments(), getTeams(), getBrackets()]).then(([t, tm, b]) => {
      setTournaments(t); setTeams(tm); setBrackets(b); setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-500 text-sm py-10 text-center">Loading dashboard…</div>;

  const ongoing     = tournaments.filter(t => t.status === 'ongoing').length;
  const open        = tournaments.filter(t => t.status === 'registration').length;
  const completed   = tournaments.filter(t => t.status === 'completed').length;
  const pending     = teams.filter(t => t.status === 'pending').length;
  const approved    = teams.filter(t => t.status === 'approved').length;
  const totalMatches = brackets.flatMap(b => b.rounds.flatMap(r => r.matches)).length;
  const completedM  = brackets.flatMap(b => b.rounds.flatMap(r => r.matches)).filter(m => m.status === 'completed').length;

  const STATS = [
    { label: 'Total Tournaments', value: tournaments.length, icon: Trophy,       color: GOLD },
    { label: 'Live Now',          value: ongoing,            icon: Radio,         color: RED  },
    { label: 'Open Registration', value: open,              icon: Clock,         color: '#10b981' },
    { label: 'Pending Approvals', value: pending,           icon: Users,         color: '#f59e0b' },
    { label: 'Approved Teams',    value: approved,          icon: CheckCircle2,  color: '#10b981' },
    { label: 'Matches Played',    value: `${completedM}/${totalMatches}`, icon: Swords, color: RED },
  ];

  const recent = [...tournaments].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-1">Dashboard</h2>
        <p className="text-xs text-gray-500">Tournament platform overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}18` }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent tournaments */}
      {recent.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-3 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="font-black text-white text-xs uppercase tracking-widest">Recent Tournaments</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recent.map(t => {
              const STATUS_COLOR: Record<string, string> = { draft: '#6b7280', registration: '#10b981', ongoing: RED, completed: GOLD, cancelled: '#ef4444' };
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.01] transition-colors">
                  <div>
                    <p className="font-bold text-white text-sm">{t.title}</p>
                    <p className="text-[11px] text-gray-600">{t.game} · {t.gameMode}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ color: STATUS_COLOR[t.status] ?? '#6b7280', background: `${STATUS_COLOR[t.status] ?? '#6b7280'}18` }}>
                      {t.status}
                    </span>
                    <p className="text-[11px] text-gray-600 mt-1">{t.prizePool}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
