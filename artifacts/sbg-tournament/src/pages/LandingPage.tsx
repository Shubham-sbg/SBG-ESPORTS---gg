import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Trophy, Zap, Shield, ChevronRight, Swords, Star } from 'lucide-react';
import { getTournaments } from '@/lib/api';
import TournamentCard from '@/components/TournamentCard';
import type { Tournament } from '@/lib/types';

const RED  = '#e8192c';
const GOLD = '#d4af37';

export default function LandingPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    getTournaments().then(list => setTournaments(list.filter(t => t.status !== 'draft' && t.status !== 'cancelled')));
  }, []);

  const featured = tournaments.filter(t => t.featured || t.status === 'ongoing' || t.status === 'registration').slice(0, 3);
  const live = tournaments.filter(t => t.status === 'ongoing');

  return (
    <div className="pt-16">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,25,44,0.12) 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 50% at 20% 80%, rgba(212,175,55,0.06) 0%, transparent 60%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative text-center px-4 max-w-5xl mx-auto fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-[11px] font-black uppercase tracking-[0.3em]"
            style={{ background: `${RED}15`, border: `1px solid ${RED}35`, color: RED }}>
            <Swords size={12} /> SBG ARMY ENTREPRENEUR
          </div>

          {/* Title */}
          <h1 className="font-black uppercase leading-none mb-6">
            <span className="block text-5xl sm:text-7xl md:text-8xl text-white tracking-tight" style={{ textShadow: `0 0 80px ${RED}30` }}>
              TOURNAMENT
            </span>
            <span className="block text-5xl sm:text-7xl md:text-8xl text-gold-gradient tracking-tight">
              MANAGEMENT
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Register your team. Compete in elite esports tournaments. Rise to the top of the leaderboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tournaments"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-105 hover:shadow-[0_8px_32px_rgba(232,25,44,0.4)]"
              style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>
              <Trophy size={16} /> View Tournaments
            </Link>
            <Link href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105"
              style={{ border: `1px solid ${GOLD}40`, color: GOLD, background: `${GOLD}08` }}>
              <Star size={16} /> Leaderboard <ChevronRight size={14} />
            </Link>
          </div>

          {/* Live indicator */}
          {live.length > 0 && (
            <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: `${RED}12`, border: `1px solid ${RED}30` }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: RED }}>
                {live.length} Tournament{live.length > 1 ? 's' : ''} Live Now
              </span>
            </div>
          )}
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32"
          style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />
      </section>

      {/* ── FEATURED TOURNAMENTS ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[11px] font-black tracking-[0.4em] uppercase mb-2" style={{ color: RED }}>Active</p>
              <h2 className="text-3xl font-black text-white uppercase tracking-wider">Featured Tournaments</h2>
            </div>
            <Link href="/tournaments"
              className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              View all <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(t => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ──────────────────────────────────────────────────────── */}
      {tournaments.length === 0 && (
        <section className="max-w-3xl mx-auto px-4 py-32 text-center">
          <Trophy size={64} className="mx-auto mb-6 opacity-10" />
          <h2 className="text-3xl font-black text-white mb-4">No Tournaments Yet</h2>
          <p className="text-gray-500">Tournaments will appear here once the admin creates them.</p>
        </section>
      )}

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-[11px] font-black tracking-[0.4em] uppercase mb-2" style={{ color: GOLD }}>Platform Features</p>
          <h2 className="text-3xl font-black text-white uppercase">Why SBG Tournament?</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Trophy,  title: 'KO Bracket System',     desc: 'Auto-generated single & double elimination brackets. Advance winners with one click.' },
            { icon: Zap,     title: 'Real-Time Updates',     desc: 'Live match scores, standings, and bracket updates visible to all participants instantly.' },
            { icon: Shield,  title: 'Secure Registration',   desc: 'Team registration with captain verification, player roster management, and admin approval.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl transition-all hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${RED}15`, border: `1px solid ${RED}25` }}>
                <Icon size={22} style={{ color: RED }} />
              </div>
              <h3 className="font-black text-white text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
