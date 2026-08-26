import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { Settings, Navigation } from '@/lib/database';
import { Link } from 'wouter';
import { getDB, isFeatureActive } from '@/lib/database';
import { sanitizeUrl } from '@/lib/sanitizeUrl';

interface Props {
  settings: Settings;
  navigation: Navigation;
}

export default function Footer({ settings, navigation }: Props) {
  const visibleItems = (navigation?.items || []).filter(i => i.visible);

  const socials = [
    { label: 'Discord', url: settings?.socialDiscord, icon: '💬' },
    { label: 'YouTube', url: settings?.socialYoutube, icon: '▶' },
    { label: 'Instagram', url: settings?.socialInstagram, icon: '📸' },
    { label: 'Twitter/X', url: settings?.socialTwitter, icon: '𝕏' },
    { label: 'WhatsApp', url: settings?.socialWhatsApp, icon: '📱' },
    { label: 'Facebook', url: settings?.socialFacebook, icon: '🌐' },
  ].filter(s => s.url && String(s.url).trim() !== '');

  const QUICK_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'Roster', href: '/#roster' },
    { label: 'Matches', href: '/#matches' },
    { label: 'Tournaments', href: '/tournaments' },
    { label: 'Shop', href: '/shop' },
    { label: 'Blog', href: '/blog' },
    { label: 'Live Streams', href: '/live' },
    { label: 'Hall of Fame', href: '/hall-of-fame' },
  ];

  const DEFAULT_EXPLORE = [
    { id: 'exp1', label: 'Join the Team', href: '/join' },
    { id: 'exp2', label: 'Community', href: '/community' },
    { id: 'exp3', label: 'Giveaways', href: '/giveaways' },
    { id: 'exp4', label: 'Fan Connect', href: '/fan-connect' },
    { id: 'exp5', label: 'Player Portal', href: '/player-login' },
    { id: 'exp6', label: 'Contact Us', href: '/contact' },
  ];
  const db = getDB() as any;
  const pages = db?.features?.pages || {};
  const sections = db?.features?.sections || {};

  const isLinkActive = (href: string) => {
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
      if (sections[secKey] !== undefined) {
        return isFeatureActive(sections[secKey]);
      }
    }

    if (pages[clean] !== undefined) {
      return isFeatureActive(pages[clean]);
    }
    return true;
  };

  const rawNavLinks = visibleItems.length > 0
    ? visibleItems.map(i => ({ label: i.label, href: i.href.startsWith('#') ? `/${i.href}` : i.href }))
    : QUICK_LINKS;
  const navLinks = rawNavLinks.filter(i => isLinkActive(i.href));

  // Admin-managed explore links take precedence over defaults
  const rawExplore = (settings?.footerExploreLinks?.length)
    ? settings.footerExploreLinks
    : DEFAULT_EXPLORE;
  const exploreLinks = rawExplore.filter(i => isLinkActive(i.href));

  return (
    <footer className="border-t border-white/[0.06] bg-[#060606] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Gold top accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image src={settings?.logo || '/transparent_eagle_logo.png'} alt={settings?.organizationName || 'SBG ESPORTS'}
                objectFit="contain"
                className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]" />
              <div>
                <span className="block font-black text-sm tracking-[0.25em] text-white uppercase">
                  {settings?.organizationName || 'SBG ESPORTS'}
                </span>
                <span className="block text-[9px] text-gold/40 tracking-[0.4em] uppercase font-bold">{settings?.navBadgeText || 'Official Platform'}</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              {settings?.footerDescription || settings?.tagline || 'Born to Win. Built to Dominate.'}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={sanitizeUrl(String(s.url))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 border border-gold/15 rounded-lg flex items-center justify-center text-sm text-gray-500 hover:border-gold/40 hover:text-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/30"
                    title={s.label}
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-black text-white tracking-widest uppercase text-[10px] mb-5 flex items-center gap-2">
              <span className="h-px w-4 bg-gold/50" /> {settings?.footerQuickLinksTitle || 'Quick Links'}
            </h3>
            <ul className="space-y-2.5">
              {navLinks.slice(0, 8).map(item => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-600 hover:text-gold transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-gold/30 rounded-full group-hover:bg-gold transition-colors flex-shrink-0" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-black text-white tracking-widest uppercase text-[10px] mb-5 flex items-center gap-2">
              <span className="h-px w-4 bg-gold/50" /> {settings?.footerExploreTitle || 'Explore'}
            </h3>
            <ul className="space-y-2.5">
              {exploreLinks.map(item => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-600 hover:text-gold transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-gold/30 rounded-full group-hover:bg-gold transition-colors flex-shrink-0" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h3 className="font-black text-white tracking-widest uppercase text-[10px] mb-5 flex items-center gap-2">
              <span className="h-px w-4 bg-gold/50" /> Legal
            </h3>
            <ul className="space-y-2.5 mb-6">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Cookie Policy', href: '/privacy#cookies' },
              ].map(item => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-gold transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-gold/30 rounded-full group-hover:bg-gold transition-colors flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="bg-white/[0.025] border border-gold/10 rounded-xl p-4">
              <p className="text-[10px] text-gray-700 mb-1 uppercase tracking-widest font-bold">{settings?.footerSupportTitle || 'Official Support'}</p>
              <a href="/contact" className="text-xs text-gold font-bold hover:text-gold/80 transition-colors">
                Contact Us →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-gray-700 tracking-wide">
            © {new Date().getFullYear()}{' '}
            <span className="text-gray-500 font-bold">{settings?.organizationName || 'SBG ESPORTS'}</span>.{' '}
            {(settings as any)?.footerCopyright || 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-gray-700">{settings?.footerText || 'Built for competitive excellence'}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500/80 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-600/80 font-bold tracking-widest uppercase">All Systems Live</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
