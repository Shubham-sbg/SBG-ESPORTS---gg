import { useEffect, useState } from 'react';
import { getTournaments, getTeams, getBrackets, saveBrackets, updateMatchScore } from '@/lib/api';
import { generateSingleElimination, generateRoundRobin } from '@/lib/bracket';
import BracketViewer from '@/components/BracketViewer';
import type { Tournament, TournamentTeam, TournamentBracket } from '@/lib/types';
import { GitBranch, Zap } from 'lucide-react';

const RED  = '#e8192c';
const GOLD = '#d4af37';

export default function AdminBracket() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams]             = useState<TournamentTeam[]>([]);
  const [brackets, setBrackets]       = useState<TournamentBracket[]>([]);
  const [selectedId, setSelectedId]   = useState<string>('');
  const [busy, setBusy]               = useState(false);
  const [msg, setMsg]                 = useState('');

  useEffect(() => {
    Promise.all([getTournaments(), getTeams(), getBrackets()]).then(([t, tm, b]) => {
      const active = t.filter(x => x.status !== 'draft');
      setTournaments(active);
      setTeams(tm);
      setBrackets(b);
      if (active.length > 0) setSelectedId(active[0].id);
    });
  }, []);

  const tnmt       = tournaments.find(t => t.id === selectedId);
  const tnmtTeams  = teams.filter(t => t.tournamentId === selectedId && t.status === 'approved');
  const bracket    = brackets.find(b => b.tournamentId === selectedId) ?? null;

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const generate = async () => {
    if (!tnmt) return;
    if (tnmtTeams.length < 2) { flash('Need at least 2 approved teams.'); return; }
    if (bracket && !confirm(`Regenerate bracket for "${tnmt.title}"? This will reset all match results.`)) return;
    setBusy(true);
    try {
      const b = tnmt.format === 'round_robin'
        ? generateRoundRobin(tnmtTeams, tnmt.id)
        : generateSingleElimination(tnmtTeams, tnmt.id);
      const next = [...brackets.filter(x => x.tournamentId !== tnmt.id), b];
      await saveBrackets(next);
      setBrackets(next);
      flash(`✓ Bracket generated — ${tnmtTeams.length} teams, ${b.rounds.length} rounds`);
    } catch (e: any) {
      flash(`Error: ${e.message}`);
    }
    setBusy(false);
  };

  const handleScore = async (matchId: string, s1: number, s2: number, winnerId: string, k1: number, k2: number) => {
    if (!tnmt) return;
    const next = await updateMatchScore(brackets, tnmt.id, matchId, { score1: s1, score2: s2, winnerId, killScore1: k1, killScore2: k2 });
    setBrackets(next);
    flash('✓ Score saved and bracket advanced');
  };

  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Bracket Manager</h2>
        <p className="text-xs text-gray-500 mt-1">Generate brackets and enter match scores</p>
      </div>

      {/* Tournament selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Select Tournament</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none cursor-pointer">
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.title} ({t.status})</option>)}
          </select>
        </div>
        <button onClick={generate} disabled={busy || !tnmt}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>
          <Zap size={15} /> {bracket ? 'Regenerate Bracket' : 'Generate Bracket'}
        </button>
      </div>

      {/* Status message */}
      {msg && (
        <div className="p-3 rounded-xl text-sm font-bold"
          style={{ background: msg.startsWith('Error') ? `${RED}12` : 'rgba(16,185,129,0.1)', color: msg.startsWith('Error') ? RED : '#10b981', border: `1px solid ${msg.startsWith('Error') ? `${RED}30` : 'rgba(16,185,129,0.25)'}` }}>
          {msg}
        </div>
      )}

      {/* Tournament info */}
      {tnmt && (
        <div className="flex items-center gap-6 p-4 rounded-xl flex-wrap"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tournament</p>
            <p className="font-black text-white">{tnmt.title}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Format</p>
            <p className="font-black text-white">{tnmt.format.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Approved Teams</p>
            <p className="font-black" style={{ color: tnmtTeams.length >= 2 ? '#10b981' : '#f59e0b' }}>
              {tnmtTeams.length} / {tnmt.maxTeams}
            </p>
          </div>
          {bracket && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Rounds</p>
              <p className="font-black text-white">{bracket.rounds.length}</p>
            </div>
          )}
        </div>
      )}

      {/* Bracket */}
      {!bracket ? (
        <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
          <GitBranch size={48} className="mx-auto mb-4 opacity-10" />
          <p className="text-gray-500">No bracket generated yet.</p>
          <p className="text-xs text-gray-600 mt-2">Approve at least 2 teams, then click "Generate Bracket".</p>
        </div>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
            Admin Mode — Click "Enter Score" on any match to update results
          </p>
          <BracketViewer
            bracket={bracket}
            teams={tnmtTeams}
            adminMode
            onScoreSubmit={handleScore}
          />
        </div>
      )}
    </div>
  );
}
