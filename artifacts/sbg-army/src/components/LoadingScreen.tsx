import { useEffect, useState, useRef } from 'react';
import { getDB } from '@/lib/database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

interface Props { onDone: () => void; }

interface Ember {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; maxLife: number;
}

const DEFAULT_TIPS = [
  'Loading Player Data…', 'Connecting to Servers…', 'Syncing Tournaments…',
  'Loading Team Roster…', 'Preparing Match Center…', 'Checking Live Scores…',
  'Optimizing Assets…', 'Connecting to Community…', 'Verifying Security…',
  'Ready for Battle…',
];

const GOLD = '#d4af37';
const GOLD_BRIGHT = '#f5e27e';
const GOLD_DARK = '#b8960c';

export default function LoadingScreen({ onDone }: Props) {
  // Only state that actually drives visible UI changes on every tick:
  // - pct (integer 0-100): drives progress bar width + label
  // - tipIdx / tipVisible: drives tip text
  // - fadeOut: drives exit animation
  // Everything else is kept in refs to avoid unnecessary re-renders.

  const [pct, setPct] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const progressRef = useRef(0);   // raw float, not state
  const doneRef = useRef(false);
  const embersRef = useRef<Ember[]>([]);
  const rafRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Read settings safely
  const db = getDB();
  const s = db.settings;
  const logoUrl = (s as any).loadingLogo || s.logo || '';
  const tips: string[] = (s as any).loadingTips?.length > 0 ? (s as any).loadingTips : DEFAULT_TIPS;
  const showParticles = (s as any).loadingParticles !== false;
  const showGlow = (s as any).loadingGlow !== false;
  const showSkip = (s as any).loadingSkipButton !== false;
  const duration = Math.max(800, Math.min(6000, Number((s as any).loadingDuration) || 1600));

  // ── Canvas particle system — runs entirely off-thread in RAF ────────────────
  useEffect(() => {
    if (!showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const spawn = (): Ember => ({
      x: canvas.width * (0.25 + Math.random() * 0.5),
      y: canvas.height * (0.55 + Math.random() * 0.35),
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(0.3 + Math.random() * 1.0),
      size: 1 + Math.random() * 2,
      alpha: 0, life: 0,
      maxLife: 100 + Math.random() * 160,
    });

    // Seed fewer initial embers (35 → smoother startup)
    for (let i = 0; i < 20; i++) {
      const e = spawn(); e.life = Math.random() * e.maxLife;
      embersRef.current.push(e);
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Spawn new embers only every other frame & only if under limit (35)
      if (frame % 2 === 0 && embersRef.current.length < 35 && Math.random() < 0.4) {
        embersRef.current.push(spawn());
      }

      embersRef.current = embersRef.current.filter(e => e.life < e.maxLife);

      for (const e of embersRef.current) {
        e.life++;
        e.x += e.vx + Math.sin(e.life * 0.05) * 0.25;
        e.y += e.vy;
        e.vy -= 0.003;

        const p = e.life / e.maxLife;
        e.alpha = p < 0.15 ? p / 0.15 : p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;

        // Single-pass: draw glow + core in one begin/fill cycle
        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 3);
        glow.addColorStop(0, `rgba(212,175,55,${e.alpha * 0.85})`);
        glow.addColorStop(0.5, `rgba(245,226,126,${e.alpha * 0.3})`);
        glow.addColorStop(1, `rgba(212,175,55,0)`);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,200,${e.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [showParticles]);

  // ── Progress: ref-driven tick, setState only when integer changes ──────────
  useEffect(() => {
    const startTime = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const natural = (elapsed / duration) * 100;
      const target = natural < 70 ? natural * 1.1 : 70 + (natural - 70) * 0.7;
      const next = Math.min(progressRef.current + Math.max(0.3, (target - progressRef.current) * 0.08), 100);
      progressRef.current = next;
      const nextInt = Math.round(next);
      // Only trigger a re-render when the integer percentage changes
      setPct(prev => (prev === nextInt ? prev : nextInt));
      if (next >= 100) clearInterval(tick);
    }, 50);
    return () => clearInterval(tick);
  }, [duration]);

  // ── Tip rotation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setTipVisible(false);
      fadeTimer = setTimeout(() => {
        setTipIdx(i => (i + 1) % tips.length);
        setTipVisible(true);
      }, 200);
    }, Math.max(300, duration / tips.length));
    return () => {
      clearInterval(interval);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [tips, duration]);

  // ── Completion ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (doneRef.current) return;
      setFadeOut(true);
      setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }, 550);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  const skip = () => {
    if (doneRef.current) return;
    setFadeOut(true);
    setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }, 400);
  };

  const tipText = tips[tipIdx] ?? DEFAULT_TIPS[0];

  return (
    <>
      <style>{`
        @keyframes sbg-ring-spin { to { transform: rotate(360deg); } }
        @keyframes sbg-breathe {
          0%, 100% { transform: scale(1) translateZ(0); filter: drop-shadow(0 0 28px rgba(212,175,55,0.45)); }
          50%       { transform: scale(1.05) translateZ(0); filter: drop-shadow(0 0 50px rgba(212,175,55,0.8)) drop-shadow(0 0 70px rgba(212,175,55,0.35)); }
        }
        @keyframes sbg-shine {
          0%   { transform: translateX(-120%) skewX(-15deg); opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(220%) skewX(-15deg); opacity: 0; }
        }
        @keyframes sbg-bar-glow {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(212,175,55,0.45), 0 0 16px 3px rgba(212,175,55,0.2); }
          50%       { box-shadow: 0 0 12px 4px rgba(245,226,126,0.75), 0 0 28px 6px rgba(212,175,55,0.4); }
        }
        @keyframes sbg-glow-orb {
          0%, 100% { opacity: 0.45; transform: scale(1) translateZ(0); }
          50%       { opacity: 0.8; transform: scale(1.12) translateZ(0); }
        }
        @keyframes sbg-letter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sbg-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sbg-grid-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div
        aria-label="Loading ${PUBLIC_BRAND_NAME}"
        aria-live="polite"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#05050a',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.55s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: fadeOut ? 'none' : 'all',
          overflow: 'hidden',
          userSelect: 'none',
          // Promote to GPU layer so paint doesn't re-composite every frame
          willChange: 'opacity',
          contain: 'layout style',
        }}
      >
        {/* ── Static background: single radial glow (no animations) ── */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 65% 55% at 50% 52%, rgba(212,175,55,0.065) 0%, rgba(212,175,55,0.018) 50%, transparent 80%)',
        }} />

        {/* Animated ambient orb — single element, GPU-composited */}
        <div style={{
          position: 'absolute', top: '28%', left: '50%',
          width: '560px', height: '380px',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.085) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%) translateZ(0)',
          animation: 'sbg-glow-orb 4s ease-in-out infinite',
          pointerEvents: 'none',
          willChange: 'transform, opacity',
        }} />

        {/* Subtle grid — static, fades in once */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.022) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'sbg-grid-in 1.8s ease-out forwards',
          opacity: 0,
        }} />

        {/* Top + bottom accent lines — static */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.55) 50%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 50%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Corner brackets */}
        {[
          { top: '20px', left: '24px' },
          { top: '20px', right: '24px' },
          { bottom: '20px', left: '24px' },
          { bottom: '20px', right: '24px' },
        ].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', ...pos, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column',
            alignItems: i % 2 !== 0 ? 'flex-end' : 'flex-start',
            justifyContent: i >= 2 ? 'flex-end' : 'flex-start' }}>
            <div style={{ width: '22px', height: '2px', background: 'rgba(212,175,55,0.38)' }} />
            <div style={{ width: '2px', height: '22px', background: 'rgba(212,175,55,0.38)', marginTop: i >= 2 ? 0 : '-2px', marginBottom: i >= 2 ? '-2px' : 0 }} />
          </div>
        ))}

        {/* Particle canvas */}
        {showParticles && (
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }} />
        )}

        {/* ── Main content ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 0,
        }}>

          {/* Energy ring + Logo */}
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '8px' }}>
            {/* Static outer ring */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="1.5" />
            </svg>

            {/* Rotating energy arc — single element, will-change for GPU composite */}
            <svg style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              animation: 'sbg-ring-spin 4s linear infinite',
              willChange: 'transform',
            }} viewBox="0 0 160 160">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={GOLD_DARK} stopOpacity="0" />
                  <stop offset="35%" stopColor={GOLD} stopOpacity="1" />
                  <stop offset="65%" stopColor={GOLD_BRIGHT} stopOpacity="1" />
                  <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="74" fill="none"
                stroke="url(#ringGrad)" strokeWidth="2.5"
                strokeDasharray="155 310" strokeLinecap="round" />
            </svg>

            {/* Counter-rotating inner ring */}
            <svg style={{
              position: 'absolute', inset: '12px', width: 'calc(100% - 24px)', height: 'calc(100% - 24px)',
              animation: 'sbg-ring-spin 7s linear infinite reverse',
              willChange: 'transform',
            }} viewBox="0 0 136 136">
              <circle cx="68" cy="68" r="62" fill="none"
                stroke="rgba(212,175,55,0.18)" strokeWidth="0.5"
                strokeDasharray="18 76" strokeLinecap="round" />
            </svg>

            {/* Logo */}
            <div style={{
              position: 'absolute', inset: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: showGlow ? 'sbg-breathe 3s ease-in-out infinite' : 'none',
              willChange: showGlow ? 'transform, filter' : undefined,
            }}>
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt={PUBLIC_BRAND_NAME} onLoad={() => setLogoLoaded(true)}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                      opacity: logoLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }} />
                  {logoLoaded && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)',
                      animation: 'sbg-shine 4.5s ease-in-out infinite 1.2s',
                      borderRadius: '50%', pointerEvents: 'none',
                    }} />
                  )}
                </>
              ) : (
                <div style={{
                  width: '90px', height: '90px', borderRadius: '18px',
                  background: `linear-gradient(145deg, ${GOLD_DARK} 0%, ${GOLD} 45%, ${GOLD_BRIGHT} 75%, ${GOLD} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
                  fontWeight: 900, fontSize: '30px', color: '#050508',
                  letterSpacing: '0.05em', overflow: 'hidden', position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)',
                    animation: 'sbg-shine 3.5s ease-in-out infinite 0.8s',
                  }} />
                  SBG
                </div>
              )}
            </div>
          </div>

          {/* Org name — letter reveal (runs once, no loop) */}
          <div style={{
            fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
            fontWeight: 900, fontSize: 'clamp(26px,5vw,40px)',
            letterSpacing: '0.38em', color: '#fff',
            marginTop: '4px', display: 'flex', gap: 0,
          }}>
            {PUBLIC_BRAND_NAME.split('').map((ch, i) => (
              <span key={i} style={{
                display: 'inline-block',
                animation: `sbg-letter 0.5s ease-out ${0.1 + i * 0.06}s both`,
                whiteSpace: 'pre',
              }}>
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </div>

          {/* Tagline */}
          <p style={{
            fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
            fontWeight: 700, fontSize: 'clamp(9px,1.1vw,11px)',
            letterSpacing: '0.5em', color: GOLD,
            margin: '6px 0 0',
            animation: 'sbg-fade-in 0.7s ease-out 0.9s both',
          }}>
            BORN TO WIN. BUILT TO DOMINATE.
          </p>

          {/* Loading tip — opacity/transform driven by state, no RAF */}
          <div style={{ height: '18px', marginTop: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{
              fontFamily: "'Rajdhani','Barlow Condensed',monospace",
              fontSize: '10px', letterSpacing: '0.22em',
              color: 'rgba(212,175,55,0.65)', fontWeight: 600,
              opacity: tipVisible ? 1 : 0,
              transform: tipVisible ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              willChange: 'opacity, transform',
            }}>
              {tipText.toUpperCase()}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ width: 'clamp(200px,28vw,300px)', marginTop: '10px' }}>
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${GOLD_DARK} 0%, ${GOLD} 55%, ${GOLD_BRIGHT} 85%, #fff8d0 100%)`,
                borderRadius: '2px',
                transition: 'width 100ms linear',
                willChange: 'width',
              }} />
              {pct > 1 && pct < 100 && (
                <div style={{
                  position: 'absolute', top: '50%', left: `${pct}%`,
                  width: '5px', height: '5px', borderRadius: '50%', background: '#fff',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 7px 2px ${GOLD}`,
                  animation: 'sbg-bar-glow 1.1s ease-in-out infinite',
                  willChange: 'box-shadow',
                }} />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '7px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(212,175,55,0.55)', letterSpacing: '0.1em' }}>
                {pct}%
              </span>
              <span style={{
                fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
                fontSize: '9px', color: 'rgba(255,255,255,0.18)',
                letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase',
              }}>
                {pct < 30 ? 'INITIALIZING' : pct < 60 ? 'LOADING' : pct < 90 ? 'SYNCING' : pct < 100 ? 'FINALIZING' : 'READY'}
              </span>
            </div>
          </div>

          {/* Skip button */}
          {showSkip && (
            <button onClick={skip} style={{
              marginTop: '18px', padding: '5px 18px',
              background: 'transparent', border: `1px solid rgba(212,175,55,0.22)`,
              borderRadius: '6px', color: 'rgba(212,175,55,0.45)',
              fontSize: '9px', letterSpacing: '0.25em',
              fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
            }}
              onMouseEnter={e => { const b = e.target as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.55)'; b.style.color = GOLD; }}
              onMouseLeave={e => { const b = e.target as HTMLButtonElement; b.style.borderColor = 'rgba(212,175,55,0.22)'; b.style.color = 'rgba(212,175,55,0.45)'; }}
            >
              SKIP →
            </button>
          )}
        </div>
      </div>
    </>
  );
}
