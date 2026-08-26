import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useRef, useEffect, useState } from 'react';
import { Sponsor } from '@/lib/database';
import { sanitizeUrl } from '@/lib/sanitizeUrl';

interface Props {
  sponsors: Sponsor[];
}

const CATEGORY_CONFIG = {
  main: {
    label: 'Main Sponsor',
    borderClass: 'border-gold/40',
    glowColor: 'rgba(212,175,55,0.15)',
    badgeBg: 'bg-gold/10 border-gold/30 text-gold',
    imageSize: 'h-24',
    cardPadding: 'p-10',
    titleClass: 'text-xl',
  },
  gold: {
    label: 'Gold Sponsor',
    borderClass: 'border-yellow-600/30',
    glowColor: 'rgba(202,138,4,0.12)',
    badgeBg: 'bg-yellow-600/10 border-yellow-600/30 text-yellow-500',
    imageSize: 'h-16',
    cardPadding: 'p-7',
    titleClass: 'text-lg',
  },
  silver: {
    label: 'Silver Sponsor',
    borderClass: 'border-gray-400/20',
    glowColor: 'rgba(156,163,175,0.08)',
    badgeBg: 'bg-gray-400/10 border-gray-400/20 text-gray-400',
    imageSize: 'h-12',
    cardPadding: 'p-6',
    titleClass: 'text-base',
  },
  community: {
    label: 'Community Partner',
    borderClass: 'border-blue-500/20',
    glowColor: 'rgba(59,130,246,0.08)',
    badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    imageSize: 'h-10',
    cardPadding: 'p-5',
    titleClass: 'text-sm',
  },
};

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const category = sponsor.category || 'silver';
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.silver;

  return (
    <a
      href={sanitizeUrl(sponsor.link)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${sponsor.name} — ${config.label}. Opens in new tab.`}
      className={`group relative block rounded-2xl border ${config.borderClass} bg-white/[0.025] hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gold/40`}
      style={{ '--glow': config.glowColor } as React.CSSProperties}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 30px ${config.glowColor}` }}
        aria-hidden="true"
      />

      <div className={`relative flex flex-col items-center justify-center ${config.cardPadding} min-h-[130px]`}>
        {/* Category badge */}
        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase border ${config.badgeBg}`}>
          {config.label}
        </span>

        {/* Logo */}
        {sponsor.logo ? (
          <Image
            src={sponsor.logo}
            alt={sponsor.name}
            loading="lazy"
            objectFit="contain"
            className={`${config.imageSize} w-auto max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105`}
            style={{
              maxHeight: sponsor.height ? `${sponsor.height}px` : undefined,
              maxWidth: sponsor.width ? `${sponsor.width}px` : '160px',
            }}
          />
        ) : (
          <span className={`font-black text-gray-400 group-hover:text-white transition-colors tracking-widest text-center ${config.titleClass}`}>
            {sponsor.name}
          </span>
        )}

        {/* Description */}
        {sponsor.description && (
          <p className="text-[10px] text-gray-600 mt-2 text-center group-hover:text-gray-500 transition-colors">
            {sponsor.description}
          </p>
        )}

        {/* Visit link hint */}
        <div className="absolute bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span className="text-[10px] text-gray-400 font-bold">Visit →</span>
        </div>
      </div>
    </a>
  );
}

export default function SponsorsSection({ sponsors }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const visible = sponsors.filter(s => s.visible).sort((a, b) => a.order - b.order);
  if (visible.length === 0) return null;

  // Group by category
  const mainSponsors = visible.filter(s => s.category === 'main');
  const goldSponsors = visible.filter(s => s.category === 'gold');
  const silverSponsors = visible.filter(s => s.category === 'silver');
  const communitySponsors = visible.filter(s => s.category === 'community');
  const uncategorized = visible.filter(s => !s.category);

  // If no categories used, fall back to flat grid
  const hasCategoryGroups = mainSponsors.length || goldSponsors.length || silverSponsors.length || communitySponsors.length;

  return (
    <section
      id="sponsors"
      ref={sectionRef}
      aria-labelledby="sponsors-heading"
      className={`py-24 bg-gradient-to-b from-transparent via-black/50 to-transparent transition-all duration-1000 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <header className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] text-gold/70 uppercase">Our Partners</span>
          <h2 id="sponsors-heading" className="text-4xl md:text-5xl font-black tracking-widest mt-2 text-white">
            SPONSORS
          </h2>
          <div className="w-24 h-1 mx-auto mt-4" style={{
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)'
          }} />
          <p className="text-gray-500 text-sm mt-4">Proudly supported by industry leaders</p>
        </header>

        {hasCategoryGroups ? (
          <div className="space-y-12">
            {/* Main sponsors */}
            {mainSponsors.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/30" aria-hidden="true" />
                  <span className="text-[10px] font-black tracking-[0.4em] text-gold/60 uppercase">Main Sponsor</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/30" aria-hidden="true" />
                </div>
                <div className={`grid gap-6 ${
                  mainSponsors.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2'
                }`}>
                  {mainSponsors.map(s => <SponsorCard key={s.id} sponsor={s} />)}
                </div>
              </div>
            )}

            {/* Gold sponsors */}
            {goldSponsors.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-600/20" aria-hidden="true" />
                  <span className="text-[10px] font-black tracking-[0.4em] text-yellow-600/60 uppercase">Gold Sponsors</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-600/20" aria-hidden="true" />
                </div>
                <div className={`grid gap-5 ${
                  goldSponsors.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                }`}>
                  {goldSponsors.map(s => <SponsorCard key={s.id} sponsor={s} />)}
                </div>
              </div>
            )}

            {/* Silver sponsors */}
            {silverSponsors.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-400/15" aria-hidden="true" />
                  <span className="text-[10px] font-black tracking-[0.4em] text-gray-500/60 uppercase">Silver Sponsors</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-400/15" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {silverSponsors.map(s => <SponsorCard key={s.id} sponsor={s} />)}
                </div>
              </div>
            )}

            {/* Community partners */}
            {communitySponsors.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/15" aria-hidden="true" />
                  <span className="text-[10px] font-black tracking-[0.4em] text-blue-500/50 uppercase">Community Partners</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/15" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {communitySponsors.map(s => <SponsorCard key={s.id} sponsor={s} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Flat grid (no categories assigned)
          <div className={`grid gap-6 ${
            uncategorized.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
            uncategorized.length === 2 ? 'grid-cols-2 max-w-md mx-auto' :
            uncategorized.length <= 4 ? 'grid-cols-2 md:grid-cols-4' :
            'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {uncategorized.map(s => <SponsorCard key={s.id} sponsor={s} />)}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="text-xs text-gray-600 tracking-widest uppercase">Interested in sponsoring SBG ESPORTS?</p>
          <a
            href="/collaborate"
            className="mt-3 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gold/20 text-xs text-gold hover:text-white hover:border-gold/50 hover:bg-gold/5 font-black tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/40"
            aria-label="Contact us for partnership and sponsorship opportunities"
          >
            Contact us for partnership opportunities →
          </a>
        </div>
      </div>
    </section>
  );
}
