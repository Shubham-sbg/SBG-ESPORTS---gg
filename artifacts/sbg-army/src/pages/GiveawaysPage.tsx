import { useEffect, useRef, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { trackPageVisit } from '@/lib/analytics';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Giveaway } from '@/lib/database';

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return <span className="text-orange-400 font-bold text-sm">{timeLeft}</span>;
}

export default function GiveawaysPage() {
  const { db } = useDatabase();
  const tracked = useRef(false);

  useEffect(() => {
    applyTheme(db.settings);
    if (!tracked.current) { trackPageVisit('/giveaways'); tracked.current = true; }
  }, [db.settings]);

  const active = (db.giveaways || []).filter(g => g.visible && g.status === 'active');
  const ended = (db.giveaways || []).filter(g => g.visible && g.status === 'ended');

  const Card = ({ g }: { g: Giveaway }) => (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-6 hover:border-orange-500/30 transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-black text-white text-xl leading-tight">{g.title}</h3>
          <p className="text-orange-400 font-bold mt-1 text-sm">🎁 {g.reward}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${g.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{g.status}</span>
      </div>

      {g.status === 'active' && (
        <div className="mb-4 p-3 rounded-lg bg-white/5">
          <span className="text-xs text-gray-500">Time Remaining: </span>
          <CountdownTimer deadline={g.deadline} />
        </div>
      )}

      {g.rules && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Rules</p>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{g.rules}</p>
        </div>
      )}

      {g.status === 'ended' && (g.winners || []).length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2">🏆 Winners</p>
          <div className="flex flex-wrap gap-2">
            {g.winners!.map((w, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold">{w}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            🎁 Contests & Giveaways
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Win <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>Rewards</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">Participate in our exclusive contests and win amazing prizes.</p>
        </div>

        {active.length === 0 && ended.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="font-black text-xl text-white mb-2">No Active Giveaways</h3>
            <p className="text-gray-500 text-sm">Check back soon — exciting contests coming up!</p>
          </div>
        )}

        {active.length > 0 && (
          <div className="mb-12">
            <h2 className="font-black text-xl text-white mb-6">🔥 Active Contests</h2>
            <div className="space-y-4">{active.map(g => <Card key={g.id} g={g} />)}</div>
          </div>
        )}

        {ended.length > 0 && (
          <div>
            <h2 className="font-black text-xl text-gray-400 mb-6">Past Giveaways</h2>
            <div className="space-y-4">{ended.map(g => <Card key={g.id} g={g} />)}</div>
          </div>
        )}
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}
