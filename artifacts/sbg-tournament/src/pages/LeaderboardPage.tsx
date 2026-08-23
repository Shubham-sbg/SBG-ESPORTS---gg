import { useEffect, useState } from 'react';
import { getTournaments, getTeams, getBrackets, computeLeaderboard } from '@/lib/api';
import { Trophy, Medal, Swords } from 'lucide-react';

const RED  = '#e8192c';
const GOLD = '#d4af37';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<ReturnType<typeof computeLeaderboard>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTournaments(), getTeams(), getBrackets()]).then(([t, teams, brackets]) => {
      setEntries(computeLeaderboard(t, brackets, teams));
      setLoading(false);
    });
  }, []);

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14 fade-in">
          <p className="text-[11px] font-black tracking-[0.4em] uppercase mb-2" style={{ color: GOLD }}>Rankings</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-4">Leaderboard</h1>
          <p className="text-gray-500">Ranked by wins, kills, and tournament performance.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            Loading rankings…
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-32">
            <Trophy size={56} className="mx-auto mb-4 opacity-10" />
            <p className="text-gray-500 text-lg">No results yet.</p>
            <p className="text-gray-600 text-sm mt-2">Rankings will appear once tournament matches are played.</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {entries.length >= 2 && (
              <div className="flex items-end justify-center gap-4 mb-12">
                {[1, 0, 2].map(i => {
                  const e = entries[i];
                  if (!e) return null;
                  const heights = [' pb-4', 'pb-10', ''];
                  const scale   = ['scale-105', 'scale-110', 'scale-100'];
                  return (
                    <div key={e.teamId} className={`text-center ${heights[i === 0 ? 2 : i === 1 ? 0 : 1]} ${scale[i === 0 ? 2 : i === 1 ? 0 : 1]} transition-all`}>
                      <div className="text-3xl mb-1">{MEDAL[i]}</div>
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-3 ${i === 1 ? 'shadow-[0_0_32px_rgba(212,175,55,0.4)]' : ''}`}
                        style={{ background: i === 1 ? `${GOLD}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 1 ? `${GOLD}40` : 'rgba(255,255,255,0.1)'}` }}>
                        <Swords size={28} style={{ color: i === 1 ? GOLD : '#6b7280' }} />
                      </div>
                      <p className="font-black text-white text-sm truncate max-w-[100px]">{e.teamName}</p>
                      <p className="text-xs font-bold mt-1" style={{ color: GOLD }}>{e.points} pts</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600"
                style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span>#</span>
                <span>Team</span>
                <span className="text-center">Wins</span>
                <span className="text-center">Losses</span>
                <span className="text-center">Kills</span>
                <span className="text-right">Points</span>
              </div>

              {entries.map((e, i) => (
                <div key={e.teamId}
                  className="grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-3 px-5 py-4 items-center transition-all hover:bg-white/[0.015]"
                  style={{ borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i < 3 ? `${i === 0 ? GOLD : RED}05` : 'transparent' }}>
                  {/* Rank */}
                  <div className="font-black text-sm" style={{ color: i < 3 ? [GOLD, '#c0c0c0', '#cd7f32'][i] : '#4b5563' }}>
                    {i < 3 ? MEDAL[i] : `#${i + 1}`}
                  </div>
                  {/* Team */}
                  <div>
                    <p className="font-black text-white text-sm">{e.teamName}</p>
                    <p className="text-[11px] text-gray-600 truncate">{e.tournamentTitle}</p>
                  </div>
                  {/* Stats */}
                  <div className="text-center">
                    <span className="font-black text-green-400">{e.wins}</span>
                  </div>
                  <div className="text-center">
                    <span className="font-black text-red-400">{e.losses}</span>
                  </div>
                  <div className="text-center">
                    <span className="font-black text-white">{e.kills}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xl text-gold-gradient">{e.points}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-gray-700 mt-6">
              Points: Win = 3 pts · Kill = 1 pt. Updated after each match.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
