import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Helper to generate a luminous glowing round particle sprite */
function createSmallGlowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(255, 215, 0, 0.95)');
    grad.addColorStop(0.55, 'rgba(255, 107, 0, 0.4)');
    grad.addColorStop(0.85, 'rgba(212, 175, 55, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function Global3DParticles() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isMobile = window.innerWidth < 768;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040404, 0.02);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 150);
    camera.position.set(0, 0, 30);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
        precision: 'mediump',
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Apply GPU-accelerated styling directly to the canvas element
    const canvas = renderer.domElement;
    canvas.style.transform = 'translate3d(0, 0, 0)';
    canvas.style.backfaceVisibility = 'hidden';
    canvas.style.willChange = 'transform';
    el.appendChild(canvas);

    // Fade in smoothly
    requestAnimationFrame(() => {
      if (el) {
        el.style.opacity = '0.85';
      }
    });

    const glowTexture = createSmallGlowTexture();

    // ── 1. Global Ambient 3D Micro-Particles ─────────────────────────────────
    const COUNT = isMobile ? 30 : 60;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);

    const gold = new THREE.Color('#d4af37');
    const brightGold = new THREE.Color('#ffd700');
    const flame = new THREE.Color('#ff6b00');
    const cyan = new THREE.Color('#38bdf8');
    const white = new THREE.Color('#ffffff');

    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 35;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      speeds[i] = 0.004 + Math.random() * 0.009;
      sizes[i] = 0.1 + Math.random() * 0.2;

      const rnd = Math.random();
      let c: THREE.Color;
      if (rnd > 0.92) c = white;
      else if (rnd > 0.80) c = cyan;
      else if (rnd > 0.55) c = brightGold;
      else if (rnd > 0.30) c = flame;
      else c = gold;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: isMobile ? 0.15 : 0.2,
      map: glowTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geo, mat);
    scene.add(particleSystem);

    // ── 2. Interactive 3D Click Sparks & Cursor Trails (Zero GC Object Pool) ──
    const SPARK_POOL_SIZE = isMobile ? 60 : 120;
    const sparkPositions = new Float32Array(SPARK_POOL_SIZE * 3);
    const sparkVelocities = new Float32Array(SPARK_POOL_SIZE * 3);
    const sparkColors = new Float32Array(SPARK_POOL_SIZE * 3);
    const sparkLives = new Float32Array(SPARK_POOL_SIZE); // 0 = dead, >0 = active

    // Hide all sparks initially far off-screen
    for (let i = 0; i < SPARK_POOL_SIZE; i++) {
      sparkPositions[i * 3] = 9999;
      sparkPositions[i * 3 + 1] = 9999;
      sparkPositions[i * 3 + 2] = 9999;
      sparkLives[i] = 0;
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: isMobile ? 0.25 : 0.35,
      map: glowTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const sparkSystem = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkSystem);

    let nextSparkIdx = 0;

    // Convert Screen (X, Y) to 3D World coordinates at Z=0
    const screenToWorld = (screenX: number, screenY: number, targetZ = 0) => {
      const ndcX = (screenX / window.innerWidth) * 2 - 1;
      const ndcY = -(screenY / window.innerHeight) * 2 + 1;
      const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = (targetZ - camera.position.z) / dir.z;
      return camera.position.clone().add(dir.multiplyScalar(distance));
    };

    // Spawn 3D click explosion burst
    const triggerClickSparks = (x: number, y: number) => {
      const worldPos = screenToWorld(x, y, 0);
      const burstCount = isMobile ? 12 : 24;

      for (let i = 0; i < burstCount; i++) {
        const idx = nextSparkIdx;
        nextSparkIdx = (nextSparkIdx + 1) % SPARK_POOL_SIZE;

        sparkPositions[idx * 3] = worldPos.x;
        sparkPositions[idx * 3 + 1] = worldPos.y;
        sparkPositions[idx * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 1.5;

        // Radial 3D burst velocity
        const angle = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.08 + Math.random() * 0.22;

        sparkVelocities[idx * 3] = Math.sin(phi) * Math.cos(angle) * speed;
        sparkVelocities[idx * 3 + 1] = Math.sin(phi) * Math.sin(angle) * speed + 0.04;
        sparkVelocities[idx * 3 + 2] = Math.cos(phi) * speed;

        sparkLives[idx] = 1.0; // full life

        // Color mix
        const rnd = Math.random();
        let c: THREE.Color;
        if (rnd > 0.75) c = white;
        else if (rnd > 0.45) c = brightGold;
        else if (rnd > 0.2) c = flame;
        else c = cyan;

        sparkColors[idx * 3] = c.r;
        sparkColors[idx * 3 + 1] = c.g;
        sparkColors[idx * 3 + 2] = c.b;
      }
    };

    // Emit gentle cursor trailing embers
    let lastTrailTime = 0;
    const triggerCursorTrail = (x: number, y: number) => {
      const now = performance.now();
      if (now - lastTrailTime < 35) return; // throttle emission
      lastTrailTime = now;

      const worldPos = screenToWorld(x, y, 0);
      const idx = nextSparkIdx;
      nextSparkIdx = (nextSparkIdx + 1) % SPARK_POOL_SIZE;

      sparkPositions[idx * 3] = worldPos.x + (Math.random() - 0.5) * 0.4;
      sparkPositions[idx * 3 + 1] = worldPos.y + (Math.random() - 0.5) * 0.4;
      sparkPositions[idx * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 0.8;

      sparkVelocities[idx * 3] = (Math.random() - 0.5) * 0.03;
      sparkVelocities[idx * 3 + 1] = 0.02 + Math.random() * 0.04; // drift upward
      sparkVelocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.03;

      sparkLives[idx] = 0.7;

      const rnd = Math.random();
      const c = rnd > 0.6 ? brightGold : rnd > 0.3 ? gold : flame;
      sparkColors[idx * 3] = c.r;
      sparkColors[idx * 3 + 1] = c.g;
      sparkColors[idx * 3 + 2] = c.b;
    };

    // ── Mouse, Touch & Click Listeners ───────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let scrollY = window.scrollY;
    let targetScrollY = scrollY;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
      if (!isMobile) {
        triggerCursorTrail(e.clientX, e.clientY);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      triggerClickSparks(e.clientX, e.clientY);
    };

    const onScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      if (!mountRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── LERP (Linear Interpolation) Helpers ─────────────────────────────────
    // Frame-rate independent exponential lerp factor: 1 - e^(-decay * dt)
    const getLerpFactor = (decayRate: number, dtSeconds: number) => {
      return 1 - Math.exp(-decayRate * Math.max(0.001, dtSeconds));
    };

    // ── GPU-Synced requestAnimationFrame Loop ────────────────────────────────
    let frameId: number | null = null;
    let isVisible = true;
    let lastTime = performance.now();
    let t = 0;

    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    // Target positions buffer for ambient particles to allow smooth LERP transitions
    const targetAmbientY = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      targetAmbientY[i] = positions[i * 3 + 1];
    }

    const sparkPosAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
    const sparkPosArr = sparkPosAttr.array as Float32Array;

    const animate = (currentTime: number) => {
      if (!isVisible) return;
      frameId = requestAnimationFrame(animate);

      // Frame rate independent delta time clamped to prevent spike explosions
      const delta = Math.min((currentTime - lastTime) / 1000, 0.08);
      lastTime = currentTime;
      const deltaFactor = delta * 60;
      t += 0.005 * deltaFactor;

      // Exponential LERP factors for smooth interpolation during load spikes
      const mouseLerp = getLerpFactor(3.5, delta);
      const scrollLerp = getLerpFactor(4.0, delta);
      const cameraLerp = getLerpFactor(3.0, delta);
      const particleLerp = getLerpFactor(5.0, delta);

      // Smooth mouse follow & scroll damping using LERP
      targetX += (mouseX - targetX) * mouseLerp;
      targetY += (mouseY - targetY) * mouseLerp;
      scrollY += (targetScrollY - scrollY) * scrollLerp;

      // Rotate ambient group gently in 3D space with LERP smoothing
      const targetRotY = t * 0.03 + targetX * 0.12;
      const targetRotX = Math.sin(t * 0.5) * 0.04 + targetY * 0.08;
      particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * mouseLerp;
      particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * mouseLerp;

      // Upward floating motion for ambient particles with LERP position updates
      const step = isMobile ? 3 : 1;
      for (let i = 0; i < COUNT; i += step) {
        const idx = i * 3;
        targetAmbientY[i] += speeds[i] * deltaFactor;

        // Wrap around height boundary
        if (targetAmbientY[i] > 25) {
          targetAmbientY[i] = -25;
          posArr[idx + 1] = -25;
        }

        // LERP particle Y position smoothly towards target
        posArr[idx + 1] += (targetAmbientY[i] - posArr[idx + 1]) * particleLerp;

        // Subtle sine wave displacement in X and Z
        const targetXDisplacement = Math.sin(t + i) * 0.4;
        const currentX = posArr[idx];
        const baseX = positions[idx];
        posArr[idx] += (baseX + targetXDisplacement - currentX) * (0.05 * deltaFactor);
      }
      posAttr.needsUpdate = true;

      // Update 3D Click & Trail Sparks with LERP drag and ballistic physics
      let hasActiveSparks = false;
      const sparkDragFactor = Math.pow(0.94, deltaFactor);

      for (let i = 0; i < SPARK_POOL_SIZE; i++) {
        if (sparkLives[i] > 0) {
          hasActiveSparks = true;
          sparkLives[i] -= 0.024 * deltaFactor; // fade out life

          const idx = i * 3;
          // Interpolate positions based on velocities
          sparkPosArr[idx] += sparkVelocities[idx] * deltaFactor;
          sparkPosArr[idx + 1] += sparkVelocities[idx + 1] * deltaFactor;
          sparkPosArr[idx + 2] += sparkVelocities[idx + 2] * deltaFactor;

          // Drag LERP and slight gravity decay
          sparkVelocities[idx] *= sparkDragFactor;
          sparkVelocities[idx + 1] *= sparkDragFactor;
          sparkVelocities[idx + 1] -= 0.002 * deltaFactor;
          sparkVelocities[idx + 2] *= sparkDragFactor;

          if (sparkLives[i] <= 0) {
            sparkLives[i] = 0;
            sparkPosArr[idx] = 9999;
            sparkPosArr[idx + 1] = 9999;
            sparkPosArr[idx + 2] = 9999;
          }
        }
      }

      if (hasActiveSparks) {
        sparkPosAttr.needsUpdate = true;
      }

      // Camera parallax LERP reacting to scroll depth & cursor
      const targetCamX = targetX * 1.8;
      const targetCamY = targetY * 1.2 - (scrollY * 0.004);
      camera.position.x += (targetCamX - camera.position.x) * cameraLerp;
      camera.position.y += (targetCamY - camera.position.y) * cameraLerp;
      camera.lookAt(0, -scrollY * 0.004, 0);

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

    // ── Viewport & Visibility Tracking (IntersectionObserver) ─────────────────
    let isIntersecting = true;

    const updateVisibility = () => {
      const shouldBeVisible = isIntersecting && document.visibilityState === 'visible';
      if (shouldBeVisible !== isVisible) {
        isVisible = shouldBeVisible;
        if (isVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.01 }
    );
    observer.observe(el);

    const onVisibilityChange = () => {
      updateVisibility();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    startAnimation();

    return () => {
      stopAnimation();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      glowTexture.dispose();
      geo.dispose();
      mat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      id="global-3d-particles"
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-[1] opacity-0 transition-opacity duration-1000 transform-gpu translate-z-0 backface-hidden"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'opacity, transform',
      }}
      aria-hidden="true"
    />
  );
}
