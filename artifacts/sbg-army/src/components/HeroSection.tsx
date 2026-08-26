import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Ad, Settings, Database, isFeatureActive, isPlacementActive, isAdActive } from '@/lib/database';

/* ─── Count-Up Component ─────────────────────────────────────────────────── */
function CountUpStat({ numericEnd, suffix, value, label, icon }: {
  numericEnd?: number | string; suffix?: string; value?: string; label: string; icon?: string;
}) {
  const [displayed, setDisplayed] = useState<number>(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const parsedVal = value ? parseInt(String(value).replace(/[^0-9]/g, ''), 10) : NaN;
  const parsedEnd = typeof numericEnd === 'number'
    ? numericEnd
    : parseInt(String(numericEnd ?? '').replace(/[^0-9]/g, ''), 10);

  const rawTarget = !isNaN(parsedEnd) && parsedEnd > 0
    ? parsedEnd
    : (!isNaN(parsedVal) && parsedVal > 0 ? parsedVal : 0);

  const end = Math.max(0, rawTarget);
  const cleanSuffix = (suffix !== undefined && suffix !== null)
    ? suffix
    : (value?.match(/[^0-9\s]+$/)?.[0] ?? '');

  useEffect(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setStarted(false);
    setDisplayed(0);
  }, [end]);

  const runAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (end <= 0) {
      setDisplayed(0);
      return;
    }
    const duration = 1800; // ms
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayed(Math.round(easeOut(progress) * end));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [end]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          runAnimation();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [started, runAnimation]);

  const numToDisplay = started ? displayed : end;
  const formattedDisplayed = Math.max(0, numToDisplay).toLocaleString();
  const displayStr = `${formattedDisplayed}${cleanSuffix}`;

  return (
    <div ref={ref} className="text-center group cursor-default select-none flex flex-col items-center">
      {icon && <div className="text-2xl mb-2 opacity-80 group-hover:scale-110 transition-transform">{icon}</div>}
      <div
        className="text-3xl sm:text-4xl font-black tracking-tight transition-transform duration-300 group-hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #d4af37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))',
        }}
      >
        {displayStr}
      </div>
      <div className="text-[10px] font-black tracking-[0.3em] uppercase mt-1"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </div>
      {/* Gold underline accent */}
      <div className="mx-auto mt-2 h-px w-0 group-hover:w-8 transition-all duration-500 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
    </div>
  );
}

interface Props {
  settings: Settings;
  ads: Ad[];
  db?: Database;
}

/** Check if WebGL is fully usable (context must be non-null and not lost) */
function isWebGLAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) return false;
    const canvas = document.createElement('canvas');
    const ctx = (
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl')
    ) as WebGLRenderingContext | null;
    if (!ctx) return false;
    // Verify it's a real, functional context
    const ext = ctx.getExtension('WEBGL_lose_context');
    return true;
  } catch {
    return false;
  }
}

/** CSS-only fallback particle background (no GPU required) */
function CSSParticleBackground() {
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const count = prefersReduced ? 0 : 70;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#080808] via-[#0d0d0d] to-[#080808]">
      {/* Radial glows */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 20% 80%, rgba(212,175,55,0.06) 0%, transparent 50%),
          radial-gradient(ellipse 40% 40% at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)
        `
      }} />
      {[...Array(count)].map((_, i) => {
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = 8 + Math.random() * 12;
        const isGold = Math.random() > 0.45;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: `${x}%`,
              bottom: '-10px',
              background: isGold ? '#d4af37' : '#ffffff',
              opacity: 0.15 + Math.random() * 0.45,
              animation: `floatUp ${duration}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Helper to create a soft glowing circular particle texture */
function createGlowSpriteTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 235, 150, 0.95)');
    gradient.addColorStop(0.45, 'rgba(212, 175, 55, 0.5)');
    gradient.addColorStop(0.75, 'rgba(255, 107, 0, 0.18)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Three.js cinematic 3D particle background */
export function ThreeBackground({ settings }: { settings?: Settings }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  // Speed multiplier lives in a ref so it updates without re-running the scene
  const speedRef = useRef(settings?.bgAnimationSpeed ?? 1);
  useEffect(() => { speedRef.current = settings?.bgAnimationSpeed ?? 1; }, [settings?.bgAnimationSpeed]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !isWebGLAvailable()) {
      setWebglFailed(true);
      return;
    }

    const el = mountRef.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080808, 0.032);

    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 250);
    camera.position.set(0, 0, 24);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setWebglFailed(true);
      return;
    }
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x080808, 1);
    el.appendChild(renderer.domElement);

    const particleTexture = createGlowSpriteTexture();

    // ── 1. Celestial Deep Cloud Particles ──────────────────────────────────────
    const PARTICLE_COUNT = isMobile ? 80 : 150;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const goldRGB = new THREE.Color('#d4af37');
    const brightGold = new THREE.Color('#ffd700');
    const flameOrange = new THREE.Color('#ff6b00');
    const dimGold = new THREE.Color('#8a6e1a');
    const white = new THREE.Color('#ffffff');
    const cyanAccent = new THREE.Color('#4fd1c5');

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 8 + Math.pow(Math.random(), 0.7) * 32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const px = r * Math.sin(phi) * Math.cos(theta);
      const py = r * Math.sin(phi) * Math.sin(theta);
      const pz = r * Math.cos(phi);

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      originalPositions[i * 3] = px;
      originalPositions[i * 3 + 1] = py;
      originalPositions[i * 3 + 2] = pz;

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = 0.005 + Math.random() * 0.015; // gentle upward drift
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // Color variation
      const rnd = Math.random();
      let col: THREE.Color;
      if (rnd > 0.96) col = white;
      else if (rnd > 0.88) col = cyanAccent;
      else if (rnd > 0.65) col = brightGold;
      else if (rnd > 0.40) col = flameOrange;
      else if (rnd > 0.20) col = goldRGB;
      else col = dimGold;

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = 0.08 + Math.random() * 0.28;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: isMobile ? 0.15 : 0.20,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── 2. Cyber Orbital Energy Vortex Rings ──────────────────────────────────
    const RING_COUNT = isMobile ? 30 : 60;
    const ringPositions = new Float32Array(RING_COUNT * 3);
    const ringColors = new Float32Array(RING_COUNT * 3);

    for (let i = 0; i < RING_COUNT; i++) {
      const angle = (i / RING_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const radius = 12 + (Math.random() - 0.5) * 4;
      const zOffset = (Math.random() - 0.5) * 2.5;

      ringPositions[i * 3] = Math.cos(angle) * radius;
      ringPositions[i * 3 + 1] = Math.sin(angle) * radius;
      ringPositions[i * 3 + 2] = zOffset;

      const rnd = Math.random();
      const col = rnd > 0.8 ? white : rnd > 0.4 ? brightGold : flameOrange;
      ringColors[i * 3] = col.r;
      ringColors[i * 3 + 1] = col.g;
      ringColors[i * 3 + 2] = col.b;
    }

    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));

    const ringMat = new THREE.PointsMaterial({
      size: isMobile ? 0.2 : 0.25,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const ringGroup = new THREE.Group();
    const ringPoints = new THREE.Points(ringGeo, ringMat);
    ringGroup.add(ringPoints);
    ringGroup.rotation.x = Math.PI * 0.35;
    ringGroup.rotation.y = Math.PI * 0.15;
    scene.add(ringGroup);

    // ── 3. Wireframe Sacred Geometry floating elements ────────────────────────
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });

    const icosaGeo = new THREE.IcosahedronGeometry(4.5, 1);
    const icosa = new THREE.Mesh(icosaGeo, wireMat.clone());
    icosa.position.set(7, 2, -6);
    scene.add(icosa);

    const octoGeo = new THREE.OctahedronGeometry(2.5, 0);
    const octo = new THREE.Mesh(octoGeo, wireMat.clone());
    octo.position.set(-8, -3, -4);
    scene.add(octo);

    const torusGeo = new THREE.TorusGeometry(3.2, 0.4, 10, 32);
    const torus = new THREE.Mesh(torusGeo, wireMat.clone());
    torus.position.set(-3, 5, -10);
    torus.rotation.x = Math.PI / 3;
    scene.add(torus);

    const dodGeo = new THREE.DodecahedronGeometry(2.2, 0);
    const dod = new THREE.Mesh(dodGeo, wireMat.clone());
    dod.position.set(4, -5, -8);
    scene.add(dod);

    // ── 4. Multi-color Dynamic Lights ─────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x111111, 1);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xd4af37, 5, 45);
    goldLight.position.set(0, 8, 10);
    scene.add(goldLight);

    const amberLight = new THREE.PointLight(0xff6b00, 3.5, 35);
    amberLight.position.set(-12, -6, 6);
    scene.add(amberLight);

    const whiteLight = new THREE.PointLight(0xffffff, 2, 25);
    whiteLight.position.set(10, 6, 8);
    scene.add(whiteLight);

    // ── 5. Mouse & Touch Parallax / Physics ────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let mouseSpeed = 0;
    let prevMouseX = 0, prevMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = -(e.clientY / window.innerHeight - 0.5) * 2;
      mouseSpeed = Math.hypot(nx - prevMouseX, ny - prevMouseY);
      prevMouseX = mouseX = nx;
      prevMouseY = mouseY = ny;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        mouseX = (t.clientX / window.innerWidth - 0.5) * 2;
        mouseY = -(t.clientY / window.innerHeight - 0.5) * 2;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // ── Resize handler ─────────────────────────────────────────────────────────
    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation Loop ─────────────────────────────────────────────────────────
    let frameId: number | null = null;
    let t = 0;
    let isVisible = true;
    let lastTime = performance.now();

    const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;

    const animate = (currentTime: number) => {
      if (!isVisible) return;
      frameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.08);
      lastTime = currentTime;
      const deltaFactor = delta * 60;

      const speed = 0.004 * speedRef.current * deltaFactor;
      t += speed;

      // Exponential LERP factor calculation
      const lerpAlpha = 1 - Math.exp(-3.5 * delta);
      const sbgLerpAlpha = 1 - Math.exp(-6.0 * delta);

      // Smooth mouse follow with LERP
      targetX += (mouseX - targetX) * lerpAlpha;
      targetY += (mouseY - targetY) * lerpAlpha;

      // Particle container rotations
      particles.rotation.y = t * 0.05 + targetX * 0.18;
      particles.rotation.x = t * 0.025 + targetY * 0.1;

      // Orbital Ring animation
      ringGroup.rotation.z = t * 0.3;
      ringGroup.rotation.x = Math.PI * 0.35 + Math.sin(t * 0.5) * 0.1 + targetY * 0.12;
      ringGroup.rotation.y = Math.PI * 0.15 + Math.cos(t * 0.4) * 0.1 + targetX * 0.15;

      // Upward drifting and subtle breathing for individual cosmic particles
      const posArray = posAttr.array as Float32Array;
      const step = isMobile ? 4 : 2; // update slice per frame for ultra-fast 60+ FPS
      for (let i = 0; i < PARTICLE_COUNT; i += step) {
        const idx = i * 3;
        posArray[idx + 1] += velocities[idx + 1] * speedRef.current * deltaFactor;
        posArray[idx] += Math.sin(t * 2 + i) * (0.008 * deltaFactor);

        // Wrap around sphere bound
        if (posArray[idx + 1] > 32) {
          posArray[idx + 1] = -32;
        }
      }
      posAttr.needsUpdate = true;

      // Sacred Geometry rotations and floating orbits
      icosa.rotation.y = t * 0.45;
      icosa.rotation.x = t * 0.25;
      icosa.position.y = 2 + Math.sin(t * 0.7) * 0.8;

      octo.rotation.x = t * 0.5;
      octo.rotation.z = t * 0.35;
      octo.position.x = -8 + Math.sin(t * 0.5) * 0.6;
      octo.position.y = -3 + Math.cos(t * 0.6) * 0.5;

      torus.rotation.z = t * 0.4;
      torus.rotation.y = t * 0.2;
      torus.position.y = 5 + Math.cos(t * 0.6) * 0.9;

      dod.rotation.y = t * 0.5;
      dod.rotation.x = t * 0.3;
      dod.position.y = -5 + Math.sin(t * 0.8) * 0.7;

      // Dynamic pulsating lights
      goldLight.intensity = 4 + Math.sin(t * 1.8) * 2;
      goldLight.position.x = Math.sin(t * 0.5) * 8;
      goldLight.position.y = 8 + Math.cos(t * 0.4) * 4;

      amberLight.intensity = 3 + Math.cos(t * 1.5) * 1.5;
      amberLight.position.x = -10 + Math.cos(t * 0.6) * 6;

      whiteLight.intensity = 1.8 + Math.sin(t * 2.2) * 1.2;

      // Camera parallax with smooth LERP inertia
      camera.position.x += (targetX * 2.2 - camera.position.x) * lerpAlpha;
      camera.position.y += (targetY * 1.4 - camera.position.y) * lerpAlpha;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    const startAnimation = () => {
      if (!frameId && isVisible) {
        lastTime = performance.now();
        frameId = requestAnimationFrame(animate);
      }
    };

    const stopAnimation = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && document.visibilityState === 'visible';
      if (isVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }, { threshold: 0.05 });
    observer.observe(el);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isVisible = false;
        stopAnimation();
      } else if (el) {
        const rect = el.getBoundingClientRect();
        isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (isVisible) startAnimation();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    startAnimation();

    return () => {
      stopAnimation();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      particleTexture.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      // Dispose all cloned wireframe materials and geometries to prevent GPU leaks
      icosa.material instanceof THREE.Material && icosa.material.dispose();
      octo.material instanceof THREE.Material && octo.material.dispose();
      torus.material instanceof THREE.Material && torus.material.dispose();
      dod.material instanceof THREE.Material && dod.material.dispose();
      icosaGeo.dispose(); octoGeo.dispose(); torusGeo.dispose(); dodGeo.dispose();
      wireMat.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  if (webglFailed) return <CSSParticleBackground />;
  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
}

function TournamentCountdown({ settings }: { settings: Settings }) {
  // Render only when admin enables it and has set a valid future/past date
  const enabled = settings.countdownEnabled === true;
  const targetDate = settings.countdownTargetDate ? new Date(settings.countdownTargetDate) : null;
  const isValidDate = !!targetDate && !isNaN(targetDate.getTime());

  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    if (!enabled || !isValidDate || !targetDate) return;
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [enabled, isValidDate, targetDate?.getTime()]);

  if (!enabled || !isValidDate) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  const title = settings.countdownTitle || 'Next Tournament';
  const expiredMsg = settings.countdownExpiredMessage || 'Stay tuned — next event starting soon!';

  if (timeLeft.expired) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
        className="flex items-center gap-2 justify-center mb-10">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-green-500/30 bg-black/50 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-black tracking-widest uppercase">{expiredMsg}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
      className="flex items-center gap-2 justify-center mb-10">
      <div className="flex items-center gap-1 px-3 sm:px-5 py-2.5 rounded-full border border-gold/30 bg-black/50 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-gold animate-pulse mr-1 sm:mr-2" />
        <span className="text-[10px] sm:text-xs text-gray-400 tracking-widest uppercase font-bold mr-2 sm:mr-3">{title}</span>
        {[
          { val: pad(timeLeft.d), label: 'D' },
          { val: pad(timeLeft.h), label: 'H' },
          { val: pad(timeLeft.m), label: 'M' },
          { val: pad(timeLeft.s), label: 'S' },
        ].map(({ val, label }, i) => (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && <span className="text-gold/50 font-bold text-sm">:</span>}
            <div className="text-center">
              <div className="text-gold font-black text-base sm:text-lg leading-none tabular-nums">{val}</div>
              <div className="text-[9px] text-gray-600 tracking-widest">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function HeroSection({ settings, ads, db }: Props) {
  const safeAds = ads || [];
  const heroAd = safeAds.find(a => a.placement === 'hero' && isAdActive(a));
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroVideo = settings.heroVideoUrl as string | undefined;

  const pages = db?.features?.pages || {};
  const canJoin = isFeatureActive(pages.join) && isPlacementActive(pages.join, 'cta') && settings.heroCtaJoinVisible !== false;
  const canTournaments = isFeatureActive(pages.tournaments) && isPlacementActive(pages.tournaments, 'cta') && settings.heroCtaTournamentVisible !== false;
  const canPlayerLogin = isFeatureActive(pages.playerPortal) && isPlacementActive(pages.playerPortal, 'cta');
  const canDashboard = isFeatureActive(pages.dashboard) && isPlacementActive(pages.dashboard, 'cta');
  const canLive = isFeatureActive(pages.live) && isPlacementActive(pages.live, 'cta') && settings.heroCtaLiveVisible !== false;
  const canHeroStats = isFeatureActive(db?.features?.sections?.heroStats);

  useEffect(() => {
    if (videoRef.current) videoRef.current.play().catch(() => {});
  }, []);

  const name = settings.organizationName || 'SBG ESPORTS';
  const words = name.split(' ');
  const firstName = words[0];
  const rest = words.slice(1).join(' ');

  // Compute live statistics for stats bar
  const realPlayers = (db?.players || []).filter((p: any) => p.visible !== false).length;
  const realTournaments = (db?.tournaments || []).length;
  const matches = db?.matches || [];
  const completedMatches = matches.filter((m: any) => m.result === 'W' || m.result === 'L');
  const wins = matches.filter((m: any) => m.result === 'W').length;
  const calculatedWinRate = completedMatches.length > 0 
    ? Math.round((wins / completedMatches.length) * 100)
    : 78;
  const realTitles = (db?.achievements || []).length;

  const rawStats = (settings.heroStats && settings.heroStats.length > 0) ? settings.heroStats : [
    { value: '20+', label: 'PRO PLAYERS', numericEnd: 20, suffix: '+', visible: true, position: 0, icon: '🎮' },
    { value: '50+', label: 'TOURNAMENTS', numericEnd: 50, suffix: '+', visible: true, position: 1, icon: '🏆' },
    { value: '78%', label: 'WIN RATE', numericEnd: 78, suffix: '%', visible: true, position: 2, icon: '🏅' },
    { value: '15', label: 'TITLES', numericEnd: 15, suffix: '', visible: true, position: 3, icon: '👥' },
  ];

  const processedStats = rawStats
    .filter(s => s.visible !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(s => {
      let val = s.value;
      let numEnd = s.numericEnd;
      const lbl = (s.label || '').toLowerCase();
      if (!val || val === '00' || val === '0' || val === '-') {
        if (lbl.includes('player')) {
          numEnd = realPlayers > 0 ? realPlayers : 20;
          val = `${numEnd}+`;
        } else if (lbl.includes('tournament')) {
          numEnd = realTournaments > 0 ? realTournaments : 50;
          val = `${numEnd}+`;
        } else if (lbl.includes('win')) {
          numEnd = calculatedWinRate;
          val = `${numEnd}%`;
        } else if (lbl.includes('title')) {
          numEnd = realTitles > 0 ? realTitles : 15;
          val = `${numEnd}`;
        }
      }
      return {
        ...s,
        value: val,
        numericEnd: numEnd
      };
    });

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080808]">

      {/* Three.js 3D background — admin can disable particles */}
      {settings.bgParticlesEnabled !== false && <ThreeBackground settings={settings} />}

      {/* Hero video overlay (if set) — opacity controlled by admin */}
      {heroVideo && (
        <>
          <video
            ref={videoRef}
            src={getImageUrl(heroVideo)}
            className="absolute inset-0 w-full h-full object-cover z-[1]"
            style={{ opacity: settings.heroOverlayOpacity ?? 0.15 }}
            autoPlay muted loop playsInline
          />
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
        </>
      )}

      {/* Gradient overlays — DB-controlled glow intensity */}
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 70% 50% at 50% 0%, rgba(212,175,55,${settings.bgGlowEnabled !== false ? (settings.bgOverlayOpacity ?? 0.07) : 0}) 0%, transparent 60%),
          radial-gradient(ellipse 100% 40% at 50% 100%, rgba(8,8,8,0.95) 0%, transparent 70%)
        `
      }} />

      {/* Diagonal grid */}
      <div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden opacity-[0.06]">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="absolute bg-gold/30"
            style={{ left: `${i * 8}%`, top: 0, bottom: 0, width: '1px', transform: 'skewX(-15deg)' }} />
        ))}
      </div>

      {/* Gold scanline */}
      <div className="absolute top-0 left-0 right-0 h-px z-[5] bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="absolute top-px left-0 right-0 h-px z-[5] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* ── Hero content ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto w-full">

        {/* Pre-badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/70" />
          <span className="text-[11px] font-black tracking-[0.45em] uppercase text-gold/90">
            {settings.heroBadgeText || 'Professional Esports Organization'}
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/70" />
        </motion.div>

        {/* Logo */}
        {settings.logo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <Image
              src={settings.logo}
              alt={name}
              objectFit="contain"
              className="h-28 w-auto mx-auto drop-shadow-[0_0_50px_rgba(212,175,55,0.5)] object-contain"
            />
          </motion.div>
        )}

        {/* Main heading */}
        <div className="overflow-hidden mb-5">
          <motion.h1
            initial={{ y: 140, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-8xl lg:text-[115px] font-black tracking-widest leading-none"
          >
            <span className="text-white drop-shadow-[0_0_60px_rgba(255,255,255,0.08)]">{firstName} </span>
            {rest && (
              <span style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 40%, #b8960c 70%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 35px rgba(212,175,55,0.6))',
              }}>
                {rest}
              </span>
            )}
          </motion.h1>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-sm md:text-base font-bold tracking-[0.55em] text-gray-400 uppercase mb-10"
        >
          {settings.tagline || 'Born to Win. Built to Dominate.'}
        </motion.p>

        {/* Countdown — fully DB-driven, hidden unless admin enables */}
        <TournamentCountdown settings={settings} />

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap gap-4 justify-center items-center"
        >
          {canJoin && (
            <a
              href="/join"
              className="group relative px-10 py-4 text-sm font-black tracking-widest uppercase text-black overflow-hidden rounded-sm transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] focus:outline-none focus:ring-2 focus:ring-gold/60"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}
              aria-label="Join the team"
            >
              <span className="relative z-10">⚔️ JOIN TEAM</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
            </a>
          )}
          {canTournaments && (
            <a
              href="/tournaments"
              className="group px-10 py-4 text-sm font-black tracking-widest uppercase text-gold rounded-sm border border-gold/50 hover:border-gold hover:bg-gold/8 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold/40"
              style={{ boxShadow: '0 0 20px rgba(212,175,55,0.12)' }}
              aria-label="Register for a tournament"
            >
              🏆 REGISTER FOR TOURNAMENT
            </a>
          )}
          {canPlayerLogin && (
            <a
              href="/player-login"
              className="group px-10 py-4 text-sm font-black tracking-widest uppercase text-white/80 rounded-sm border border-white/20 hover:border-white/50 hover:text-white transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Player Login"
            >
              👤 PLAYER LOGIN
            </a>
          )}
          {canDashboard && (
            <a
              href="/dashboard"
              className="group px-10 py-4 text-sm font-black tracking-widest uppercase text-white/80 rounded-sm border border-white/20 hover:border-white/50 hover:text-white transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Dashboard"
            >
              📊 DASHBOARD
            </a>
          )}
          {canLive && (
            <a
              href="/live"
              className="group px-10 py-4 text-sm font-black tracking-widest uppercase text-white/60 rounded-sm border border-white/10 hover:border-white/30 hover:text-white transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Watch live matches"
            >
              ▶ {settings.heroCtaLiveLabel || 'WATCH MATCHES'}
            </a>
          )}
        </motion.div>

        {/* Dynamic CTAs */}
        {settings?.ctaEnabled !== false && db?.ctas && db.ctas.filter(c => c.enabled).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-6 flex flex-wrap gap-4 justify-center items-center max-w-4xl mx-auto px-4"
          >
            {db.ctas
              .filter(c => c.enabled)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map(cta => {
                const isSafeUrl = cta.url && (cta.url.startsWith('http://') || cta.url.startsWith('https://'));
                if (!isSafeUrl) return null;
                return (
                  <a
                    key={cta.id}
                    href={cta.url}
                    target={cta.openInNewTab ? '_blank' : '_self'}
                    rel={cta.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="group relative px-8 py-3.5 text-xs md:text-sm font-black tracking-widest uppercase text-white overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center gap-3 border border-yellow-500/40 bg-black/60 backdrop-blur-md"
                    style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}
                    aria-label={cta.title}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-2">
                      <span>{cta.title}</span>
                      <span className="text-yellow-400 font-bold px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-[11px]">
                        {cta.buttonText} {cta.openInNewTab ? '↗' : '→'}
                      </span>
                    </span>
                  </a>
                );
              })}
          </motion.div>
        )}

        {/* Stats bar */}
        {canHeroStats && processedStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6"
          >
            {processedStats.map((stat, i, arr) => (
              <div key={`stat-${i}-${stat.numericEnd ?? stat.value}-${stat.suffix ?? ''}`} className="flex items-center gap-12">
                <CountUpStat
                  numericEnd={stat.numericEnd}
                  suffix={stat.suffix}
                  value={stat.value}
                  label={stat.label}
                  icon={stat.icon}
                />
                {/* Vertical divider between stats (not after last) */}
                {i < arr.length - 1 && (
                  <div className="h-10 w-px hidden sm:block"
                    style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.3), transparent)' }} />
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Hero Ad */}
        {heroAd?.imageUrl && (
          <div className="mt-14">
            <a href={heroAd.link} target="_blank" rel="noopener noreferrer">
              <Image src={heroAd.imageUrl} alt="Advertisement"
                objectFit="contain"
                className="mx-auto max-w-2xl w-full rounded-sm opacity-60 hover:opacity-90 transition-opacity" />
            </a>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-black tracking-[0.4em] text-gray-700 uppercase">Scroll</span>
          <div className="w-5 h-8 border border-gold/30 rounded-full flex items-start justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1 h-2 bg-gold rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
