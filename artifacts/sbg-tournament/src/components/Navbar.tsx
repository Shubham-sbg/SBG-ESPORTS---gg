import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Trophy, Swords, BarChart3, Home } from 'lucide-react';

const RED = '#e8192c';
const GOLD = '#d4af37';

const NAV = [
  { href: '/',            label: 'Home',        icon: Home },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(3,3,3,0.97)' : 'rgba(3,3,3,0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(232,25,44,0.2)' : 'rgba(255,255,255,0.04)'}`,
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${RED}, ${GOLD}, ${RED}, transparent)` }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${RED}, #b00020)`, boxShadow: `0 0 16px ${RED}40` }}>
              <Swords size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-[11px] tracking-[0.35em] text-white leading-none">SBG ENTREPRENEUR</div>
              <div className="font-bold text-[8px] tracking-[0.5em] leading-none mt-0.5" style={{ color: GOLD }}>TOURNAMENT ZONE</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href !== '/' && location.startsWith(href));
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
                  style={{ color: active ? RED : 'rgba(200,200,200,0.7)', background: active ? `${RED}15` : 'transparent' }}>
                  <Icon size={13} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* CTA + mobile menu */}
          <div className="flex items-center gap-3">
            <Link href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
              style={{ border: `1px solid ${GOLD}40`, color: GOLD }}>
              Admin
            </Link>
            <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-black/95">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-6 py-4 text-sm font-bold tracking-widest uppercase border-b border-white/5 transition-colors"
              style={{ color: location === href ? RED : 'rgba(200,200,200,0.8)' }}>
              <Icon size={16} /> {label}
            </Link>
          ))}
          <Link href="/admin" className="flex items-center gap-3 px-6 py-4 text-sm font-bold tracking-widest uppercase"
            style={{ color: GOLD }}>
            ⚙ Admin Panel
          </Link>
        </div>
      )}
    </nav>
  );
}
