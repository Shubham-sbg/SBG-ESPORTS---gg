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

export default function GoldLegacyHomePage({ db }: { db: Database }) {
  const sec = (db as any).features?.sections ?? {};
  const show = (key: string) => sec[key] !== false;

  return (
    <div className="min-h-screen bg-[#07070a] text-amber-50 font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden relative">
      {/* Background Gold Luxury Radial Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(212,175,55,0.08)_0%,transparent_70%)] z-0" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(212,175,55,0.04)_0%,transparent_70%)] z-0" />

      {/* Royal Gold Top Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-[#1e1708] to-amber-950/80 border-b border-amber-500/30 text-amber-300 py-1.5 px-4 text-xs font-serif flex items-center justify-between gap-4 z-10 relative backdrop-blur-md shadow-md shadow-amber-500/5">
        <div className="flex items-center gap-2.5 font-bold tracking-widest uppercase text-[11px]">
          <span className="text-amber-400 text-sm">👑</span>
          <span style={{ textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>ROYAL GOLD LEGACY // CHAMPION EDITION</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-amber-400/90 tracking-wider font-mono uppercase">
          <span>TIER-1 ESPORTS ORGANISATION</span>
          <span>EST. 2024</span>
        </div>
      </div>

      <div className="relative z-10 space-y-2">
        {show('announcement') && <AnnouncementBar settings={db.settings} />}
        <Navbar settings={db.settings} navigation={db.navigation} />
        {show('ads') && <AdsRenderer ads={db.ads || []} />}

        {/* Hero Section Framed with Gold Leaf Line */}
        {show('hero') && (
          <div className="relative border-y border-amber-500/20 bg-amber-950/10 shadow-[0_0_60px_rgba(212,175,55,0.06)]">
            <HeroSection settings={db.settings} ads={db.ads || []} db={db} />
          </div>
        )}

        {/* Roster Section */}
        {show('roster') && (
          <div className="relative border-b border-amber-500/15 py-2">
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
