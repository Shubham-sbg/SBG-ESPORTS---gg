import { Switch, Route, Router as WouterRouter } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import TournamentsPage from '@/pages/TournamentsPage';
import TournamentDetailPage from '@/pages/TournamentDetailPage';
import RegisterPage from '@/pages/RegisterPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import AdminPage from '@/pages/AdminPage';
import NotFound from '@/pages/not-found';

const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/tournaments" component={TournamentsPage} />
          <Route path="/tournament/:id" component={TournamentDetailPage} />
          <Route path="/register/:id" component={RegisterPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <WouterRouter base={base}>
      <AppShell />
    </WouterRouter>
  );
}
