import { Link } from 'wouter';
import { Swords } from 'lucide-react';

const GOLD = '#d4af37';
const RED  = '#e8192c';

export default function Footer() {
  return (
    <footer className="border-t mt-24" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#050505' }}>
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${RED}40, ${GOLD}40, ${RED}40, transparent)` }} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${RED}, #b00020)` }}>
              <Swords size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm tracking-[0.3em]">SBG ENTREPRENEUR</p>
              <p className="text-[9px] tracking-[0.4em] font-bold" style={{ color: GOLD }}>TOURNAMENT MANAGEMENT PLATFORM</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
            {[
              { href: '/',            label: 'Home' },
              { href: '/tournaments', label: 'Tournaments' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/admin',       label: 'Admin' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-gray-700">
          <p>© {new Date().getFullYear()} SBG ARMY Entrepreneur. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 font-bold uppercase tracking-widest">Platform Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
