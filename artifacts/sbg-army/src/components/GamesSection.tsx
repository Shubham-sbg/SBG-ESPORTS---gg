import { useRef, useEffect, useState } from 'react';
import { Game } from '@/lib/database';

interface Props {
  games: Game[];
}

const GAME_GRADIENTS: Record<string, string> = {
  'BGMI': 'from-orange-600 to-yellow-500',
  'FREE FIRE': 'from-red-600 to-pink-500',
  'VALORANT': 'from-red-500 to-rose-400',
  'COD MOBILE': 'from-cyan-500 to-blue-600',
};

export default function GamesSection({ games }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const enabled = games.filter(g => g.enabled).sort((a, b) => a.order - b.order);

  return (
    <section id="games" ref={sectionRef}
      className={`py-24 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] text-orange-400 uppercase">We Play</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-widest mt-2 text-white">OUR GAMES</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {enabled.map(game => (
            <div key={game.id}
              className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/3 hover:border-orange-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-default p-8 text-center">
              <div className={`absolute inset-0 bg-gradient-to-br ${GAME_GRADIENTS[game.name] || 'from-orange-600 to-red-500'} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              {game.logo ? (
                <img src={game.logo} alt={game.name} loading="lazy" decoding="async" width="64" height="64" className="h-16 w-auto mx-auto mb-4 object-contain group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className={`h-16 w-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${GAME_GRADIENTS[game.name] || 'from-orange-600 to-red-500'} flex items-center justify-center text-2xl font-black text-white group-hover:scale-110 transition-transform duration-500`}>
                  {game.name.charAt(0)}
                </div>
              )}
              <h3 className="text-white font-black text-lg tracking-wider group-hover:text-orange-300 transition-colors">{game.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
