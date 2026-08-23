import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
// Local session auth — Firebase no longer required for admin login
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminRoster from '@/components/admin/AdminRoster';
import AdminMatches from '@/components/admin/AdminMatches';
import AdminSponsors from '@/components/admin/AdminSponsors';
import AdminNews from '@/components/admin/AdminNews';
import AdminGames from '@/components/admin/AdminGames';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAds from '@/components/admin/AdminAds';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminNavigation from '@/components/admin/AdminNavigation';
import AdminSchedule from '@/components/admin/AdminSchedule';
import AdminCreators from '@/components/admin/AdminCreators';
import AdminFounders from '@/components/admin/AdminFounders';
import AdminShop from '@/components/admin/AdminShop';
import AdminStaffManager from '@/components/admin/AdminStaffManager';
import AdminTournaments from '@/components/admin/AdminTournaments';
import AdminFanMessages from '@/components/admin/AdminFanMessages';
import AdminGiveaways from '@/components/admin/AdminGiveaways';
import AdminCollabs from '@/components/admin/AdminCollabs';
import AdminContactMessages from '@/components/admin/AdminContactMessages';
import AdminFacility from '@/components/admin/AdminFacility';
import AdminPlayerUsers from '@/components/admin/AdminPlayerUsers';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminVideos from '@/components/admin/AdminVideos';
import AdminProjects from '@/components/admin/AdminProjects';
import AdminTasks from '@/components/admin/AdminTasks';
import AdminSecurityLogs from '@/components/admin/AdminSecurityLogs';
import AdminGallery from '@/components/admin/AdminGallery';
import AdminRecruitment from '@/components/admin/AdminRecruitment';
import AdminFirebaseSettings from '@/components/admin/AdminFirebaseSettings';
import AdminFeatures from '@/components/admin/AdminFeatures';
import AdminCustomCode from '@/components/admin/AdminCustomCode';
import AdminSystemHealth from '@/components/admin/AdminSystemHealth';
import AdminAchievements from '@/components/admin/AdminAchievements';
import AdminHOFTimeline from '@/components/admin/AdminHOFTimeline';
import AdminAbout from '@/components/admin/AdminAbout';
import AdminLegalPages from '@/components/admin/AdminLegalPages';
import AdminEvents from '@/components/admin/AdminEvents';
import AdminRankings from '@/components/admin/AdminRankings';
import AdminFeedback from '@/components/admin/AdminFeedback';
import AdminQuickAccess from '@/components/admin/AdminQuickAccess';
import AdminHeroCMS from '@/components/admin/AdminHeroCMS';
import AdminCountdown from '@/components/admin/AdminCountdown';
import AdminBackgroundManager from '@/components/admin/AdminBackgroundManager';
import AdminFooterCMS from '@/components/admin/AdminFooterCMS';
import AdminWebsiteManager from '@/components/admin/AdminWebsiteManager';
import AdminPlatforms from '@/components/admin/AdminPlatforms';
import AdminExternalLinks from '@/components/admin/AdminExternalLinks';
import AdminTrophyRoom from '@/components/admin/AdminTrophyRoom';
import AdminTeamRecords from '@/components/admin/AdminTeamRecords';
import AdminTeamHistory from '@/components/admin/AdminTeamHistory';
import AdminLiveStream from '@/components/admin/AdminLiveStream';
import AdminMediaManager from '@/components/admin/AdminMediaManager';
import AdminDesignManager from '@/components/admin/AdminDesignManager';
import { canAccess, SUPER_ADMIN_ONLY } from '@/lib/permissions';

const GOLD = '#d4af37';

type AdminModule =
  | 'dashboard' | 'roster' | 'matches' | 'schedule' | 'sponsors' | 'news'
  | 'games' | 'settings' | 'ads' | 'analytics' | 'navigation'
  | 'creators' | 'founders' | 'shop' | 'staff_manager'
  | 'tournaments' | 'fan_messages' | 'giveaways' | 'collabs' | 'contact_messages'
  | 'facility' | 'player_users' | 'orders' | 'videos'
  | 'projects' | 'tasks' | 'gallery' | 'recruitment' | 'firebase_settings'
  | 'events_admin' | 'rankings_admin' | 'security_logs' | 'enterprise' | 'features'
  | 'system_health' | 'achievements' | 'hof_timeline' | 'custom_code'
  | 'about_cms' | 'legal_pages' | 'feedback' | 'quick_access'
  | 'hero_cms' | 'countdown_mgr' | 'bg_manager' | 'footer_cms'
  | 'website_manager' | 'platforms' | 'external_links' | 'design_manager' | 'media_manager'
  | 'trophy_room' | 'team_records' | 'team_history' | 'live_stream';

const MODULES: { id: AdminModule; label: string; icon: string; group?: string }[] = [
  { id: 'dashboard',         label: 'Dashboard',         icon: '📊' },
  { id: 'analytics',         label: 'Analytics',          icon: '📈' },
  { id: 'settings',          label: 'Site Settings',      icon: '⚙️' },
  { id: 'roster',            label: 'Player Management',  icon: '👥',  group: 'TEAM' },
  { id: 'founders',          label: 'Founders & Mgmt',    icon: '🏆',  group: 'TEAM' },
  { id: 'creators',          label: 'Content Creators',   icon: '🎥',  group: 'TEAM' },
  { id: 'recruitment',       label: 'Recruitment',        icon: '🎯',  group: 'TEAM' },
  { id: 'matches',           label: 'Match Management',   icon: '🎮',  group: 'ESPORTS' },
  { id: 'schedule',          label: 'Schedule',           icon: '📅',  group: 'ESPORTS' },
  { id: 'tournaments',       label: 'Tournaments',        icon: '🏆',  group: 'ESPORTS' },
  { id: 'achievements',      label: 'Achievements',       icon: '🎖️', group: 'ESPORTS' },
  { id: 'hof_timeline',      label: 'Hall of Fame',       icon: '👑',  group: 'ESPORTS' },
  { id: 'events_admin',      label: 'Events',             icon: '🗓️', group: 'ESPORTS' },
  { id: 'rankings_admin',    label: 'Rankings',           icon: '📊',  group: 'ESPORTS' },
  { id: 'trophy_room',       label: 'Trophy Room',        icon: '🥇',  group: 'ESPORTS' },
  { id: 'team_records',      label: 'Team Records',       icon: '📈',  group: 'ESPORTS' },
  { id: 'team_history',      label: 'Team History',       icon: '📅',  group: 'ESPORTS' },
  { id: 'live_stream',       label: 'Live Stream',        icon: '🔴',  group: 'CONTENT' },
  { id: 'hero_cms',          label: 'Hero Section CMS',   icon: '🚀',  group: 'CONTENT' },
  { id: 'countdown_mgr',    label: 'Countdown Manager',  icon: '⏱️', group: 'CONTENT' },
  { id: 'bg_manager',       label: 'Background Manager', icon: '✨',  group: 'CONTENT' },
  { id: 'footer_cms',       label: 'Footer CMS',         icon: '🦶',  group: 'CONTENT' },
  { id: 'news',              label: 'News CMS',           icon: '📰',  group: 'CONTENT' },
  { id: 'about_cms',         label: 'About Page CMS',     icon: '📖',  group: 'CONTENT' },
  { id: 'gallery',           label: 'Gallery Manager',    icon: '🖼️', group: 'CONTENT' },
  { id: 'videos',            label: 'Videos',             icon: '🎬',  group: 'CONTENT' },
  { id: 'games',             label: 'Games',              icon: '🕹️', group: 'CONTENT' },
  { id: 'shop',              label: 'Shop Products',      icon: '🛒',  group: 'CONTENT' },
  { id: 'orders',            label: 'Shop Orders',        icon: '🛍️', group: 'CONTENT' },
  { id: 'sponsors',          label: 'Sponsor Manager',    icon: '🤝',  group: 'CONTENT' },
  { id: 'ads',               label: 'Ads Manager',        icon: '📢',  group: 'CONTENT' },
  { id: 'contact_messages',  label: 'Contact Messages',   icon: '📬',  group: 'COMMUNITY' },
  { id: 'feedback',          label: 'Feedback Reports',   icon: '💬',  group: 'COMMUNITY' },
  { id: 'fan_messages',      label: 'Fan Connect',        icon: '⭐',  group: 'COMMUNITY' },
  { id: 'giveaways',         label: 'Giveaways',          icon: '🎁',  group: 'COMMUNITY' },
  { id: 'collabs',           label: 'Collaborations',     icon: '🤝',  group: 'COMMUNITY' },
  { id: 'player_users',      label: 'Player Accounts',    icon: '👤',  group: 'COMMUNITY' },
  { id: 'facility',          label: 'Facility Section',   icon: '🏢',  group: 'CONTENT' },
  { id: 'projects',          label: 'Projects',           icon: '📋',  group: 'ENTERPRISE' },
  { id: 'tasks',             label: 'Task Board',         icon: '✅',  group: 'ENTERPRISE' },
  { id: 'enterprise',        label: 'Enterprise Hub',     icon: '💼',  group: 'ENTERPRISE' },
  { id: 'features',          label: 'Feature Controls',   icon: '🎛️', group: 'SYSTEM' },
  { id: 'legal_pages',       label: 'Legal Pages',        icon: '⚖️',  group: 'SYSTEM' },
  { id: 'custom_code',       label: 'Custom Code',        icon: '🧩',  group: 'SYSTEM' },
  { id: 'staff_manager',     label: 'Staff Manager',      icon: '👔',  group: 'SYSTEM' },
  { id: 'firebase_settings', label: 'Auth Settings',      icon: '🔒',  group: 'SYSTEM' },
  { id: 'security_logs',     label: 'System Logs',        icon: '🔐',  group: 'SYSTEM' },
  { id: 'navigation',        label: 'Navigation',         icon: '🧭',  group: 'SYSTEM' },
  { id: 'quick_access',      label: 'Quick Access',       icon: '⚡',  group: 'SYSTEM' },
  { id: 'system_health',     label: 'System Health',      icon: '🛡️', group: 'SYSTEM' },
  { id: 'website_manager',   label: 'Website Manager',    icon: '🌐',  group: 'SYSTEM' },
  { id: 'external_links',    label: 'External Website Links', icon: '🌐', group: 'SYSTEM' },
  { id: 'design_manager',    label: 'Theme Manager',      icon: '🎨',  group: 'SYSTEM' },
  { id: 'media_manager',     label: 'Global Media Library', icon: '🖼️', group: 'SYSTEM' },
  { id: 'platforms',         label: 'Platform Links',     icon: '🔗',  group: 'SYSTEM' },
];

export default function AdminPage() {
  const { db, refresh, loading } = useDatabase();
  const [activeModule, setActiveModule] = useState<AdminModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  // Session is injected by AdminGuard into window.__sbgAdminSession after JWT verify
  const adminSession = (window as unknown as Record<string, unknown>).__sbgAdminSession as
    { email: string; name: string; role: string } | null ?? null;
  const adminEmail: string = adminSession?.email ?? '';
  const adminName: string = adminSession?.name ?? 'Admin';

  const [dbStatus, setDbStatus] = useState<{ connected: boolean; engine: string; loading: boolean }>({
    connected: false,
    engine: 'checking...',
    loading: true
  });

  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || "https://sbg-esportsgg.onrender.com") + '/api/health/deep');
        if (!res.ok) throw new Error('Unhealthy');
        const data = await res.json();
        if (active) {
          setDbStatus({
            connected: !!data?.database?.ping?.success,
            engine: data?.database?.engine || 'sqlite',
            loading: false
          });
        }
      } catch (err) {
        if (active) {
          setDbStatus({
            connected: false,
            engine: 'unknown',
            loading: false
          });
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Expose setActiveModule so child components (e.g. AdminWebsiteManager) can deep-link
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__sbgSetModule = setActiveModule;
    return () => { delete (window as unknown as Record<string, unknown>).__sbgSetModule; };
  }, [setActiveModule]);

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [db.settings, loading]);

  const handleLogout = () => {
    // Clear JWT token and call guard logout
    try { fetch((import.meta.env.VITE_API_URL || "https://sbg-esportsgg.onrender.com") + '/api/admin/logout', { credentials: 'include' }).catch(() => {}); } catch {}
    const guardLogout = (window as unknown as Record<string, unknown>).__sbgAdminLogout;
    if (typeof guardLogout === 'function') (guardLogout as () => void)();
    navigate('/sbg-admin');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':       return <AdminDashboard db={db} onRefresh={refresh} />;
      case 'roster':          return <AdminRoster players={db.players} games={db.games} onRefresh={refresh} />;
      case 'matches':         return <AdminMatches matches={db.matches} games={db.games} onRefresh={refresh} />;
      case 'schedule':        return <AdminSchedule schedule={db.schedule ?? []} games={db.games} onRefresh={refresh} />;
      case 'sponsors':        return <AdminSponsors sponsors={db.sponsors} onRefresh={refresh} />;
      case 'news':            return <AdminNews posts={db.posts} onRefresh={refresh} />;
      case 'games':           return <AdminGames games={db.games} onRefresh={refresh} />;
      case 'settings':        return <AdminSettings settings={db.settings} onRefresh={refresh} />;
      case 'ads':             return <AdminAds ads={db.ads} onRefresh={refresh} />;
      case 'analytics':       return <AdminAnalytics analytics={db.analytics} onRefresh={refresh} />;
      case 'navigation':      return <AdminNavigation navigation={db.navigation} onRefresh={refresh} />;
      case 'creators':        return <AdminCreators creators={db.creators ?? []} onRefresh={refresh} />;
      case 'founders':        return <AdminFounders founders={db.founders ?? []} onRefresh={refresh} />;
      case 'shop':            return <AdminShop shop={db.shop ?? []} onRefresh={refresh} />;
      case 'staff_manager':   return <AdminStaffManager onRefresh={refresh} />;
      case 'tournaments':     return <AdminTournaments tournaments={db.tournaments ?? []} onRefresh={refresh} />;
      case 'fan_messages':    return <AdminFanMessages messages={db.fan_messages ?? []} onRefresh={refresh} />;
      case 'giveaways':       return <AdminGiveaways giveaways={db.giveaways ?? []} onRefresh={refresh} />;
      case 'collabs':         return <AdminCollabs requests={db.collab_requests ?? []} onRefresh={refresh} />;
      case 'contact_messages':return <AdminContactMessages messages={db.contact_messages ?? []} onRefresh={refresh} />;
      case 'facility':        return <AdminFacility facility={db.facility ?? []} facilityStats={db.facilityStats ?? []} settings={db.settings} onRefresh={refresh} />;
      case 'player_users':    return <AdminPlayerUsers users={db.playerUsers ?? []} onRefresh={refresh} />;
      case 'orders':          return <AdminOrders orders={db.orders ?? []} onRefresh={refresh} />;
      case 'videos':          return <AdminVideos videos={db.videos ?? []} onRefresh={refresh} />;
      case 'projects':        return <AdminProjects onRefresh={refresh} />;
      case 'tasks':           return <AdminTasks onRefresh={refresh} />;
      case 'achievements':     return <AdminAchievements onRefresh={refresh} />;
      case 'hof_timeline':     return <AdminHOFTimeline onRefresh={refresh} />;
      case 'security_logs':   return <AdminSecurityLogs />;
      case 'about_cms':       return <AdminAbout onRefresh={refresh} />;
      case 'legal_pages':     return <AdminLegalPages onRefresh={refresh} />;
      case 'features':        return <AdminFeatures onRefresh={refresh} />;
      case 'system_health':   return <AdminSystemHealth />;
      case 'gallery':         return <AdminGallery onRefresh={refresh} />;
      case 'media_manager':   return <AdminMediaManager />;
      case 'design_manager':  
        if (adminSession?.role && adminSession.role !== 'super_admin') {
          return (
            <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
              <span className="text-4xl">🚫</span>
              <h3 className="text-lg font-bold text-red-400">Access Restricted</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                The Theme Manager section is strictly accessible only by SUPER_ADMIN accounts.
              </p>
            </div>
          );
        }
        return <AdminDesignManager />;
      case 'recruitment':     return <AdminRecruitment />;
      case 'firebase_settings': return <AdminFirebaseSettings />;
      case 'custom_code':     return <AdminCustomCode adminRole={adminSession?.role} onRefresh={refresh} />;
      case 'events_admin':   return <AdminEvents onRefresh={refresh} />;
      case 'rankings_admin': return <AdminRankings onRefresh={refresh} />;
      case 'trophy_room':    return <AdminTrophyRoom onRefresh={refresh} />;
      case 'team_records':   return <AdminTeamRecords onRefresh={refresh} />;
      case 'team_history':   return <AdminTeamHistory onRefresh={refresh} />;
      case 'live_stream':    return <AdminLiveStream onRefresh={refresh} />;
      case 'feedback':       return <AdminFeedback onRefresh={refresh} />;
      case 'quick_access':   return <AdminQuickAccess navigation={db.navigation} onRefresh={refresh} />;
      case 'hero_cms':       return <AdminHeroCMS onRefresh={refresh} />;
      case 'countdown_mgr':  return <AdminCountdown onRefresh={refresh} />;
      case 'bg_manager':     return <AdminBackgroundManager onRefresh={refresh} />;
      case 'footer_cms':     return <AdminFooterCMS onRefresh={refresh} />;
      case 'website_manager': return <AdminWebsiteManager />;
      case 'external_links':  return <AdminExternalLinks settings={db.settings} onRefresh={refresh} />;
      case 'platforms':      return <AdminPlatforms onRefresh={refresh} />;
      case 'enterprise': return <EnterpriseHub db={db} setActiveModule={setActiveModule} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '2px solid #d4af37', borderTopColor: 'transparent' }} />
          <p className="text-gray-500 text-xs tracking-widest uppercase font-bold">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const role = adminSession?.role || 'super_admin';
  const allowedModules = (adminSession as any)?.allowedModules || [];

  const visibleModules = MODULES.filter(m => {
    if (role === 'super_admin') return true;
    if ((SUPER_ADMIN_ONLY as readonly string[]).includes(m.id)) return false;
    return canAccess(role, allowedModules, m.id);
  });

  const grouped: Record<string, typeof MODULES> = {};
  const ungrouped: typeof MODULES = [];
  visibleModules.forEach(m => {
    if (m.group) { if (!grouped[m.group]) grouped[m.group] = []; grouped[m.group].push(m); }
    else ungrouped.push(m);
  });

  const unreadFan = (db.fan_messages ?? []).filter((m: any) => !m.read).length;
  const unreadCollab = (db.collab_requests ?? []).filter((r: any) => !r.read).length;
  const pendingRegs = (db.registrations ?? []).filter((r: any) => r.status === 'pending').length;
  const pendingOrders = (db.orders ?? []).filter((o: any) => o.status === 'waiting').length;
  const pendingRecruitment = (db.recruitment ?? []).filter((r: any) => r.status === 'pending' || r.status === 'new').length;

  const getBadge = (id: AdminModule) => {
    if (id === 'fan_messages') return unreadFan;
    if (id === 'collabs') return unreadCollab;
    if (id === 'tournaments') return pendingRegs;
    if (id === 'contact_messages') return (db.contact_messages ?? []).filter((m: any) => !m.read).length;
    if (id === 'orders') return pendingOrders;
    if (id === 'recruitment') return pendingRecruitment;
    return 0;
  };

  const NavItem = ({ mod }: { mod: typeof MODULES[0] }) => {
    const badge = getBadge(mod.id);
    const isActive = activeModule === mod.id;
    return (
      <button
        onClick={() => { setActiveModule(mod.id); setSidebarOpen(false); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm font-semibold transition-all duration-150"
        style={isActive ? {
          background: `linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))`,
          borderLeft: `2px solid ${GOLD}`,
          color: '#fff',
          paddingLeft: '10px',
        } : { color: 'rgba(107,114,128,1)' }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(209,213,219,1)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(107,114,128,1)'; }}
      >
        <span className="text-sm w-5 text-center flex-shrink-0">{mod.icon}</span>
        <span className="flex-1 text-xs tracking-wide">{mod.label}</span>
        {badge > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black text-black min-w-[18px] text-center"
            style={{ background: GOLD }}>{badge}</span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0a0a0a] border-r border-gold/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Top line */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent flex-shrink-0" />

        {/* Logo */}
        <div className="px-4 py-5 border-b border-gold/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {db.settings.logo ? (
              <img src={db.settings.logo} alt="" className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-black text-xs flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
                SBG
              </div>
            )}
            <div>
              <div className="font-black text-xs tracking-widest text-white leading-tight">{db.settings.organizationName || 'SBG ESPORTS'}</div>
              <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Admin Panel</div>
            </div>
          </div>
          {adminEmail && (
            <div className="mt-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)', color: GOLD, border: '1px solid rgba(212,175,55,0.3)', letterSpacing: '0.1em' }}>
                  👑 OWNER
                </span>
              </div>
              <p className="text-[10px] text-gray-500 truncate font-mono">{adminEmail}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {ungrouped.map(mod => <NavItem key={mod.id} mod={mod} />)}
          {Object.entries(grouped).map(([group, mods]) => (
            <div key={group} className="pt-4 first:pt-0">
              <p className="text-[9px] font-black tracking-[0.35em] uppercase px-3 mb-1" style={{ color: 'rgba(212,175,55,0.35)' }}>{group}</p>
              {mods.map(mod => <NavItem key={mod.id} mod={mod} />)}
            </div>
          ))}
        </nav>

        {/* System Status Indicator */}
        <div className="px-5 py-3 border-t border-gold/10 bg-white/[0.01] flex-shrink-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">SYSTEM STATUS</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dbStatus.loading ? 'bg-yellow-500 animate-pulse' : dbStatus.connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
              <span className="text-[10px] font-bold text-gray-400 capitalize">{dbStatus.loading ? 'checking...' : dbStatus.connected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] text-gray-600 font-mono">
            <span>DB ENGINE:</span>
            <span className="uppercase font-bold tracking-wider" style={{ color: dbStatus.connected ? GOLD : 'inherit' }}>
              {dbStatus.engine}
            </span>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
          <a href="/" target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gold hover:bg-gold/3 transition-all">
            <span>🌐</span> View Website
          </a>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <span>🔒</span> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl border-b px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{ background: 'rgba(8,8,8,0.9)', borderColor: 'rgba(212,175,55,0.08)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white text-lg transition-colors">☰</button>
            <div>
              <h1 className="font-black text-sm tracking-widest text-white">
                {MODULES.find(m => m.id === activeModule)?.icon}{' '}
                {MODULES.find(m => m.id === activeModule)?.label?.toUpperCase()}
              </h1>
              {db.settings.maintenanceMode && (
                <span className="text-[10px] font-black animate-pulse" style={{ color: '#f87171' }}>⚠ MAINTENANCE MODE ACTIVE</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">Live</span>
            </div>
            <button onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-400/60 border hover:text-red-400 hover:bg-red-500/5 transition-all"
              style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
              🔒 LOGOUT
            </button>
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}>
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function PlaceholderModule({ icon, title, desc, link }: { icon: string; title: string; desc: string; link?: { href: string; label: string } }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-10 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="font-black text-white text-xl mb-3 tracking-widest">{title}</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">{desc}</p>
      {link && (
        <a href={link.href} target="_blank"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-black"
          style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
          {link.label}
        </a>
      )}
    </div>
  );
}

function EnterpriseHub({ db, setActiveModule }: { db: any; setActiveModule: (m: AdminModule) => void }) {
  const stats = [
    { label: 'Platform Uptime', value: '99.9%', color: '#10b981' },
    { label: 'Active Staff', value: (db.staffAccounts ?? []).filter((s: any) => s.active).length, color: GOLD },
    { label: 'Player Accounts', value: (db.playerUsers ?? []).length, color: '#60a5fa' },
    { label: 'Total Tournaments', value: (db.tournaments ?? []).length, color: GOLD },
  ];
  const modules: { icon: string; title: string; desc: string; target: AdminModule }[] = [
    { icon: '📋', title: 'Projects', desc: 'Manage ongoing projects', target: 'projects' },
    { icon: '✅', title: 'Task Board', desc: 'Track tasks and assignments', target: 'tasks' },
    { icon: '🔐', title: 'System Logs', desc: 'Monitor login and audit events', target: 'security_logs' },
    { icon: '🔥', title: 'Firebase Settings', desc: 'Auth config and session management', target: 'firebase_settings' },
    { icon: '👔', title: 'User Roles', desc: 'Manage staff and permissions', target: 'staff_manager' },
    { icon: '📈', title: 'Analytics', desc: 'Platform usage insights', target: 'analytics' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {modules.map(m => (
          <button key={m.title} onClick={() => setActiveModule(m.target)}
            className="bg-white/3 border border-white/8 rounded-2xl p-5 text-left hover:border-gold/25 hover:bg-gold/3 transition-all group">
            <div className="text-2xl mb-3">{m.icon}</div>
            <div className="font-black text-white text-xs mb-1 tracking-wide">{m.title}</div>
            <div className="text-[11px] text-gray-500">{m.desc}</div>
          </button>
        ))}
      </div>
      <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05), transparent)', border: '1px solid rgba(212,175,55,0.12)' }}>
        <h3 className="font-black text-white text-sm mb-4 tracking-widest">ENTERPRISE OVERVIEW</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
