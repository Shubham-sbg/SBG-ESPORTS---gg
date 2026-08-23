import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Navigation } from '@/lib/database';
import { getPlayerSession, logoutPlayer } from '@/lib/playerAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { getDB, isFeatureActive } from '@/lib/database';

interface Props {
  settings: Settings;
  navigation: Navigation;
}

const PRIMARY_NAV = [
  { label: 'HOME', href: '/' },
  { label: 'ABOUT', href: '/about' },
  { label: 'TOURNAMENTS', href: '/tournaments' },
  { label: 'LEADERBOARDS', href: '/leaderboards' },
  { label: 'GALLERY', href: '/gallery' },
  { label: 'SCHEDULE', href: '/schedule' },
  { label: 'STATS', href: '/stats' },
  { label: 'RECORDS', href: '/records' },
];

const SHORTCUT_NAV: Array<{ id: string; label: string; href: string; icon: string; visible?: boolean }> = [
  { id: 's1', label: 'Home', href: '/', icon: '🏠' },
  { id: 's2', label: 'About', href: '/about', icon: '⚡' },
  { id: 's3', label: 'Gallery', href: '/gallery', icon: '📸' },
  { id: 's4', label: 'Tournaments', href: '/tournaments', icon: '🏆' },
  { id: 's5', label: 'Schedule', href: '/schedule', icon: '📅' },
  { id: 's6', label: 'Leaderboards', href: '/leaderboards', icon: '📈' },
  { id: 's7', label: 'Stats', href: '/stats', icon: '📊' },
  { id: 's8', label: 'Records', href: '/records', icon: '🏅' },
  { id: 's9', label: 'Trophy Room', href: '/trophy-room', icon: '🏆' },
  { id: 's10', label: 'Team History', href: '/team-history', icon: '📜' },
  { id: 's11', label: 'Hall of Fame', href: '/hof-timeline', icon: '⭐' },
  { id: 's12', label: 'Feedback', href: '/feedback', icon: '💬' },
];

const GOLD = '#d4af37';

export default function Navbar({ settings, navigation }: Props) {
  const { loading } = useDatabase();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [activeHref, setActiveHref] = useState('/');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveHref(window.location.pathname);
    let isScrolled = window.scrollY > 60;
    setScrolled(isScrolled);
    const handler = () => {
      const next = window.scrollY > 60;
      if (next !== isScrolled) {
        isScrolled = next;
        setScrolled(next);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (loading) return;
    try {
      const session = getPlayerSession();
      setPlayerName(session ? (session.name || session.username) : null);
    } catch { setPlayerName(null); }
  }, [loading]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logoutPlayer();
    setPlayerName(null);
    setProfileOpen(false);
    window.location.href = '/';
  };

  
  const db = getDB() as any;
  const pages = db?.features?.pages || {};
  
  const isNavItemActive = (href: string) => {
    let clean = href.replace('/', '').split('#')[0];
    if (clean === '') return true;
    
    if (clean === 'join-team') clean = 'join';
    if (clean === 'player-login' || clean === 'player-register' || clean === 'player-dashboard' || clean === 'player') clean = 'playerPortal';
    if (clean === 'hall-of-fame') clean = 'hallOfFame';
    if (clean === 'trophy-room') clean = 'trophyRoom';
    if (clean === 'team-history') clean = 'teamHistory';
    if (clean === 'hof-timeline') clean = 'hofTimeline';
    if (clean === 'fan-connect') clean = 'fanConnect';
    if (clean === 'dashboard') clean = 'dashboard';
    if (clean === 'tournaments') clean = 'tournaments';
    if (clean === 'leaderboards') clean = 'leaderboards';

    if (href.includes('#')) {
      const secKey = href.split('#')[1];
      if (db?.features?.sections?.[secKey] !== undefined) {
        return isFeatureActive(db.features.sections[secKey]);
      }
    }

    if (pages[clean] !== undefined) {
      return isFeatureActive(pages[clean]);
    }
    return true;
  };

  const visibleItems = (navigation?.items || []).filter(i => i.visible && isNavItemActive(i.href));
  const navItems = visibleItems.length > 0
    ? visibleItems.map(i => ({ label: i.label, href: i.href.startsWith('#') ? `/${i.href}` : i.href }))
    : PRIMARY_NAV.filter(i => isNavItemActive(i.href));


  const closeMenu = () => setMenuOpen(false);

  const rawExternalLinks = Array.isArray(settings?.externalLinks) ? settings.externalLinks : [];
  const enabledLinks = rawExternalLinks
    .filter(l => l && l.enabled !== false && l.name && l.url)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const showMarquee = settings?.externalLinksVisible !== false && enabledLinks.length > 0;
  const marqueeItems = enabledLinks.length > 0 ? [...enabledLinks, ...enabledLinks, ...enabledLinks] : [];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#080808]/95 backdrop-blur-xl border-b border-gold/15 shadow-[0_4px_40px_rgba(0,0,0,0.8)]'
            : 'bg-transparent'
        }`}
      >
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        {/* External Website Links Marquee Strip */}
        {showMarquee && (
          <div className="bg-[#050505]/95 border-b border-white/8 text-[11px] font-semibold text-gray-300 py-1 px-3 overflow-hidden select-none relative z-10 flex items-center h-6">
            <style>{`
              @keyframes extMarquee {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-33.33333%, 0, 0); }
              }
              .ext-marquee-track {
                display: flex;
                align-items: center;
                width: max-content;
                will-change: transform;
                animation: extMarquee ${Math.max(14, enabledLinks.length * 7)}s linear infinite;
              }
              .ext-marquee-track:hover,
              .ext-marquee-track:focus-within {
                animation-play-state: paused !important;
              }
              @media (prefers-reduced-motion: reduce) {
                .ext-marquee-track {
                  animation: none !important;
                  overflow-x: auto;
                  width: 100%;
                }
              }
            `}</style>
            <div className="w-full overflow-hidden flex items-center relative">
              <div className="ext-marquee-track">
                {marqueeItems.map((link, idx) => (
                  <div key={`${link.id}-${idx}`} className="inline-flex items-center flex-shrink-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 text-gray-300 hover:text-gold transition-colors font-bold tracking-wide hover:underline focus:outline-none focus:text-gold text-[10px]"
                    >
                      {link.name}
                    </a>
                    <span className="text-gold/40 mx-1.5 text-[8px] select-none">•</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px]">

            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group flex-shrink-0">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.organizationName}
                  width="40" height="40" decoding="async"
                  className="h-10 w-auto group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.6)] transition-all duration-300" />
              ) : (
                <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)', boxShadow: '0 0 15px rgba(212,175,55,0.3)' }}>
                  SBG
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-black text-sm tracking-[0.25em] text-white leading-none group-hover:text-gold transition-colors duration-300"
                  style={{ textShadow: scrolled ? 'none' : '0 0 20px rgba(212,175,55,0.3)' }}>
                  {settings.organizationName || 'SBG ESPORTS'}
                </div>
                <div className="text-[9px] text-gold/50 tracking-[0.4em] uppercase font-bold">{(settings.navBadgeText || 'OFFICIAL PLATFORM').toUpperCase()}</div>
              </div>
            </a>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.slice(0, 7).map(item => {
                const isActive = activeHref === item.href;
                return (
                  <a key={item.label} href={item.href}
                    className="relative px-3.5 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all duration-200 rounded group"
                    style={{ color: isActive ? GOLD : 'rgba(156,163,175,1)' }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(156,163,175,1)'; }}
                  >
                    {item.label}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300 rounded-full ${isActive ? 'w-4/5' : 'w-0 group-hover:w-3/5'}`}
                      style={{ background: GOLD }} />
                  </a>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {isNavItemActive('/dashboard') && (
                <a href="/dashboard"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black tracking-widest uppercase rounded border transition-all duration-200 hover:scale-105"
                  style={{ borderColor: 'rgba(212,175,55,0.3)', color: GOLD }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.6)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = '';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)';
                  }}
                >
                  📊 DASHBOARD
                </a>
              )}

              {playerName ? (
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-2 px-3.5 py-2 text-[10px] font-black tracking-widest uppercase rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/25 transition-all duration-200">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}>
                      {playerName.charAt(0).toUpperCase()}
                    </span>
                    {playerName.split(' ')[0]}
                    <span className="text-xs opacity-40">▾</span>
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#0d0d0d] border border-gold/15 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        {[
                          { href: '/dashboard', label: '📊 My Dashboard' },
                          { href: '/player-dashboard', label: '👤 Full Profile' },
                          { href: '/player-dashboard#orders', label: '🛍️ My Orders' },
                        ].map(link => (
                          <a key={link.href} href={link.href} onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-gray-400 hover:text-gold hover:bg-gold/5 transition-colors">
                            {link.label}
                          </a>
                        ))}
                        <div className="border-t border-white/5" />
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left">
                          🔒 Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                isNavItemActive('/player-login') && (
                  <a href="/player-login"
                    className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black tracking-widest uppercase rounded text-black transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}>
                    PLAYER LOGIN
                  </a>
                )
              )}
            </div>

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="lg:hidden flex flex-col gap-1.5 p-2 rounded hover:bg-gold/5 transition-colors">
              {[0, 1, 2].map(i => (
                <motion.span key={i}
                  animate={{
                    rotate: menuOpen ? (i === 0 ? 45 : i === 2 ? -45 : 0) : 0,
                    y: menuOpen ? (i === 0 ? 8 : i === 2 ? -8 : 0) : 0,
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                  className="block w-5 h-0.5 rounded-full"
                  style={{ background: GOLD }}
                />
              ))}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 lg:hidden bg-[#090909] border-l border-gold/10 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gold/10">
                <div>
                  <div className="font-black text-sm tracking-widest text-white">{settings.organizationName || 'SBG ESPORTS'}</div>
                  <div className="text-[9px] text-gold/50 tracking-widest uppercase">Official Platform</div>
                </div>
                <button onClick={closeMenu} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors text-sm">
                  ✕
                </button>
              </div>

              <div className="px-4 py-6 space-y-6">
                {/* Nav */}
                <div>
                  <p className="text-[9px] font-black text-gold/40 tracking-[0.4em] uppercase mb-3 px-2">Navigation</p>
                  {navItems.map((item, i) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      onClick={closeMenu}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center justify-between py-3 px-3 rounded-lg text-sm font-black tracking-widest uppercase border-b border-white/5 transition-colors ${activeHref === item.href ? 'text-gold' : 'text-gray-400 hover:text-white'}`}
                    >
                      {item.label}
                      {activeHref === item.href && <span className="text-gold text-xs">●</span>}
                    </motion.a>
                  ))}
                </div>

                {/* Quick access */}
                <div>
                  <p className="text-[9px] font-black text-gold/40 tracking-[0.4em] uppercase mb-3 px-2">Quick Access</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(navigation?.shortcuts?.length ? navigation.shortcuts : SHORTCUT_NAV)
                      .filter(item => item.visible !== false)
                      .map(item => (
                        <a key={item.id} href={item.href} onClick={closeMenu}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/5 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-gold hover:border-gold/20 hover:bg-gold/3 transition-all">
                          {item.icon && <span>{item.icon}</span>} {item.label}
                        </a>
                    ))}
                  </div>
                </div>

                {/* Account */}
                <div className="border-t border-gold/10 pt-4">
                  {playerName ? (
                    <div className="space-y-2">
                      {isNavItemActive('/dashboard') && (
                        <a href="/dashboard" onClick={closeMenu}
                          className="flex items-center gap-2 px-3 py-3 rounded-lg border border-gold/20 text-sm font-bold text-gold hover:bg-gold/5 transition-all">
                          📊 Dashboard
                        </a>
                      )}
                      <button onClick={() => { handleLogout(); closeMenu(); }}
                        className="w-full flex items-center gap-2 px-3 py-3 rounded-lg border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all">
                        🔒 Logout
                      </button>
                    </div>
                  ) : (
                    isNavItemActive('/player-login') && (
                      <a href="/player-login" onClick={closeMenu}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-lg font-black text-sm uppercase tracking-widest text-black"
                        style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}>
                        PLAYER LOGIN / REGISTER
                      </a>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
