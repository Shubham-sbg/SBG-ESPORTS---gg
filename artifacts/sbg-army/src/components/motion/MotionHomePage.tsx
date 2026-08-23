import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import AnnouncementBar from '@/components/AnnouncementBar';
import AdsRenderer from '@/components/AdsRenderer';
import RosterSection from '@/components/RosterSection';
import MatchesSection from '@/components/MatchesSection';
import NewsSection from '@/components/NewsSection';
import SponsorsSection from '@/components/SponsorsSection';
import GamesSection from '@/components/GamesSection';
import FacilitySection from '@/components/FacilitySection';
import ScheduleSection from '@/components/ScheduleSection';
import CreatorsSection from '@/components/CreatorsSection';
import FoundersSection from '@/components/FoundersSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import VideoSection from '@/components/VideoSection';
import ScrollToTop from '@/components/ScrollToTop';
import OfflineDetector from '@/components/OfflineDetector';
import PlatformsSection from '@/components/PlatformsSection';
import { Database } from '@/lib/database';

interface Props {
  db: Database;
}

const GOLD = '#d4af37';

export default function MotionHomePage({ db }: Props) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Mouse move parallax for Hero
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const sec = (db as any).features?.sections ?? {};
  const show = (key: string) => sec[key] !== false;

  const heroSettings = db.settings || {};
  const heroStats = heroSettings.heroStats || [
    { label: 'Pro Athletes', value: '25+', numericEnd: 25, suffix: '+' },
    { label: 'Major Trophies', value: '40+', numericEnd: 40, suffix: '+' },
    { label: 'Global Win Rate', value: '88%', numericEnd: 88, suffix: '%' },
    { label: 'Active Fans', value: '250K+', numericEnd: 250, suffix: 'K+' },
  ];

  return (
    <div className="min-h-screen bg-[#07070b] text-white overflow-x-hidden relative selection:bg-yellow-500 selection:text-black">
      {/* Motion Background Ambient Particles Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] transition-transform duration-700"
          style={{
            transform: reducedMotion ? 'none' : `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)`,
          }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[150px] transition-transform duration-700"
          style={{
            transform: reducedMotion ? 'none' : `translate(${mousePos.x * -50}px, ${mousePos.y * -50}px)`,
          }}
        />
        <div
          className="absolute bottom-10 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[130px] transition-transform duration-700"
        />
        {/* Esports Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      <div className="relative z-10 space-y-0">
        {show('announcement') && <AnnouncementBar settings={db.settings} />}
        <Navbar settings={db.settings} navigation={db.navigation} />
        {show('ads') && <AdsRenderer ads={db.ads || []} />}

        {/* ── MOTION HERO SECTION ────────────────────────────────────────── */}
        {show('hero') && (
          <section
            ref={heroRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 py-16 md:py-24 overflow-hidden border-b border-white/10"
          >
            {/* Cinematic Hero Image / Video with motion zoom */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {heroSettings.heroVideoUrl ? (
                <video
                  src={heroSettings.heroVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-25 scale-105 transition-transform duration-1000"
                />
              ) : heroSettings.heroImageUrl ? (
                <img
                  src={heroSettings.heroImageUrl}
                  alt="Esports Arena"
                  className="w-full h-full object-cover opacity-20 scale-105 transition-transform duration-1000"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-yellow-500/5 via-transparent to-[#07070b]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/70 to-transparent" />
            </div>

            {/* Motion Hero Card */}
            <div
              className="relative z-10 max-w-5xl mx-auto text-center space-y-6 transition-all duration-500"
              style={{
                transform: reducedMotion
                  ? 'none'
                  : `perspective(1000px) rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg)`,
              }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-yellow-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.2)] animate-pulse">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
                  {heroSettings.tagline || 'OFFICIAL ESPORTS DOMINANCE'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase text-white drop-shadow-2xl">
                {heroSettings.organizationName || 'SBG ESPORTS'}
                <span
                  className="block text-transparent bg-clip-text mt-1"
                  style={{ backgroundImage: `linear-gradient(135deg, ${GOLD}, #fff, #b8960c)` }}
                >
                  NEXT-GEN GAMING
                </span>
              </h1>

              <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-gray-300 font-medium leading-relaxed drop-shadow">
                Competing at the highest competitive tier. Pushing limits across Tournaments, Live Streams, and Elite Facilities.
              </p>

              {/* Hero CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <a
                  href="#roster"
                  className="px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #f5d061)` }}
                >
                  <span>⚔️</span> Explore Roster
                </a>
                <a
                  href="/tournaments"
                  className="px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-white/5 border border-white/15 hover:bg-white/15 transition-all duration-300 hover:border-yellow-500/50 backdrop-blur-md"
                >
                  Tournaments & Schedule
                </a>
              </div>

              {/* Animated Hero Counters */}
              {show('heroStats') && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
                  {heroStats.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md transition-all duration-300 hover:border-yellow-500/40 hover:-translate-y-1 hover:bg-white/[0.06]"
                    >
                      <div
                        className="text-3xl md:text-4xl font-black tracking-tight"
                        style={{ color: GOLD }}
                      >
                        {st.value}
                      </div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                        {st.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── MOTION SECTIONS ────────────────────────────────────────────── */}
        <div className="space-y-16 py-8">
          {show('roster') && (
            <div className="transition-all duration-500">
              <RosterSection players={db.players || []} />
            </div>
          )}

          {show('matches') && (
            <div className="transition-all duration-500">
              <MatchesSection matches={db.matches || []} />
            </div>
          )}

          {show('schedule') && (
            <div className="transition-all duration-500">
              <ScheduleSection schedule={db.schedule ?? []} />
            </div>
          )}

          {show('games') && (
            <div className="transition-all duration-500">
              <GamesSection games={db.games || []} />
            </div>
          )}

          {show('creators') && (
            <div className="transition-all duration-500">
              <CreatorsSection creators={db.creators ?? []} />
            </div>
          )}

          {show('news') && (
            <div className="transition-all duration-500">
              <NewsSection posts={db.posts || []} />
            </div>
          )}

          {show('videos') && (
            <div className="transition-all duration-500">
              <VideoSection videos={db.videos ?? []} />
            </div>
          )}

          {show('founders') && (
            <div className="transition-all duration-500">
              <FoundersSection founders={db.founders ?? []} />
            </div>
          )}

          {show('sponsors') && (
            <div className="transition-all duration-500">
              <SponsorsSection sponsors={db.sponsors || []} />
            </div>
          )}

          {show('facility') && (
            <div className="transition-all duration-500">
              <FacilitySection facility={db.facility ?? []} facilityStats={db.facilityStats ?? []} settings={db.settings} />
            </div>
          )}

          {show('contact') && (
            <div className="transition-all duration-500">
              <ContactSection />
            </div>
          )}

          <PlatformsSection />
        </div>

        <Footer settings={db.settings} navigation={db.navigation} />
        <ScrollToTop />
        <OfflineDetector />
      </div>
    </div>
  );
}
