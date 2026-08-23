---
name: SBG ARMY Hero Three.js 3D Scene
description: HeroSection uses Three.js for 3D background with WebGL availability check and CSS fallback
---

## Rule
Always check WebGL availability before creating THREE.WebGLRenderer. Fall back to CSSParticleBackground if unavailable.

## Why
Server-side rendering environments, headless browsers (Replit preview), and some mobile devices don't support WebGL. Without the check, the component throws and breaks the entire hero.

## How to apply
- `isWebGLAvailable()` tests canvas.getContext('webgl') before entering Three.js path
- `ThreeBackground` state: `webglFailed` — if true, renders `<CSSParticleBackground />`
- Try-catch around `new THREE.WebGLRenderer(...)` as secondary guard
- Cloned MeshBasicMaterial instances must be disposed individually in cleanup (not just wireMat)
- `three` package installed in sbg-army/package.json as dependency (not devDependency)
