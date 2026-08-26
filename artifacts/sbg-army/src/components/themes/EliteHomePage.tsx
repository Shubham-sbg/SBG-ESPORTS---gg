import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useDatabase } from '@/hooks/useDatabase';
import { isFeatureActive, isPlacementActive } from '@/lib/database';
import Navbar from '@/components/Navbar';
import AdsRenderer from '@/components/AdsRenderer';
import Footer from '@/components/Footer';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';
import { ThreeBackground } from '@/components/HeroSection';

const GOLD = '#d4af37';
const HUD_COLOR = 'rgba(212,175,55,0.2)';

export default function EliteHomePage() {
  const { db, loading } = useDatabase();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-t-2 border-r-2 border-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  if (!db) return <MaintenanceScreen settings={{} as any} />;
  const settings = db.settings || {} as any;
  if (settings.maintenanceMode) return <MaintenanceScreen settings={settings as any} />;

  const features = db.features || { sections: {}, pages: {} } as any;
  const show = (key: string) => isFeatureActive(features.sections?.[key]);
  const showPage = (key: string) => isFeatureActive(features.pages?.[key]);

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-[#d4af37] selection:text-black overflow-x-hidden">
      {show('ads') && <AdsRenderer ads={db.ads || []} />}
      <Navbar settings={db.settings as any} navigation={db.navigation as any} />
      
      {/* Background Cinematic Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4af37] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.03] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#d4af37] rounded-full mix-blend-screen filter blur-[180px] opacity-[0.02]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSJyZ2JhKDIxMiwgMTc1LCA1NSwgMC4wNSkiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0wIDYwaDYwIi8+PHBhdGggZD0iTTYwIDB2NjAiLz48L2c+PC9zdmc+')] opacity-30" />
      </div>

      <div className="relative z-10 pt-20">
        {show('hero') && <EliteHero db={db} />}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
          {show('heroStats') && <EliteStats db={db} />}
          {show('roster') && <EliteTeams db={db} />}
          {show('matches') && <EliteMatches db={db} />}
          {show('schedule') && <EliteTournaments db={db} />}
          {show('roster') && <ElitePlayers db={db} />}
          {showPage('hallOfFame') && <EliteAchievements db={db} />}
          {showPage('join') && <EliteRecruitment db={db} />}
          {show('facility') && <EliteFacility db={db} />}
          {(showPage('live') || show('games')) && <EliteLiveStream db={db} />}
          {show('news') && <EliteNews db={db} />}
          {show('sponsors') && <EliteSponsors db={db} />}
        </div>
      </div>
      
      <Footer settings={db.settings as any} navigation={db.navigation as any} />
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="flex flex-col items-center text-center mb-16 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#d4af37] opacity-[0.03] blur-[50px] rounded-full pointer-events-none" />
      <span className="text-[#d4af37] text-xs font-black tracking-[0.4em] uppercase mb-4 flex items-center gap-4">
        <span className="w-8 h-px bg-[#d4af37]/50" />
        {subtitle}
        <span className="w-8 h-px bg-[#d4af37]/50" />
      </span>
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
        {title}
      </h2>
    </div>
  );
}

function EliteHero({ db }: any) {
  const pages = db?.features?.pages || {};
  const settings = db?.settings || {};

  const canJoin = isFeatureActive(pages.join) && isPlacementActive(pages.join, 'cta') && settings.heroCtaJoinVisible !== false;
  const canTournaments = isFeatureActive(pages.tournaments) && isPlacementActive(pages.tournaments, 'cta') && settings.heroCtaTournamentVisible !== false;
  const canPlayerLogin = isFeatureActive(pages.playerPortal) && isPlacementActive(pages.playerPortal, 'cta');
  const canDashboard = isFeatureActive(pages.dashboard) && isPlacementActive(pages.dashboard, 'cta');
  const canMatches = isFeatureActive(pages.live) && isPlacementActive(pages.live, 'cta') && settings.heroCtaLiveVisible !== false;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 z-0">
        <ThreeBackground settings={settings} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020202]/80 to-[#020202] z-10 pointer-events-none" />
        <video 
          autoPlay loop muted playsInline 
          className="w-full h-full object-cover opacity-15 filter grayscale contrast-150 mix-blend-screen pointer-events-none"
          poster="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
        />
      </div>

      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
          }}
          className="flex flex-col items-center"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }}>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-[10px] font-bold text-[#d4af37] tracking-[0.3em] uppercase">Professional Esports Organization</span>
            </div>
          </motion.div>
          
          <motion.h1 variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } } }} className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-tighter leading-[0.85] mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">SBG</span><br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#d4af37] to-[#8a7224] drop-shadow-[0_0_40px_rgba(212,175,55,0.2)]">ARMY</span>
          </motion.h1>
          
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }} className="text-lg md:text-2xl text-gray-400 font-medium tracking-[0.2em] uppercase mb-12 max-w-2xl mx-auto">
            Born to Win. Built to Dominate.
          </motion.p>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }} className="flex flex-wrap justify-center gap-4">
            {canJoin && (
              <Link href="/join">
                <a className="group relative px-8 py-4 bg-[#d4af37] text-black font-black uppercase tracking-widest text-sm overflow-hidden flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <span className="relative z-10">⚔️ Join Team</span>
                  <span className="relative z-10">↗</span>
                </a>
              </Link>
            )}
            {canTournaments && (
              <Link href="/tournaments">
                <a className="group px-8 py-4 bg-[#d4af37]/10 border border-[#d4af37]/50 hover:border-[#d4af37] text-[#d4af37] font-black uppercase tracking-widest text-sm transition-all hover:bg-[#d4af37]/20 hover:scale-105 active:scale-95 flex items-center gap-2">
                  🏆 Register for Tournament
                </a>
              </Link>
            )}
            {canPlayerLogin && (
              <Link href="/player-login">
                <a className="group px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#d4af37]/50 text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center gap-2">
                  👤 Player Login
                </a>
              </Link>
            )}
            {canDashboard && (
              <Link href="/dashboard">
                <a className="group px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#d4af37]/50 text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center gap-2">
                  📊 Dashboard
                </a>
              </Link>
            )}
            {canMatches && (
              <Link href={isFeatureActive(pages.live) ? "/live" : "/matches"}>
                <a className="group px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#d4af37]/50 text-white/80 hover:text-white font-black uppercase tracking-widest text-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95">
                  ▶ Watch Matches
                </a>
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-20">
        <span className="text-[10px] font-bold tracking-[0.3em] text-[#d4af37] uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-[#d4af37] to-transparent" />
      </div>
    </section>
  );
}

function EliteStats({ db }: any) {
  const settingsStats = db?.settings?.heroStats;
  const realPlayers = (db?.players || []).filter((p: any) => p.visible !== false).length;
  const realTournaments = (db?.tournaments || []).length;
  const matches = db?.matches || [];
  const completedMatches = matches.filter((m: any) => m.result === 'W' || m.result === 'L');
  const wins = matches.filter((m: any) => m.result === 'W').length;
  const calculatedWinRate = completedMatches.length > 0 
    ? `${Math.round((wins / completedMatches.length) * 100)}%`
    : '78%';
  const realTitles = (db?.achievements || []).length;

  let statsList: Array<{ label: string; value: string }> = [];

  if (settingsStats && Array.isArray(settingsStats) && settingsStats.length > 0) {
    statsList = settingsStats
      .filter((s: any) => s.visible !== false)
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((s: any) => {
        let val = s.value;
        const lbl = (s.label || '').toLowerCase();
        if (!val || val === '00' || val === '0' || val === '-') {
          if (lbl.includes('player')) val = realPlayers > 0 ? `${realPlayers}+` : '20+';
          else if (lbl.includes('tournament')) val = realTournaments > 0 ? `${realTournaments}+` : '50+';
          else if (lbl.includes('win')) val = calculatedWinRate;
          else if (lbl.includes('title')) val = realTitles > 0 ? `${realTitles}` : '15';
        }
        return {
          label: s.label,
          value: val || '0',
        };
      });
  } else {
    statsList = [
      { label: 'Pro Players', value: realPlayers > 0 ? `${realPlayers}+` : '20+' },
      { label: 'Tournaments', value: realTournaments > 0 ? `${realTournaments}+` : '50+' },
      { label: 'Win Rate', value: calculatedWinRate },
      { label: 'Titles', value: realTitles > 0 ? `${realTitles}` : '15' }
    ];
  }

  return (
    <section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {statsList.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl text-center group overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">
              {stat.value}
            </h3>
            <p className="text-[10px] font-bold text-[#d4af37] tracking-[0.2em] uppercase">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function EliteTeams({ db }: any) {
  const teams = db.teams || [];
  if (!teams.length) return null;

  return (
    <section>
      <SectionHeader title="Our Teams" subtitle="Elite Rosters" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team: any, i: number) => (
          <motion.div 
            key={team.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-8 relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-6">
                {team.logo || '🛡️'}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-1">{team.name}</h3>
              <p className="text-sm text-[#d4af37] font-bold mb-6">{team.game}</p>
              
              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-center text-xs border-t border-white/10 pt-4">
                  <span className="text-gray-400">Players</span>
                  <span className="font-bold">{db.users?.filter((u:any) => u.teamId === team.id).length || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/10 pt-4">
                  <span className="text-gray-400">Status</span>
                  <span className="font-bold text-emerald-400">Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ElitePlayers({ db }: any) {
  const players = db.users?.filter((u:any) => u.teamRole === 'Player') || [];
  if (!players.length) return null;

  return (
    <section>
      <SectionHeader title="Our Players" subtitle="The Vanguard" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {players.slice(0, 8).map((p: any, i: number) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[#050505]"
          >
            <Image src={p.photo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&h=600&fit=crop'} alt={p.name} objectFit="cover" className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-500 filter grayscale group-hover:grayscale-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 w-full">
              <h4 className="text-lg font-black uppercase tracking-tight">{p.name}</h4>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-[#d4af37] font-bold tracking-widest uppercase">{p.role || 'Pro Player'}</p>
                <p className="text-[10px] text-gray-400">{p.gameId ? db.games?.find((g:any)=>g.id===p.gameId)?.name : 'Esports'}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function EliteAchievements({ db }: any) {
  const achievements = db.achievements || [];
  if (!achievements.length) return null;

  return (
    <section>
      <SectionHeader title="Trophy Room" subtitle="Legacy of Excellence" />
      <div className="grid md:grid-cols-3 gap-6">
        {achievements.slice(0, 3).map((a: any, i: number) => (
          <motion.div 
            key={a.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 to-black text-center group"
          >
            <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-500">{a.icon || '🏆'}</div>
            <h4 className="text-xl font-black uppercase mb-2">{a.title}</h4>
            <p className="text-sm text-[#d4af37] font-bold mb-4">{a.game}</p>
            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
              {a.year} - {a.position || '1st Place'}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Link href="/trophy-room">
          <a className="inline-flex items-center gap-2 text-sm font-bold text-[#d4af37] uppercase tracking-widest hover:text-white transition-colors">
            View All Achievements <span className="text-xl">→</span>
          </a>
        </Link>
      </div>
    </section>
  );
}

function EliteMatches({ db }: any) {
  const matches = db.matches || [];
  if (!matches.length) return null;

  return (
    <section>
      <SectionHeader title="Matches" subtitle="Battle Log" />
      <div className="space-y-4">
        {matches.slice(0, 5).map((m: any, i: number) => {
          const isWin = m.result === 'W';
          const isLoss = m.result === 'L';
          const isPending = !m.result;
          return (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors gap-4"
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-lg border ${isWin ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : isLoss ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                  {m.result || '-'}
                </div>
                <div>
                  <h4 className="font-black text-lg uppercase">VS {m.opponent}</h4>
                  <p className="text-xs text-gray-400">{m.game} • {m.tournament}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm font-bold">
                <span className="text-[#d4af37]">{new Date(m.date).toLocaleDateString()}</span>
                <span className="text-gray-400">{m.score || 'TBD'}</span>
                {m.vodUrl && (
                  <a href={m.vodUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded border border-white/10 hover:border-[#d4af37] hover:text-[#d4af37] transition-colors">VOD</a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function EliteTournaments({ db }: any) {
  const tournaments = db.tournaments || [];
  if (!tournaments.length) return null;

  return (
    <section>
      <SectionHeader title="Tournaments" subtitle="The Pro Circuit" />
      <div className="grid md:grid-cols-2 gap-6">
        {tournaments.slice(0, 4).map((t: any, i: number) => (
          <motion.div 
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-black"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-black uppercase">{t.name}</h4>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${t.status === 'Upcoming' ? 'bg-[#d4af37]/20 text-[#d4af37]' : t.status === 'Ongoing' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'}`}>
                {t.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-6">
              <span className="flex items-center gap-2">🎮 {t.game}</span>
              <span className="flex items-center gap-2">📅 {new Date(t.startDate).toLocaleDateString()}</span>
              {t.prizePool && <span className="flex items-center gap-2">💰 {t.prizePool}</span>}
            </div>
            <Link href={`/tournaments/${t.id}`}>
              <a className="inline-block w-full py-3 text-center rounded bg-white/5 hover:bg-white/10 font-bold uppercase text-xs tracking-widest transition-colors border border-white/5">View Details</a>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function EliteRecruitment({ db }: any) {
  const openings = db.recruitmentOpenings?.filter((o:any) => o.status === 'Open') || [];
  if (!openings.length) return null;

  return (
    <section className="relative p-12 md:p-24 rounded-3xl overflow-hidden border border-[#d4af37]/30 bg-black text-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center opacity-10 filter grayscale" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-[#d4af37] to-white">
          Ready to join the Army?
        </h2>
        <p className="text-gray-400 text-lg mb-12">We are actively recruiting top-tier talent to dominate the professional circuit.</p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {openings.map((o: any) => (
            <div key={o.id} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-bold">
              {o.title} <span className="text-[#d4af37] ml-2">{o.game}</span>
            </div>
          ))}
        </div>
        
        <Link href="/join">
          <a className="inline-flex items-center gap-3 px-10 py-5 bg-[#d4af37] text-black font-black uppercase tracking-widest rounded transition-transform hover:scale-105 shadow-[0_0_40px_rgba(212,175,55,0.3)]">
            Apply Now
          </a>
        </Link>
      </div>
    </section>
  );
}

function EliteFacility({ db }: any) {
  const facility = db.facility || { name: 'SBG Headquarters' };
  
  return (
    <section className="grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-8">
        <SectionHeader title={facility.name} subtitle="Our Facility" />
        <p className="text-gray-400 text-lg leading-relaxed">{facility.description || 'State of the art training grounds designed for champions. Engineered for zero latency, ultimate comfort, and tactical superiority.'}</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-black text-white uppercase">4K Monitors</h4>
            <p className="text-xs text-gray-500">240Hz+ Refresh Rate</p>
          </div>
          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-black text-white uppercase">Fiber Connect</h4>
            <p className="text-xs text-gray-500">Sub-1ms Latency</p>
          </div>
          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-black text-white uppercase">Pro Gear</h4>
            <p className="text-xs text-gray-500">Sponsored Peripherals</p>
          </div>
          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-black text-white uppercase">VOD Room</h4>
            <p className="text-xs text-gray-500">Tactical Analysis</p>
          </div>
        </div>
      </div>
      <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
        <Image src={facility.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000"} alt="Facility" objectFit="cover" className="w-full h-full object-cover filter grayscale contrast-125" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-[#d4af37]/20 mix-blend-overlay" />
      </div>
    </section>
  );
}

function EliteLiveStream({ db }:any) {
  const streams = db.livestreams || [];
  if (!streams.length) return null;
  const activeStream = streams.find((s:any) => s.isLive) || streams[0];

  return (
    <section>
      <SectionHeader title="Live Streams" subtitle="Watch Us Live" />
      <div className="relative rounded-3xl overflow-hidden border border-[#d4af37]/20 bg-black aspect-video group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
        <Image src={activeStream.thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000"} alt="Stream" objectFit="cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-12">
          <div className="self-start">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {activeStream.isLive ? 'LIVE NOW' : 'OFFLINE'}
            </span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-3xl md:text-5xl font-black uppercase mb-2">{activeStream.title || '${PUBLIC_BRAND_NAME} Stream'}</h3>
              <p className="text-[#d4af37] font-bold">{activeStream.platform || 'Twitch'}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transform group-hover:scale-110 transition-transform">
              <span className="text-2xl ml-1">▶</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EliteNews({ db }: any) {
  const articles = db.articles || [];
  if (!articles.length) return null;

  return (
    <section>
      <SectionHeader title="Latest Intel" subtitle="News & Updates" />
      <div className="grid md:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article: any, i: number) => (
          <Link key={article.id} href={`/blog/${article.id}`}>
            <a className="group block h-full border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/5 transition-all">
              <div className="aspect-video overflow-hidden">
                <Image src={article.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800'} alt={article.title} objectFit="cover" className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
              </div>
              <div className="p-6">
                <div className="flex gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">
                  <span>{new Date(article.date).toLocaleDateString()}</span>
                  <span className="text-[#d4af37]">{article.category || 'News'}</span>
                </div>
                <h4 className="text-xl font-black uppercase mb-3 line-clamp-2">{article.title}</h4>
                <p className="text-sm text-gray-400 line-clamp-2">{article.excerpt}</p>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EliteSponsors({ db }: any) {
  const sponsors = db.sponsors || [];
  if (!sponsors.length) return null;

  return (
    <section className="py-12 border-t border-b border-white/5">
      <p className="text-center text-[10px] text-gray-500 font-black tracking-[0.4em] uppercase mb-8">Powered By Partners</p>
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
        {sponsors.map((s: any) => (
          <Image key={s.id} src={s.logo} alt={s.name} objectFit="contain" className="h-12 object-contain" />
        ))}
      </div>
    </section>
  );
}
