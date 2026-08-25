import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import CookieConsent from "@/components/CookieConsent";
import SiteEffects from "@/components/SiteEffects";
import Global3DParticles from "@/components/Global3DParticles";
import { getDB, isFeatureActive } from "@/lib/database";
import { useDatabase } from "@/hooks/useDatabase";
import { PageSkeleton } from "@/components/LoadingSkeleton";

import HomePage from "@/pages/HomePage";

const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ShopPage = lazy(() => import("@/pages/ShopPage"));
const TournamentsPage = lazy(() => import("@/pages/TournamentsPage"));
const CommunityPage = lazy(() => import("@/pages/CommunityPage"));
const FanConnectPage = lazy(() => import("@/pages/FanConnectPage"));
const GiveawaysPage = lazy(() => import("@/pages/GiveawaysPage"));
const CollaboratePage = lazy(() => import("@/pages/CollaboratePage"));
const PlayerLoginPage = lazy(() => import("@/pages/PlayerLoginPage"));
const PlayerRegisterPage = lazy(() => import("@/pages/PlayerRegisterPage"));
const PlayerDashboardPage = lazy(() => import("@/pages/PlayerDashboardPage"));
const StaffLoginPage = lazy(() => import("@/pages/StaffLoginPage"));
const StaffDashboard = lazy(() => import("@/pages/StaffDashboard"));
const HallOfFamePage = lazy(() => import("@/pages/HallOfFamePage"));
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage"));
const LivePage = lazy(() => import("@/pages/LivePage"));
const JoinTeamPage = lazy(() => import("@/pages/JoinTeamPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const CookiePolicyPage = lazy(() => import("@/pages/CookiePolicyPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const EventsPage = lazy(() => import("@/pages/EventsPage"));
const LeaderboardsPage = lazy(() => import("@/pages/LeaderboardsPage"));
const TournamentBracketPage = lazy(() => import("@/pages/TournamentBracketPage"));

const FeedbackPage = lazy(() => import("@/pages/FeedbackPage"));
const SchedulePage = lazy(() => import("@/pages/SchedulePage"));
const RecordsPage = lazy(() => import("@/pages/RecordsPage"));
const StatsDashboardPage = lazy(() => import("@/pages/StatsDashboardPage"));
const TeamHistoryPage = lazy(() => import("@/pages/TeamHistoryPage"));
const TrophyRoomPage = lazy(() => import("@/pages/TrophyRoomPage"));
const HOFTimelinePage = lazy(() => import("@/pages/HOFTimelinePage"));

import AdminGuard from "@/components/AdminGuard";
import StaffGuard from "@/components/StaffGuard";
const NotFound = lazy(() => import("@/pages/not-found"));

import RecruitmentPopup from "@/components/RecruitmentPopup";
import { resolveThemeBranding } from "@/lib/themeBranding";
import { applyTheme } from "@/lib/applyTheme";

const queryClient = new QueryClient();

/**
 * FeatureRoute — renders `component` only if db.features.pages[pageKey] !== false.
 * When disabled, redirects to "/" so the rest of the site stays intact.
 */
function FeatureRoute({
  path,
  pageKey,
  component: Component,
}: {
  path: string;
  pageKey: string;
  component: React.ComponentType;
}) {
  return (
    <Route path={path}>
      {() => {
        const db = getDB() as any;
        const pages = db?.features?.pages ?? {};
        // Undefined = not yet set → default ON
        if (!isFeatureActive(pages[pageKey])) return <Redirect to="/" />;
        return <Component />;
      }}
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      {/* ── Public pages (always visible) ───────────────────────────────── */}
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/cookie-policy" component={CookiePolicyPage} />
      <FeatureRoute path="/gallery" pageKey="gallery" component={GalleryPage} />
      <FeatureRoute path="/dashboard" pageKey="dashboard" component={DashboardPage} />
      <FeatureRoute path="/brackets" pageKey="tournaments" component={TournamentBracketPage} />

      {/* ── Previously-unrouted pages (now fully active) ─────────────────── */}
      <FeatureRoute path="/feedback"      pageKey="feedback"      component={FeedbackPage} />
      <FeatureRoute path="/schedule"      pageKey="schedule"      component={SchedulePage} />
      <FeatureRoute path="/records"       pageKey="records"       component={RecordsPage} />
      <FeatureRoute path="/stats"         pageKey="stats"         component={StatsDashboardPage} />
      <FeatureRoute path="/team-history"  pageKey="teamHistory"   component={TeamHistoryPage} />
      <FeatureRoute path="/trophy-room"   pageKey="trophyRoom"    component={TrophyRoomPage} />
      <FeatureRoute path="/hof-timeline"  pageKey="hofTimeline"   component={HOFTimelinePage} />

      {/* ── Feature-flagged pages ────────────────────────────────────────── */}
      <FeatureRoute path="/shop"        pageKey="shop"         component={ShopPage} />
      <FeatureRoute path="/tournaments" pageKey="tournaments"  component={TournamentsPage} />
      <FeatureRoute path="/leaderboards"pageKey="leaderboards" component={LeaderboardsPage} />
      <FeatureRoute path="/events"      pageKey="events"       component={EventsPage} />
      <FeatureRoute path="/blog"        pageKey="blog"         component={BlogPage} />
      <FeatureRoute path="/hall-of-fame"pageKey="hallOfFame"   component={HallOfFamePage} />
      <FeatureRoute path="/live"        pageKey="live"         component={LivePage} />
      <FeatureRoute path="/join"        pageKey="join"         component={JoinTeamPage} />
      <FeatureRoute path="/join-team"   pageKey="join"         component={JoinTeamPage} />
      <FeatureRoute path="/community"   pageKey="community"    component={CommunityPage} />
      <FeatureRoute path="/fan-connect" pageKey="fanConnect"   component={FanConnectPage} />
      <FeatureRoute path="/giveaways"   pageKey="giveaways"    component={GiveawaysPage} />
      <FeatureRoute path="/collaborate" pageKey="collaborate"  component={CollaboratePage} />
      <FeatureRoute path="/achievements"pageKey="achievements" component={AchievementsPage} />

      {/* ── Player account portal ─────────────────────────────────────────── */}
      <FeatureRoute path="/player-login"     pageKey="playerPortal" component={PlayerLoginPage} />
      <FeatureRoute path="/player-register"  pageKey="playerPortal" component={PlayerRegisterPage} />
      <FeatureRoute path="/player-dashboard" pageKey="playerPortal" component={PlayerDashboardPage} />
      <FeatureRoute path="/player"           pageKey="playerPortal" component={PlayerLoginPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* ── Staff portal ──────────────────────────────────────────────────── */}
      <Route path="/staff" component={StaffLoginPage} />
      <Route path="/staff-dashboard">
        <StaffGuard>
          <StaffDashboard />
        </StaffGuard>
      </Route>

      {/* ── Admin Control Center ──────────────────────────────────────────── */}
      <Route path="/sbg-admin">
        <AdminGuard>
          <AdminPage />
        </AdminGuard>
      </Route>
      <Route path="/admin">
        <Redirect to="/sbg-admin" />
      </Route>

      {/* ── 404 ──────────────────────────────────────────────────────────── */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { resolvedSettings } = useDatabase();

  useEffect(() => {
    if (resolvedSettings) {
      applyTheme(resolvedSettings);
    }
  }, [resolvedSettings]);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <SiteEffects />
        <Global3DParticles />
        <RecruitmentPopup />
        <Suspense fallback={<PageSkeleton />}>
          <Router />
        </Suspense>
        <CookieConsent />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
