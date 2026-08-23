import { Database } from '@/lib/database';
import Navbar from '@/components/Navbar';
import AnnouncementBar from '@/components/AnnouncementBar';
import HeroSection from '@/components/HeroSection';
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
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

export default function CyberpunkHomePage({ db }: { db: Database }) {
  const sec = (db as any).features?.sections ?? {};
  const show = (key: string) => sec[key] !== false;

  return (
    <div className="min-h-screen bg-[#050811] text-cyan-50 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden relative">
      {/* Background Cyber HUD Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#00f3ff12_1px,transparent_1px),linear-gradient(to_bottom,#00f3ff12_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(0,243,255,0.08)_0%,transparent_70%)] z-0" />

      {/* Cyber Status Ticker */}
      <div className="bg-cyan-950/60 border-b border-cyan-500/30 text-cyan-300 py-1 px-4 text-[11px] font-mono flex items-center justify-between gap-4 z-10 relative backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>CYBER HUD v3.0 // {PUBLIC_BRAND_NAME} PROTOCOL ACTIVE</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-cyan-400/80 font-mono">
          <span>LATENCY: 12ms</span>
          <span>SECURITY: ENCRYPTED</span>
          <span>FPS: 240Hz</span>
        </div>
      </div>

      <div className="relative z-10 space-y-2">
        {show('announcement') && <AnnouncementBar settings={db.settings} />}
        <Navbar settings={db.settings} navigation={db.navigation} />
        {show('ads') && <AdsRenderer ads={db.ads || []} />}

        {/* Hero Section Wrapped in Cyberpunk HUD Accent */}
        {show('hero') && (
          <div className="relative border-y border-cyan-500/20 bg-cyan-950/20 shadow-[0_0_50px_rgba(0,243,255,0.05)]">
            <HeroSection settings={db.settings} ads={db.ads || []} db={db} />
          </div>
        )}

        {/* Roster with Cyberpunk Neon Framing */}
        {show('roster') && (
          <div className="relative border-b border-cyan-500/15 py-4">
            <RosterSection players={db.players || []} />
          </div>
        )}

        {show('matches') && <MatchesSection matches={db.matches || []} />}
        {show('schedule') && <ScheduleSection schedule={db.schedule ?? []} />}
        {show('games') && <GamesSection games={db.games || []} />}
        {show('creators') && <CreatorsSection creators={db.creators ?? []} />}
        {show('news') && <NewsSection posts={db.posts || []} />}
        {show('videos') && <VideoSection videos={db.videos ?? []} />}
        {show('founders') && <FoundersSection founders={db.founders ?? []} />}
        {show('sponsors') && <SponsorsSection sponsors={db.sponsors || []} />}
        {show('facility') && <FacilitySection facility={db.facility ?? []} facilityStats={db.facilityStats ?? []} settings={db.settings} />}
        {show('contact') && <ContactSection />}
        <PlatformsSection />
        <Footer settings={db.settings} navigation={db.navigation} />
      </div>

      <ScrollToTop />
      <OfflineDetector />
    </div>
  );
}
