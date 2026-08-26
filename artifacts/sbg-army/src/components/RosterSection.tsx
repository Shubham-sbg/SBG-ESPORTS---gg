import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Player } from '@/lib/database';
import { sanitizeUrl } from '@/lib/sanitizeUrl';
import { BadgeCheck, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';

interface Props {
  players: Player[];
}

const GAME_COLORS: Record<string, string> = {
  'BGMI': '#ff6b00',
  'FREE FIRE': '#ff0055',
  'VALORANT': '#ff4655',
  'COD MOBILE': '#00d4ff',
};

const ROLE_ICONS: Record<string, string> = {
  'IGL': '👑',
  'Entry': '⚡',
  'Fragger': '🔥',
  'Support': '🛡️',
  'Sniper': '🎯',
  'Duelist': '⚔️',
  'Controller': '🧠',
  'Sentinel': '🔒',
  'Initiator': '💡',
  'Lurker': '👁️',
};

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard?.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

function SocialIcon({ href, icon, label }: { href: string; icon: string; label: string }) {
  const safeHref = sanitizeUrl(href);
  if (!href || safeHref === '#') return null;
  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold/40"
      title={label}
    >
      <span className="text-xs">{icon}</span>
    </a>
  );
}

function PlayerCard({ player, isActive, onClick }: { player: Player; isActive: boolean; onClick: () => void }) {
  const color = GAME_COLORS[player.game] || '#ff6b00';
  const [copied, setCopied] = useState(false);
  const roleIcon = ROLE_ICONS[player.role] || '🎮';

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${player.ign} – ${player.role} for ${player.game}`}
      onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? onClick() : undefined}
      className={`relative group cursor-pointer rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/40 ${
        isActive
          ? 'border-gold/50 shadow-[0_0_30px_rgba(212,175,55,0.2)] scale-[1.02]'
          : 'border-white/8 hover:border-white/20 hover:scale-[1.01]'
      } bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden`}
    >
      {/* Top game-color accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      {/* Active glow */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ boxShadow: `inset 0 0 40px ${color}15` }} />
      )}

      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
          player.status === 'active'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : player.status === 'substitute'
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          {player.status || 'active'}
        </span>
      </div>

      {/* Photo / Initials */}
      <div className="relative mx-auto mt-6 w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
        style={{ boxShadow: `0 0 20px ${color}44` }}>
        {player.image ? (
          <Image
            src={player.image}
            alt={`${player.ign} — ${player.role} player`}
            loading="lazy"
            decoding="async"
            width={80}
            height={80}
            objectFit="cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-black text-2xl"
            style={{ background: `linear-gradient(135deg, ${color}44, ${color}11)`, color }}
            aria-hidden="true"
          >
            {player.ign.charAt(0)}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-5">
        {/* Game tag */}
        <div className="text-[9px] font-black tracking-[0.35em] uppercase mb-1" style={{ color }}>
          {player.game}
        </div>

        {/* IGN */}
        <h3 className="text-xl font-black tracking-widest text-white leading-none mb-1 truncate flex items-center gap-1.5">
          {player.ign}
          <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
        </h3>

        {/* Real name */}
        <p className="text-xs text-gray-500 mb-3 truncate">{player.name}</p>

        {/* Role + Country row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest border"
            style={{ borderColor: `${color}60`, color, background: `${color}15` }}
          >
            <span aria-hidden="true">{roleIcon}</span> {player.role}
          </span>
          {player.country && (
            <span className="text-[10px] text-gray-500 font-bold tracking-wider">
              📍 {player.country}
            </span>
          )}
        </div>

        {/* Stats row */}
        {(player.kdRatio || player.mvpCount !== undefined) && (
          <div className="flex gap-4 mb-3 py-2 border-y border-white/5">
            {player.kdRatio && (
              <div className="text-center relative group/kd">
                <div className="text-sm font-black text-white tabular-nums">{player.kdRatio}</div>
                <div className="text-[9px] text-gray-600 tracking-widest uppercase">K/D</div>
                {player.kdRatioImage && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 bg-black/90 border border-white/10 rounded-lg shadow-xl opacity-0 group-hover/kd:opacity-100 transition-opacity pointer-events-none z-50">
                    <Image src={player.kdRatioImage} alt="K/D Proof" objectFit="contain" className="w-24 h-auto rounded border border-white/20" />
                  </div>
                )}
              </div>
            )}
            {player.mvpCount !== undefined && player.mvpCount > 0 && (
              <div className="text-center">
                <div className="text-sm font-black" style={{ color }}>
                  {player.mvpCount}×
                </div>
                <div className="text-[9px] text-gray-600 tracking-widest uppercase">MVP</div>
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        {player.achievements && player.achievements.length > 0 && (
          <div className="mb-3">
            {player.achievements.slice(0, 2).map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
                <span className="text-yellow-500/80" aria-hidden="true">🏆</span> {a}
              </div>
            ))}
          </div>
        )}

        {/* Social links + Copy UID row */}
        <div className="flex items-center justify-between mt-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5" aria-label="Social media links">
            <SocialIcon href={player.socialInstagram || ''} icon="📸" label="Instagram" />
            <SocialIcon href={player.socialYoutube || ''} icon="▶" label="YouTube" />
            <SocialIcon href={player.socialFacebook || ''} icon="🌐" label="Facebook" />
            <SocialIcon href={player.socialDiscord || ''} icon="💬" label="Discord" />
          </div>

          {player.uid && (
            <button
              onClick={() => copyToClipboard(player.uid!, setCopied)}
              title="Copy Player UID"
              aria-label={copied ? 'UID copied!' : `Copy UID: ${player.uid}`}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/40"
              style={{
                borderColor: copied ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)',
                color: copied ? '#d4af37' : 'rgb(107,114,128)',
              }}
            >
              {copied ? '✓ COPIED' : '⊕ UID'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function RosterSection({ players }: Props) {
  const visible = players.filter(p => p.visible).sort((a, b) => a.order - b.order);
  const [active, setActive] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'none'>('none');
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [inView, setInView] = useState(false);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePrev = useCallback(() => {
    if (visible.length === 0) return;
    clearInterval(intervalRef.current);
    setSlideDir('left');
    setActive(prev => (prev - 1 + visible.length) % visible.length);
  }, [visible.length]);

  const handleNext = useCallback(() => {
    if (visible.length === 0) return;
    clearInterval(intervalRef.current);
    setSlideDir('right');
    setActive(prev => (prev + 1) % visible.length);
  }, [visible.length]);

  useEffect(() => {
    if (prefersReducedMotion || !inView) return;
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % Math.max(visible.length, 1));
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [visible.length, prefersReducedMotion, inView]);

  // Auto-scroll active card into view only when in view
  useEffect(() => {
    if (inView && cardRefs.current[active]) {
      cardRefs.current[active]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active, inView]);

  const player = visible[active];
  const color = player ? (GAME_COLORS[player.game] || '#ff6b00') : '#ff6b00';

  const handleSelect = (idx: number) => {
    setActive(idx);
    clearInterval(intervalRef.current);
  };

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    threshold: 40,
  });

  // Keyboard Arrow Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <section
      id="roster"
      ref={sectionRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-labelledby="roster-heading"
      className={`py-24 relative transition-all duration-1000 focus:outline-none ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${color}08 0%, transparent 70%)`
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <header className="text-center mb-12">
          <span className="text-xs font-bold tracking-[0.3em] text-gold/70 uppercase">Our Squad</span>
          <h2 id="roster-heading" className="text-4xl md:text-5xl font-black tracking-widest mt-2 text-white">THE ROSTER</h2>
          <div className="w-24 h-1 mx-auto mt-4 mb-4" style={{
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)'
          }} />

          {/* Swipe indicator badge & navigation helper */}
          {visible.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-gold/90 bg-gold/10 border border-gold/20 shadow-sm animate-pulse">
                <ArrowLeft className="w-3.5 h-3.5" /> Swipe Left / Right <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-gray-400">
                {active + 1} / {visible.length}
              </span>
            </div>
          )}
        </header>

        {visible.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4" aria-hidden="true">🎮</div>
            <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">No players to display.</p>
          </div>
        ) : (
          <>
            {/* Featured player spotlight with touch & drag swipe */}
            {player && (
              <div
                key={`${player.id}-${active}`}
                {...swipeHandlers}
                className={`relative mb-12 group/spotlight select-none cursor-grab active:cursor-grabbing p-6 md:p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/40 backdrop-blur-sm transition-all duration-300 hover:border-gold/30 ${
                  slideDir === 'right' ? 'animate-slide-in-right' : slideDir === 'left' ? 'animate-slide-in-left' : ''
                }`}
              >
                {/* Left Swipe Navigation Arrow */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  aria-label="Previous Player (Swipe Left)"
                  className="absolute left-2 md:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/80 border border-gold/40 text-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-gold hover:text-black hover:scale-110 active:scale-95 transition-all duration-200"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                {/* Right Swipe Navigation Arrow */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  aria-label="Next Player (Swipe Right)"
                  className="absolute right-2 md:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/80 border border-gold/40 text-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-gold hover:text-black hover:scale-110 active:scale-95 transition-all duration-200"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center px-4 md:px-8">
                  {/* Photo */}
                  <div className="lg:col-span-2 relative flex items-center justify-center min-h-[320px]">
                    <div
                      className="absolute inset-0 rounded-3xl opacity-20 blur-3xl pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at center, ${color}, transparent)` }}
                      aria-hidden="true"
                    />
                    {player.image ? (
                      <Image
                        src={player.image}
                        alt={`${player.ign} — ${player.role}`}
                        loading="lazy"
                        draggable={false}
                        objectFit="contain"
                        className="relative z-10 max-h-80 w-auto object-contain drop-shadow-2xl transition-all duration-500"
                        style={{ filter: `drop-shadow(0 0 40px ${color}66)` }}
                      />
                    ) : (
                      <div
                        className="relative z-10 w-56 h-56 rounded-3xl flex items-center justify-center text-7xl font-black border-2 transition-all duration-500"
                        style={{
                          borderColor: color,
                          background: `linear-gradient(135deg, ${color}22, transparent)`,
                          color,
                          boxShadow: `0 0 60px ${color}44`,
                        }}
                        aria-label={`${player.ign} avatar`}
                      >
                        {player.ign.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="lg:col-span-3 space-y-5">
                    <div className="transition-all duration-500">
                      {/* Game + status */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black tracking-[0.35em] uppercase" style={{ color }}>{player.game}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                          player.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {player.status || 'active'}
                        </span>
                      </div>

                      {/* IGN */}
                      <h3 className="text-5xl md:text-6xl font-black text-white tracking-widest leading-none mb-1 flex items-center gap-2">
                        {player.ign}
                        <BadgeCheck className="w-8 h-8 md:w-10 md:h-10 text-blue-400 flex-shrink-0" />
                      </h3>
                      <p className="text-lg text-gray-400 mb-1">{player.name}</p>

                      {/* Country */}
                      {player.country && (
                        <p className="text-sm text-gray-500 mb-3">📍 {player.country}</p>
                      )}

                      {/* Role badge */}
                      <div className="flex items-center gap-3 mb-5">
                        <span
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black tracking-widest border rounded-sm"
                          style={{ borderColor: color, color }}
                        >
                          <span aria-hidden="true">{ROLE_ICONS[player.role] || '🎮'}</span> {player.role}
                        </span>
                      </div>

                      {/* Stats — only render when at least one stat is present */}
                      {(player.kdRatio || (player.mvpCount !== undefined && player.mvpCount > 0)) && (
                        <div className="flex gap-6 mb-5 py-4 border-y border-white/5">
                          {player.kdRatio && (
                            <div className="relative group/kd">
                              <div className="text-2xl font-black text-white tabular-nums">{player.kdRatio}</div>
                              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500">K/D Ratio</div>
                              {player.kdRatioImage && (
                                <div className="absolute top-0 right-0 -mt-16 -mr-16 p-2 bg-black/90 border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover/kd:opacity-100 transition-opacity pointer-events-none z-50">
                                  <span className="text-[9px] text-gray-400 uppercase tracking-widest block mb-1">Proof</span>
                                  <Image src={player.kdRatioImage} alt="K/D Proof" objectFit="contain" className="w-32 h-auto rounded border border-white/20" />
                                </div>
                              )}
                            </div>
                          )}
                          {player.mvpCount !== undefined && player.mvpCount > 0 && (
                            <div>
                              <div className="text-2xl font-black tabular-nums" style={{ color }}>{player.mvpCount}×</div>
                              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500">MVP</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Achievements */}
                      {player.achievements && player.achievements.length > 0 && (
                        <ul className="space-y-1.5 mb-5" aria-label="Achievements">
                          {player.achievements.map((a, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                              <span className="text-yellow-500/80 text-xs" aria-hidden="true">🏆</span> {a}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Social links + UID */}
                      <div className="flex items-center gap-4 flex-wrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2" aria-label="Social links">
                          <SocialIcon href={player.socialInstagram || ''} icon="📸" label="Instagram" />
                          <SocialIcon href={player.socialYoutube || ''} icon="▶" label="YouTube" />
                          <SocialIcon href={player.socialFacebook || ''} icon="🌐" label="Facebook" />
                          <SocialIcon href={player.socialDiscord || ''} icon="💬" label="Discord" />
                        </div>
                        {player.uid && (
                          <UIDButton uid={player.uid} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Player Dots Carousel Navigator */}
            <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
              {visible.map((p, idx) => (
                <button
                  key={`dot-${p.id}`}
                  onClick={() => handleSelect(idx)}
                  aria-label={`Jump to ${p.ign}`}
                  className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                    idx === active ? 'w-8 bg-gold shadow-[0_0_10px_#d4af37]' : 'w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            {/* Swipeable Player Card Carousel Grid */}
            <div
              className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none"
              role="list"
              aria-label="All roster players"
            >
              {visible.map((p, idx) => (
                <div
                  key={p.id}
                  role="listitem"
                  ref={el => { cardRefs.current[idx] = el; }}
                  className="flex-shrink-0 w-64 sm:w-auto snap-center"
                >
                  <PlayerCard
                    player={p}
                    isActive={idx === active}
                    onClick={() => handleSelect(idx)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function UIDButton({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => copyToClipboard(uid, setCopied)}
      aria-label={copied ? 'UID copied!' : `Copy Player UID: ${uid}`}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-black tracking-widest uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/40"
      style={{
        borderColor: copied ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)',
        color: copied ? '#d4af37' : 'rgb(107,114,128)',
        background: copied ? 'rgba(212,175,55,0.05)' : 'transparent',
      }}
    >
      {copied ? '✓ COPIED' : `⊕ ${uid}`}
    </button>
  );
}
