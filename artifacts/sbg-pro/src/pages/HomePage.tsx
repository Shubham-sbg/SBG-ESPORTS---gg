import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useListPlayers, useListTournaments, useListPosts, useListSponsors, useGetPlatformStats } from "@workspace/api-client-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { Trophy, Users, Zap, Target, ChevronRight, Play, Shield, Star, Radio, MessageCircle, ArrowRight, Swords, Globe } from "lucide-react";
import ParticleCanvas from "@/components/3d/ParticleCanvas";
import PlayerCard3D from "@/components/3d/PlayerCard3D";

const HeroScene = lazy(() => import("@/components/3d/HeroScene"));
const TrophyScene = lazy(() => import("@/components/3d/TrophyScene"));

// ─── Animated Counter ───────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !value) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = value / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, value]);
  return <span ref={ref}>{formatNumber(count)}{suffix}</span>;
}

// ─── Countdown Timer ────────────────────────────────────────────────────
function Countdown({ targetDate }: { targetDate: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const calc = () => setDiff(Math.max(0, new Date(targetDate).getTime() - Date.now()));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  if (diff === 0) return <span className="text-red-400 font-semibold text-xs font-inter">LIVE NOW</span>;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <div className="flex gap-1.5 items-center">
      {days > 0 && <><span className="font-orbitron text-orange-400 text-sm font-bold">{String(days).padStart(2,"0")}</span><span className="text-slate-600 text-xs">d</span></>}
      <span className="font-orbitron text-orange-400 text-sm font-bold">{String(hours).padStart(2,"0")}</span><span className="text-slate-600 text-xs">h</span>
      <span className="font-orbitron text-orange-400 text-sm font-bold">{String(mins).padStart(2,"0")}</span><span className="text-slate-600 text-xs">m</span>
      <span className="font-orbitron text-white text-sm font-bold">{String(secs).padStart(2,"0")}</span><span className="text-slate-600 text-xs">s</span>
    </div>
  );
}

// ─── Scrolling Sponsor Bar ────────────────────────────────────────────────
function SponsorMarquee({ sponsors }: { sponsors: any[] }) {
  const items = [...sponsors, ...sponsors, ...sponsors];
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex gap-8 items-center"
        animate={{ x: ["0%", "-33.33%"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        {items.map((s, i) => (
          <a key={i} href={s.website || "#"} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 glass rounded-xl px-8 py-4 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,107,0,0.2)] transition-all">
            {s.logo
              ? <img src={s.logo} alt={s.name} className="h-8 object-contain opacity-50 hover:opacity-100 transition-opacity" />
              : <span className="font-orbitron text-slate-400 text-sm font-bold whitespace-nowrap">{s.name}</span>}
          </a>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Section Heading ─────────────────────────────────────────────────────
function SectionHeading({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
  return (
    <motion.div className="mb-12" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-px bg-orange-500" />
        <span className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold font-inter">{tag}</span>
        <div className="w-8 h-px bg-orange-500" />
      </div>
      <h2 className="font-orbitron text-3xl sm:text-4xl lg:text-5xl font-black text-white">{title}</h2>
      {sub && <p className="text-slate-400 mt-3 max-w-xl font-inter text-sm leading-relaxed">{sub}</p>}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: stats } = useGetPlatformStats();
  const { data: players = [] } = useListPlayers({ status: "active" } as any);
  const { data: tournaments = [] } = useListTournaments();
  const { data: posts = [] } = useListPosts();
  const { data: sponsors = [] } = useListSponsors();

  const featuredPlayers = (players as any[]).slice(0, 6);
  const liveOrUpcoming = (tournaments as any[]).filter((t: any) => t.status === "ongoing" || t.status === "upcoming").slice(0, 4);
  const completed = (tournaments as any[]).filter((t: any) => t.status === "completed").slice(0, 3);
  const latestPosts = (posts as any[]).slice(0, 3);
  const activeSponsors = (sponsors as any[]).filter((s: any) => s.active);

  const GAMES = [
    { name: "Free Fire", color: "#ff6b00", count: (players as any[]).filter((p: any) => p.game === "Free Fire").length },
    { name: "BGMI", color: "#e94560", count: (players as any[]).filter((p: any) => p.game === "BGMI").length },
    { name: "Valorant", color: "#ff4655", count: (players as any[]).filter((p: any) => p.game === "Valorant").length },
    { name: "COD Mobile", color: "#7c3aed", count: (players as any[]).filter((p: any) => p.game === "COD Mobile").length },
  ];

  return (
    <div style={{ background: "#060611", overflow: "hidden" }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Layered backgrounds */}
        <div className="absolute inset-0 cyber-grid opacity-15" />
        <div className="absolute inset-0 bg-gradient-radial from-[rgba(255,107,0,0.06)] via-transparent to-transparent" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,107,0,0.07), transparent)" }} />

        {/* 3D Scene — loads async, never blocks hero text */}
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>

        {/* Particle Canvas fallback */}
        <ParticleCanvas />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Live indicator */}
            {(tournaments as any[]).some((t: any) => t.status === "ongoing") && (
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold font-inter"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              >
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                Live Match in Progress
                <ChevronRight className="w-3 h-3" />
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="font-orbitron leading-none mb-6">
                <span className="block text-6xl sm:text-7xl lg:text-8xl font-black text-white">SBG</span>
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl font-black"
                  style={{ background: "linear-gradient(135deg, #ff6b00 0%, #e94560 50%, #ff6b00 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200%", animation: "gradient-shift 4s ease infinite" }}
                >
                  ARMY
                </span>
                <span className="block text-xl sm:text-2xl lg:text-3xl font-bold text-slate-400 mt-2 tracking-[0.2em]">INTERNATIONAL</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg font-inter"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            >
              India's premier competitive esports organization. Dominating tournaments across Free Fire, BGMI, Valorant, and COD Mobile since day one.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
            >
              <Link href="/roster">
                <a className="group inline-flex items-center gap-2.5 px-7 py-4 rounded-xl text-white font-bold text-sm font-inter transition-all"
                  style={{ background: "linear-gradient(135deg, #ff6b00, #e94560)", boxShadow: "0 0 30px rgba(255,107,0,0.3), 0 4px 20px rgba(255,107,0,0.2)" }}>
                  <Users className="w-4 h-4" />
                  Meet the Team
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Link>
              <Link href="/tournaments">
                <a className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-bold text-sm font-inter transition-all text-white"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,107,0,0.25)", backdropFilter: "blur(10px)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,0,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,0,0.25)")}
                >
                  <Trophy className="w-4 h-4 text-orange-400" />
                  Tournaments
                </a>
              </Link>
              <Link href="/live">
                <a className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-bold text-sm font-inter transition-all"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  Watch Live
                </a>
              </Link>
            </motion.div>

            {/* Game badges */}
            <motion.div
              className="flex flex-wrap gap-2 mt-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            >
              {GAMES.map((g) => (
                <div key={g.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter"
                  style={{ background: `${g.color}10`, border: `1px solid ${g.color}25`, color: g.color }}>
                  <Swords className="w-3 h-3" />
                  {g.name}
                  {g.count > 0 && <span style={{ color: "rgba(255,255,255,0.3)" }}>·{g.count}</span>}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right side: Trophy 3D */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="relative w-full h-96">
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(ellipse, rgba(255,107,0,0.08) 0%, transparent 70%)" }} />
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                </div>
              }>
                <TrophyScene className="w-full h-full" />
              </Suspense>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-orange-500/40 to-transparent" />
          <span className="text-slate-600 text-xs font-inter tracking-widest uppercase">Scroll</span>
        </motion.div>
      </section>

      {/* ── LIVE ALERT BAR ───────────────────────────────────────────── */}
      {liveOrUpcoming.some((t: any) => t.status === "ongoing") && (
        <div className="relative overflow-hidden py-3" style={{ background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.15)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
          <motion.div className="flex gap-16 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }}>
            {[...(liveOrUpcoming.filter((t: any) => t.status === "ongoing")), ...(liveOrUpcoming.filter((t: any) => t.status === "ongoing"))].map((t: any, i: number) => (
              <Link key={i} href={`/tournaments/${t.id}`}>
                <a className="inline-flex items-center gap-3 text-sm font-inter">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-red-400 font-bold">LIVE</span>
                  <span className="text-white">{t.title}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-orange-400">{t.game}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </a>
              </Link>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: "Pro Players", value: stats?.totalPlayers, icon: Users, suffix: "+", color: "#ff6b00" },
              { label: "Tournaments", value: stats?.totalTournaments, icon: Trophy, suffix: "+", color: "#e94560" },
              { label: "Monthly Fans", value: stats?.monthlyVisitors, icon: Globe, suffix: "", color: "#7c3aed" },
              { label: "Sponsors", value: stats?.totalSponsors, icon: Shield, suffix: "+", color: "#22c55e" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} className="relative group"
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" style={{ background: `radial-gradient(circle, ${stat.color}30, transparent)` }} />
                  <div className="relative rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", border: `1px solid ${stat.color}20`, backdropFilter: "blur(10px)" }}>
                    <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div className="font-orbitron text-3xl sm:text-4xl font-black text-white mb-1">
                      {stat.value !== undefined ? <AnimatedCounter value={stat.value} suffix={stat.suffix} /> : "—"}
                    </div>
                    <div className="text-slate-500 text-xs font-inter tracking-wide">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TEAM OVERVIEW ────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <SectionHeading tag="About Us" title="We Are SBG Army" />
              <div className="space-y-4 text-slate-400 font-inter text-sm leading-relaxed">
                <p>SBG ARMY is a professional esports organization headquartered in India, competing at the highest levels across multiple game titles. We believe in nurturing raw talent and transforming it into championship-winning performance.</p>
                <p>From grassroots tournaments to national championships, our players consistently deliver outstanding results. We're not just a team — we're a movement building the future of Indian esports.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { icon: Trophy, label: "Championships Won", value: "20+" },
                  { icon: Users, label: "Active Rosters", value: GAMES.length.toString() },
                  { icon: Globe, label: "Countries Represented", value: "3+" },
                  { icon: Star, label: "Years Active", value: "3+" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(255,107,0,0.04)", border: "1px solid rgba(255,107,0,0.08)" }}>
                      <Icon className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <div>
                        <div className="font-orbitron text-white font-bold text-base">{item.value}</div>
                        <div className="text-slate-500 text-xs font-inter">{item.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {GAMES.map((g, i) => (
                <motion.div key={g.name}
                  className="rounded-2xl p-5 relative overflow-hidden group cursor-default"
                  style={{ background: `${g.color}08`, border: `1px solid ${g.color}15` }}
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${g.color}60, transparent)` }} />
                  <Swords className="w-7 h-7 mb-3" style={{ color: g.color }} />
                  <div className="font-orbitron text-white font-bold mb-1 text-sm">{g.name}</div>
                  <div className="text-xs font-inter" style={{ color: g.color }}>{g.count} Players</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE & UPCOMING MATCHES ───────────────────────────────────── */}
      {liveOrUpcoming.length > 0 && (
        <section className="py-20 relative">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <SectionHeading tag="Matches" title="Live & Upcoming" />
              <Link href="/tournaments"><a className="text-orange-400 text-sm flex items-center gap-1 hover:gap-2 transition-all font-inter mb-12">All Tournaments <ChevronRight className="w-4 h-4" /></a></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {liveOrUpcoming.map((t: any, i: number) => (
                <motion.div key={t.id}
                  className="rounded-2xl overflow-hidden group relative"
                  style={{ background: t.status === "ongoing" ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)", border: t.status === "ongoing" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)" }}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -3 }}
                >
                  {t.banner && (
                    <div className="relative h-36 overflow-hidden">
                      <img src={t.banner} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,6,17,0.95), transparent)" }} />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {t.status === "ongoing"
                          ? <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />LIVE</span>
                          : <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-upcoming">UPCOMING</span>
                        }
                        <span className="text-xs font-inter text-orange-400">{t.game}</span>
                      </div>
                      {t.status === "upcoming" && <Countdown targetDate={t.startDate} />}
                    </div>
                    <h3 className="font-orbitron text-white font-bold text-sm mb-2">{t.title}</h3>
                    <div className="flex items-center justify-between">
                      {t.prizePool && <span className="text-orange-400 text-xs font-orbitron font-bold">🏆 {t.prizePool}</span>}
                      <Link href={`/tournaments/${t.id}`}>
                        <a className="text-xs text-slate-400 hover:text-orange-400 flex items-center gap-1 transition-colors font-inter ml-auto">
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PLAYER ROSTER ─────────────────────────────────────────────── */}
      {featuredPlayers.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <SectionHeading tag="Squad" title="Elite Roster" sub="Our pro players competing at the highest level." />
              <Link href="/roster"><a className="text-orange-400 text-sm flex items-center gap-1 hover:gap-2 transition-all font-inter mb-12">Full Roster <ChevronRight className="w-4 h-4" /></a></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlayers.map((player: any, i: number) => (
                <PlayerCard3D key={player.id} player={player} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TOURNAMENT RESULTS ────────────────────────────────────────── */}
      {completed.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <SectionHeading tag="Results" title="Tournament History" />
              <Link href="/tournaments"><a className="text-orange-400 text-sm flex items-center gap-1 hover:gap-2 transition-all font-inter mb-12">All Results <ChevronRight className="w-4 h-4" /></a></Link>
            </div>
            <div className="space-y-3">
              {completed.map((t: any, i: number) => (
                <motion.div key={t.id}
                  className="rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 group"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  whileHover={{ borderColor: "rgba(255,107,0,0.15)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,0,0.1)" }}>
                      <Trophy className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="font-orbitron text-white text-sm font-bold">{t.title}</div>
                      <div className="text-slate-500 text-xs font-inter mt-0.5">{t.game} · {formatDate(t.startDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {t.prizePool && <span className="text-orange-400 text-sm font-orbitron font-bold">{t.prizePool}</span>}
                    <span className="badge-completed px-2.5 py-0.5 rounded-full text-xs">Completed</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SPONSORS ──────────────────────────────────────────────────── */}
      {activeSponsors.length > 0 && (
        <section className="py-16 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
            <p className="text-slate-600 text-xs tracking-[0.3em] uppercase font-semibold font-inter">Trusted By Our Partners</p>
          </div>
          <SponsorMarquee sponsors={activeSponsors.length >= 3 ? activeSponsors : [...activeSponsors, ...activeSponsors, ...activeSponsors]} />
        </section>
      )}

      {/* ── NEWS ──────────────────────────────────────────────────────── */}
      {latestPosts.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <SectionHeading tag="Latest" title="News & Updates" />
              <Link href="/blog"><a className="text-orange-400 text-sm flex items-center gap-1 hover:gap-2 transition-all font-inter mb-12">All Posts <ChevronRight className="w-4 h-4" /></a></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post: any, i: number) => (
                <motion.div key={post.id}
                  className="rounded-2xl overflow-hidden group cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4, borderColor: "rgba(255,107,0,0.15)" }}
                >
                  <Link href={`/blog/${post.id}`}>
                    <a>
                      <div className="h-44 overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                        {post.image
                          ? <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="font-orbitron text-5xl text-slate-800 font-black">SBG</div>
                        }
                      </div>
                      <div className="p-5">
                        <span className="px-2 py-0.5 rounded text-xs font-inter capitalize" style={{ background: "rgba(255,107,0,0.08)", color: "#fb923c" }}>{post.category}</span>
                        <h3 className="font-orbitron text-white font-bold text-sm mt-2 mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-slate-500 text-xs font-inter line-clamp-2 mb-3">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-slate-600 font-inter">
                          <span>{formatDate(post.createdAt)}</span>
                          <span className="text-orange-400 group-hover:underline">Read more →</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── COMMUNITY ─────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(124,58,237,0.06), transparent)" }} />
        <div className="absolute inset-0 cyber-grid opacity-8" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.06) 0%, rgba(124,58,237,0.04) 100%)", border: "1px solid rgba(255,107,0,0.12)" }}
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #ff6b00, #7c3aed, transparent)" }} />
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.2)" }}>
              <MessageCircle className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">
              Join the <span style={{ background: "linear-gradient(135deg, #ff6b00, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Community</span>
            </h2>
            <p className="text-slate-400 text-lg font-inter mb-10 max-w-2xl mx-auto">
              Connect with thousands of SBG ARMY fans, get exclusive updates, participate in community events, and be part of something bigger.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/join">
                <a className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-white font-bold text-sm font-inter transition-all"
                  style={{ background: "linear-gradient(135deg, #ff6b00, #e94560)", boxShadow: "0 0 30px rgba(255,107,0,0.25)" }}>
                  <Target className="w-4 h-4" />
                  Apply to Team
                </a>
              </Link>
              <a href="https://discord.gg/sbgarmy" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm font-inter text-white transition-all"
                style={{ background: "rgba(88,101,242,0.12)", border: "1px solid rgba(88,101,242,0.25)" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.013.042.028.054a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
                Discord
              </a>
              <Link href="/contact">
                <a className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm font-inter text-slate-300 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Contact Us
                </a>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
