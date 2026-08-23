import { useRef, useEffect, useState, useMemo } from 'react';
import { Match } from '@/lib/database';

interface Props {
  matches: Match[];
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'UPCOMING', color: '#00d4ff', bg: '#00d4ff22' },
  live: { label: 'LIVE', color: '#ff0055', bg: '#ff005522' },
  completed: { label: 'COMPLETED', color: '#888', bg: '#88888822' },
};

const MODE_COLORS: Record<string, string> = {
  BR: '#ff6b00',
  TDM: '#00d4ff',
  SCRIM: '#9945ff',
  CUSTOM: '#ffd700',
  TOURNAMENT: '#ff0055',
};

export default function MatchesSection({ matches }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const sorted = useMemo(() => {
    return [...matches].sort((a, b) => {
      const order: Record<string, number> = { live: 0, upcoming: 1, completed: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  }, [matches]);

  return (
    <section id="matches" ref={sectionRef}
      className={`py-24 bg-gradient-to-b from-transparent via-black/50 to-transparent transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] text-orange-400 uppercase">Schedule</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-widest mt-2 text-white">MATCHES</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4" />
        </div>

        {sorted.length === 0 ? (
          <p className="text-center text-gray-500">No matches scheduled.</p>
        ) : (
          <div className="space-y-4">
            {sorted.map((match, idx) => {
              const status = STATUS_STYLES[match.status] || STATUS_STYLES.upcoming;
              const modeColor = MODE_COLORS[match.mode] || '#ff6b00';
              return (
                <div key={match.id}
                  className={`relative p-6 rounded-lg border border-white/5 bg-white/3 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-500 hover:bg-white/5 hover:shadow-lg group`}
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    boxShadow: match.status === 'live' ? '0 0 30px #ff005522' : 'none'
                  }}>
                  {match.status === 'live' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                  )}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-1 rounded-sm"
                          style={{ color: status.color, background: status.bg }}>
                          {match.status === 'live' && <span className="mr-1 animate-pulse">●</span>}
                          {status.label}
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded-sm"
                          style={{ color: modeColor, background: `${modeColor}22` }}>
                          {match.mode}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">{match.game}</span>
                      </div>
                      <h3 className="text-lg font-black text-white">{match.title}</h3>
                      <p className="text-gray-400 text-sm">
                        vs <span className="text-white font-bold">{match.opponent}</span>
                        <span className="mx-2 text-gray-600">·</span>
                        {match.round}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      {match.score && (
                        <div className="text-2xl font-black" style={{ color: '#ff6b00' }}>{match.score}</div>
                      )}
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{match.date}</div>
                        <div className="text-sm text-orange-400 font-mono">{match.time}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
