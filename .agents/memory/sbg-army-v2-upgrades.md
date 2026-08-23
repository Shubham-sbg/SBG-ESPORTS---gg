---
name: SBG ARMY V2 upgrade decisions
description: Key architectural decisions from the major UI/UX/security/monitoring upgrade round
---

## URL sanitization — critical security pattern
Created `src/lib/sanitizeUrl.ts`. Use `sanitizeUrl(url)` before any admin/user-provided value goes into an `href`.
Only allows: http, https, mailto, tel, discord schemes + relative paths.
Applied to: Footer socials, SponsorsSection links, ContactPage social links, RosterSection social links.
**Why:** Admin-configurable URLs can contain `javascript:` URIs → XSS. Must sanitize at the render layer.
**How to apply:** Import `sanitizeUrl` from `@/lib/sanitizeUrl` and wrap any DB-sourced URL before use in `href`.

## Player extended profile fields (all optional)
`country`, `achievements[]`, `mvpCount`, `kdRatio`, `uid`, `socialInstagram`, `socialYoutube`, `socialFacebook`, `socialDiscord` added to Player interface.
AdminRoster form exposes all new fields. Achievements use a textarea (one per line → string[]).
**Why:** Required for premium player card display matching Team Liquid-level detail.

## Sponsor category system
`category?: 'main' | 'gold' | 'silver' | 'community'` on Sponsor interface.
SponsorsSection groups sponsors by tier with distinct sizing/color. AdminSponsors has category dropdown + description field.
Flat-grid fallback when no categories assigned (backward-compatible).

## Stats rendering guard (RosterSection)
Show stats row only when `player.kdRatio || (player.mvpCount > 0)`.
Default `mvpCount: 0` in admin form must NOT trigger empty stats container.

## HealthMonitor singleton design
`src/lib/healthMonitor.ts` is a true singleton exported as `healthMonitor`. Call `init()` once.
**Stores originals before monkey-patching:** `console.error`, `window.fetch`, event handlers.
**`destroy()` fully cleans up:** RAF loop (`cancelAnimationFrame`), all PerformanceObservers (`.disconnect()`), event listeners (stored handler refs), restores `console.error` and `window.fetch`.
**Why:** HMR in dev will re-import the module; without full teardown, duplicate patches accumulate across hot reloads.
**How to apply:** Only call `init()` once per page lifetime. Call `destroy()` on app teardown.

## PerformanceObserver durationThreshold workaround
TS lib.dom.d.ts doesn't include `durationThreshold` in `PerformanceObserverInit` for some targets.
Use: `inpObs.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit)`
**Why:** Valid browser API but missing from TS types in strict builds.

## Scheduled check async pattern
Scheduled runner `run(id, fn)` must be `async` and `await fn()` to reflect actual outcome in `chk.status`.
Synchronous wrapper showed `ok` before async completion, giving misleading status.

## New utility components
- `ScrollToTop.tsx` — fixed bottom-right button, appears after 500px scroll
- `OfflineDetector.tsx` — red banner when `navigator.onLine` is false
- `LoadingSkeleton.tsx` — `HomePageSkeleton` wired to HomePage loading state

## HeroSection CTA buttons
Updated to: ⚔️ JOIN TEAM (/join) / 🏆 REGISTER FOR TOURNAMENT (/tournaments) / ▶ WATCH MATCHES (/live)

## Admin System Health module
Admin page `system_health` module with 8 tabs: Overview, Error Log, Performance, Security, DB Integrity, AI Analyzer, Reports, Recovery.
Located at: `src/components/admin/AdminSystemHealth.tsx` + `src/lib/healthMonitor.ts`.
Wired in AdminPage.tsx under the SYSTEM group.
