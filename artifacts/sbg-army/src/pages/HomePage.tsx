import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { isFeatureActive } from '@/lib/database';
import { applyTheme } from '@/lib/applyTheme';
import { trackPageVisit } from '@/lib/analytics';
import { resolveThemeBranding } from '@/lib/themeBranding';
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
import MaintenanceScreen from '@/components/MaintenanceScreen';
import VideoSection from '@/components/VideoSection';
import ScrollToTop from '@/components/ScrollToTop';
import OfflineDetector from '@/components/OfflineDetector';
import { HomePageSkeleton } from '@/components/LoadingSkeleton';
import PlatformsSection from '@/components/PlatformsSection';
import { ThemeErrorBoundary } from '@/components/ThemeErrorBoundary';
import { Database } from '@/lib/database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const EliteHomePage = lazy(() => import('@/components/themes/EliteHomePage'));
const ProArenaHomePage = lazy(() => import('@/components/themes/ProArenaHomePage'));
const ChampionsHomePage = lazy(() => import('@/components/themes/ChampionsHomePage'));

function ClassicHomePage({ db, activeTheme }: { db: Database; activeTheme: string }) {
  const resolvedSettings = resolveThemeBranding(db.settings, activeTheme);
  const sec = (db as any).features?.sections ?? {};
  const show = (key: string) => isFeatureActive(sec[key]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {show('announcement') && <AnnouncementBar settings={resolvedSettings} />}
      <Navbar settings={resolvedSettings} navigation={db.navigation} />
      {show('ads') && <AdsRenderer ads={db.ads || []} />}
      {show('hero') && <HeroSection settings={resolvedSettings} ads={db.ads || []} db={db} />}
      {show('roster') && <RosterSection players={db.players || []} />}
      {show('matches') && <MatchesSection matches={db.matches || []} />}
      {show('schedule') && <ScheduleSection schedule={db.schedule ?? []} />}
      {show('games') && <GamesSection games={db.games || []} />}
      {show('creators') && <CreatorsSection creators={db.creators ?? []} />}
      {show('news') && <NewsSection posts={db.posts || []} />}
      {show('videos') && <VideoSection videos={db.videos ?? []} />}
      {show('founders') && <FoundersSection founders={db.founders ?? []} />}
      {show('sponsors') && <SponsorsSection sponsors={db.sponsors || []} />}
      {show('facility') && <FacilitySection facility={db.facility ?? []} facilityStats={db.facilityStats ?? []} settings={resolvedSettings} />}
      {show('contact') && <ContactSection />}
      <PlatformsSection />
      <Footer settings={resolvedSettings} navigation={db.navigation} />
      <ScrollToTop />
      <OfflineDetector />
    </div>
  );
}

export default function HomePage() {
  const { db, loading: dbLoading, activeTheme, resolvedSettings } = useDatabase();
  const tracked = useRef(false);

  useEffect(() => {
    if (!dbLoading && resolvedSettings) {
      applyTheme(resolvedSettings);
      if (!tracked.current) {
        trackPageVisit('/');
        tracked.current = true;
      }
    }
  }, [dbLoading, resolvedSettings]);

  if (dbLoading) {
    return <HomePageSkeleton />;
  }

  if (db.settings.maintenanceMode) {
    return <MaintenanceScreen settings={resolvedSettings} />;
  }

  if (activeTheme === 'new-esports' || activeTheme === 'elite') {
    return (
      <ThemeErrorBoundary fallback={<ClassicHomePage db={db} activeTheme={activeTheme} />}>
        <Suspense fallback={<HomePageSkeleton />}>
          <EliteHomePage />
        </Suspense>
      </ThemeErrorBoundary>
    );
  }

  if (activeTheme === 'pro-arena') {
    return (
      <ThemeErrorBoundary fallback={<ClassicHomePage db={db} activeTheme={activeTheme} />}>
        <Suspense fallback={<HomePageSkeleton />}>
          <ProArenaHomePage />
        </Suspense>
      </ThemeErrorBoundary>
    );
  }

  if (activeTheme === 'champions') {
    return (
      <ThemeErrorBoundary fallback={<ClassicHomePage db={db} activeTheme={activeTheme} />}>
        <Suspense fallback={<HomePageSkeleton />}>
          <ChampionsHomePage />
        </Suspense>
      </ThemeErrorBoundary>
    );
  }

  // Classic themes (Classic — {PUBLIC_BRAND_NAME} and Classic — SBG ESPORTS)
  return <ClassicHomePage db={db} activeTheme={activeTheme} />;
}
