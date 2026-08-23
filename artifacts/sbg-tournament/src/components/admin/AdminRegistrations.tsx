import { useEffect, useState } from 'react';
import { getTournaments, getTeams, saveTeams } from '@/lib/api';
import type { Tournament, TournamentTeam, TeamStatus } from '@/lib/types';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react';

const RED  = '#e8192c';
const GOLD = '#d4af37';

const ST: Record<TeamStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  rejected: { label: 'Rejected', color: RED,       bg: `${RED}12` },
};

export default function AdminRegistrations() {
  const [teams, setTeams]         = useState<TournamentTeam[]>([]);
  const [tournaments, setTnmts]   = useState<Tournament[]>([]);
  const [filterTnmt, setFilterT]  = useState<string>('all');
  const [filterSt, setFilterS]    = useState<TeamStatus | 'all'>('all');
  const [query, setQuery]         = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTeams(), getTournaments()]).then(([t, tn]) => { setTeams(t); setTnmts(tn); });
  }, []);

  const updateStatus = async (id: string, status: TeamStatus, note?: string) => {
    const next = teams.map(t => t.id === id ? { ...t, status, note: note ?? t.note } : t);
    await saveTeams(next);
    setTeams(next);
  };

  const filtered = teams.filter(t => {
    if (filterTnmt !== 'all' && t.tournamentId !== filterTnmt) return false;
    if (filterSt !== 'all' && t.status !== filterSt) return false;
    if (query && !t.name.toLowerCase().includes(query.toLowerCase()) && !t.captain.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const pending  = teams.filter(t => t.status === 'pending').length;
  const approved = teams.filter(t => t.status === 'approved').length;
  const rejected = teams.filter(t => t.status === 'rejected').length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Registrations</h2>
        <p className="text-xs text-gray-500 mt-1">Approve or reject team registrations</p>
      </div>

      {/* Counts */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Pending',  value: pending,  color: '#f59e0b' },
          { label: 'Approved', value: approved, color: '#10b981' },
          { label: 'Rejected', value: rejected, color: RED },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-5 py-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-2xl font-black" style={{ color }}>{value}</span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search team or captain…"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none focus:border-red-500/40 placeholder-gray-700" />
        </div>
        <select value={filterTnmt} onChange={e => setFilterT(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none cursor-pointer">
          <option value="all">All Tournaments</option>
          {tournaments.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <select value={filterSt} onChange={e => setFilterS(e.target.value as TeamStatus | 'all')}
          className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border border-white/5 rounded-2xl">No registrations found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(team => {
            const tnmt = tournaments.find(t => t.id === team.tournamentId);
            const st = ST[team.status];
            const open = expanded === team.id;

            return (
              <div key={team.id} className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap"
                    style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}>
                    {st.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white truncate">{team.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      Captain: {team.captain} · {team.captainContact}
                      {tnmt && <> · <span style={{ color: GOLD }}>{tnmt.title}</span></>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {team.status !== 'approved' && (
                      <button onClick={() => updateStatus(team.id, 'approved')}
                        className="p-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all" title="Approve">
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                    {team.status !== 'rejected' && (
                      <button onClick={() => updateStatus(team.id, 'rejected')}
                        className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all" title="Reject">
                        <XCircle size={15} />
                      </button>
                    )}
                    {team.status === 'rejected' && (
                      <button onClick={() => updateStatus(team.id, 'pending')}
                        className="p-2 rounded-lg border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 transition-all" title="Reset to pending">
                        <Clock size={15} />
                      </button>
                    )}
                    <button onClick={() => setExpanded(open ? null : team.id)}
                      className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all">
                      {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded players */}
                {open && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      Players ({team.players.length})
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {team.players.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <p className="text-sm font-bold text-white">{p.name}</p>
                            {p.role && <p className="text-[10px] text-gray-600">{p.role}</p>}
                          </div>
                          <p className="text-xs font-mono text-gray-500">{p.gameId}</p>
                        </div>
                      ))}
                    </div>
                    {team.captainEmail && <p className="text-xs text-gray-600 mt-2">Email: {team.captainEmail}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
