/**
 * BracketViewer — renders a single-elimination bracket as an SVG-positioned tree.
 * Supports up to 64 teams. Admin mode shows score inputs.
 */
import { useState } from 'react';
import type { TournamentBracket, TournamentMatch, TournamentTeam } from '@/lib/types';

const RED  = '#e8192c';
const GOLD = '#d4af37';
const CARD_W = 180;
const CARD_H = 56;
const GAP_X  = 64;
const GAP_Y  = 12;

interface Props {
  bracket: TournamentBracket;
  teams: TournamentTeam[];
  adminMode?: boolean;
  onScoreSubmit?: (matchId: string, s1: number, s2: number, winnerId: string, k1: number, k2: number) => void;
}

function teamName(teams: TournamentTeam[], id: string | null | undefined): string {
  if (!id) return 'TBD';
  const t = teams.find(t => t.id === id);
  return t?.name ?? 'BYE';
}

function MatchCard({
  match, teams, adminMode, onScore, x, y,
}: {
  match: TournamentMatch;
  teams: TournamentTeam[];
  adminMode?: boolean;
  onScore?: (matchId: string, s1: number, s2: number, winnerId: string, k1: number, k2: number) => void;
  x: number; y: number;
}) {
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [k1, setK1] = useState('');
  const [k2, setK2] = useState('');
  const [showInput, setShowInput] = useState(false);

  const n1 = teamName(teams, match.team1Id);
  const n2 = teamName(teams, match.team2Id);
  const w = match.winnerId;

  const submit = () => {
    if (!match.team1Id || !match.team2Id) return;
    const score1 = Number(s1), score2 = Number(s2);
    const winnerId = score1 > score2 ? match.team1Id : score2 > score1 ? match.team2Id : match.team1Id;
    onScore?.(match.id, score1, score2, winnerId, Number(k1) || 0, Number(k2) || 0);
    setShowInput(false);
  };

  if (match.isBye) {
    return (
      <foreignObject x={x} y={y} width={CARD_W} height={CARD_H}>
        <div className="rounded-lg text-center text-[10px] text-gray-600 flex items-center justify-center h-full font-bold border border-dashed"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
          BYE — {n1 !== 'TBD' ? n1 : n2} advances
        </div>
      </foreignObject>
    );
  }

  return (
    <foreignObject x={x} y={y} width={CARD_W} height={showInput && adminMode ? 140 : CARD_H}>
      <div style={{ width: CARD_W }}>
        {/* Match card */}
        <div className="rounded-lg overflow-hidden"
          style={{
            border: `1px solid ${match.status === 'live' ? `${RED}60` : 'rgba(255,255,255,0.1)'}`,
            background: match.status === 'live' ? `${RED}08` : 'rgba(10,10,10,0.9)',
            boxShadow: match.status === 'live' ? `0 0 12px ${RED}30` : 'none',
          }}>
          {/* Team 1 */}
          <div className="flex items-center justify-between px-2.5 py-1.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: w === match.team1Id ? `${GOLD}10` : 'transparent' }}>
            <span className="text-[11px] font-bold truncate max-w-[110px]"
              style={{ color: w === match.team1Id ? GOLD : w && w !== match.team1Id ? '#4b5563' : '#d1d5db' }}>
              {n1}
            </span>
            <span className="text-[11px] font-black ml-1" style={{ color: w === match.team1Id ? GOLD : '#6b7280' }}>
              {match.score1 ?? (match.status === 'pending' ? '-' : '0')}
            </span>
          </div>
          {/* Team 2 */}
          <div className="flex items-center justify-between px-2.5 py-1.5"
            style={{ background: w === match.team2Id ? `${GOLD}10` : 'transparent' }}>
            <span className="text-[11px] font-bold truncate max-w-[110px]"
              style={{ color: w === match.team2Id ? GOLD : w && w !== match.team2Id ? '#4b5563' : '#d1d5db' }}>
              {n2}
            </span>
            <span className="text-[11px] font-black ml-1" style={{ color: w === match.team2Id ? GOLD : '#6b7280' }}>
              {match.score2 ?? (match.status === 'pending' ? '-' : '0')}
            </span>
          </div>
        </div>

        {/* Admin score input */}
        {adminMode && match.team1Id && match.team2Id && match.status !== 'completed' && (
          !showInput
            ? <button onClick={() => setShowInput(true)}
                className="w-full mt-1 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                Enter Score
              </button>
            : <div className="mt-1 p-2 rounded-lg space-y-1.5"
                style={{ background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex gap-1">
                  <input value={s1} onChange={e => setS1(e.target.value)} placeholder="P1" type="number"
                    className="w-1/2 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-[11px] text-center outline-none" />
                  <input value={s2} onChange={e => setS2(e.target.value)} placeholder="P2" type="number"
                    className="w-1/2 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-[11px] text-center outline-none" />
                </div>
                <div className="flex gap-1">
                  <input value={k1} onChange={e => setK1(e.target.value)} placeholder="K1" type="number"
                    className="w-1/2 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-center outline-none text-gray-400" />
                  <input value={k2} onChange={e => setK2(e.target.value)} placeholder="K2" type="number"
                    className="w-1/2 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-center outline-none text-gray-400" />
                </div>
                <div className="flex gap-1">
                  <button onClick={submit} className="flex-1 py-1 rounded text-[9px] font-black text-black"
                    style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>Save</button>
                  <button onClick={() => setShowInput(false)} className="px-2 py-1 rounded text-[9px] text-gray-500 border border-white/10">✕</button>
                </div>
              </div>
        )}
      </div>
    </foreignObject>
  );
}

export default function BracketViewer({ bracket, teams, adminMode, onScoreSubmit }: Props) {
  const rounds = bracket.rounds;
  if (!rounds.length) return <p className="text-gray-500 text-center py-16">No bracket generated yet.</p>;

  const totalRounds = rounds.length;

  // Compute canvas dimensions
  const maxMatchesInRound = Math.max(...rounds.map(r => r.matches.length));
  const svgH = Math.max(400, maxMatchesInRound * (CARD_H + GAP_Y * 2) + 80);
  const svgW = totalRounds * (CARD_W + GAP_X) + 60;

  // Position each match
  function matchY(round: number, matchNum: number, total: number): number {
    const slotH = svgH / total;
    return slotH * matchNum - slotH / 2 - CARD_H / 2;
  }
  function matchX(round: number): number {
    return (round - 1) * (CARD_W + GAP_X) + 20;
  }

  // Draw connector lines between rounds
  const lines: React.ReactElement[] = [];
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const curRound = rounds[ri];
    const nextRound = rounds[ri + 1];
    const curTotal = curRound.matches.length;
    const nextTotal = nextRound.matches.length;

    for (let mi = 0; mi < curTotal; mi += 2) {
      const m1 = curRound.matches[mi];
      const m2 = curRound.matches[mi + 1];
      if (!m1) continue;

      const x1 = matchX(curRound.round) + CARD_W;
      const y1 = matchY(curRound.round, mi + 1, curTotal) + CARD_H / 2;
      const y2 = m2 ? matchY(curRound.round, mi + 2, curTotal) + CARD_H / 2 : y1;

      const nIdx = Math.floor(mi / 2);
      const xn = matchX(nextRound.round);
      const yn = matchY(nextRound.round, nIdx + 1, nextTotal) + CARD_H / 2;
      const midX = x1 + GAP_X / 2;

      lines.push(
        <g key={`line-${ri}-${mi}`} stroke="rgba(212,175,55,0.2)" strokeWidth="1" fill="none">
          <path d={`M${x1},${y1} H${midX} V${y2} H${midX} V${yn} H${xn}`} />
        </g>
      );
    }
  }

  return (
    <div className="overflow-x-auto pb-4">
      {/* Round labels */}
      <div className="flex mb-4" style={{ paddingLeft: 20 }}>
        {rounds.map(r => (
          <div key={r.round} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500"
            style={{ width: CARD_W + GAP_X, paddingRight: GAP_X }}>
            {r.label}
          </div>
        ))}
      </div>

      <svg width={svgW} height={svgH} style={{ display: 'block', minHeight: 320 }}>
        {/* Lines */}
        {lines}

        {/* Match cards */}
        {rounds.map(r => {
          const total = r.matches.length;
          return r.matches.map((match, mi) => (
            <MatchCard
              key={match.id}
              match={match}
              teams={teams}
              adminMode={adminMode}
              onScore={onScoreSubmit}
              x={matchX(r.round)}
              y={matchY(r.round, mi + 1, total)}
            />
          ));
        })}
      </svg>
    </div>
  );
}
