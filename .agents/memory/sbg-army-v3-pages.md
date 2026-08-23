---
name: SBG ARMY V3 DB-driven pages & admin CMS
description: All DB-driven public pages, CMS admin modules, and deployment setup built across V3 sessions.
---

## DB-driven Public Pages
- `GalleryPage.tsx` → `/gallery` — reads `db.gallery`, filter + lightbox
- `CookiePolicyPage.tsx` → `/cookie-policy` — reads `db.settings.legalPages?.cookies`
- `AboutPage.tsx` → `/about` — fully DB-driven from `db.about`
- `PrivacyPolicyPage.tsx` / `TermsPage.tsx` — DB-driven via `db.settings.legalPages`

## Admin CMS Modules (all real CRUD)
- `AdminAbout.tsx` — tabbed (General/Stats/Timeline/Values)
- `AdminLegalPages.tsx` — Privacy/Terms/Cookie
- `AdminEvents.tsx` — full CRUD for `weeklyEvents`; status filter; search
- `AdminRankings.tsx` — full CRUD for `leaderboard` collection; auto KD+score
- `AdminCustomCode.tsx` — HTML/CSS/JS snippet manager; Super Admin only; backup+rollback; live preview; validation
- `AdminFeatures.tsx` — homepage section toggles + page enable/disable (feature flags)
- `AdminSettings.tsx` — tabs: Brand, Theme, Hero, Footer, SEO, Stats, Loading, Social, Contact, Maintenance, Backup

## Feature Flags wiring
- `App.tsx` uses `FeatureRoute` component — reads `db.features.pages[key]`, redirects to `/` when disabled
- `HomePage.tsx` already uses `show(key)` helper for section-level flags
- All 13 flaggable pages wired: shop, tournaments, leaderboards, events, blog, hallOfFame, live, join, community, fanConnect, giveaways, collaborate, achievements, playerPortal

## Site-wide Effects (SiteEffects.tsx)
- Injected at App root (inside WouterRouter), returns null
- SEO: keeps `<title>`, `<meta name="description">`, `<meta name="keywords">`, OG tags, Twitter cards in sync with `db.settings`
- Custom Code: injects enabled snippets — CSS → single `<style id="sbg-custom-css">`, JS → per-snippet `<script>`, HTML → `<div id="sbg-custom-html">`
- Analytics: injects GA/GTM `<script>` once when `settings.analyticsId` is set
- Re-applies on every `sbg-db-updated` custom event

## Settings Interface fields added (database.ts)
- `footerCopyright?: string`
- `seoKeywords?: string`
- `heroVideoUrl?: string`, `heroImageUrl?: string`
- `heroCtaJoinLabel`, `heroCtaTournamentLabel`, `heroCtaLiveLabel`
- `navBadgeText?: string`, `footerText?: string`, `footerQuickLinksTitle`, `footerExploreTitle`
- `metaTitle`, `metaDescription`, `seoOgImage`, `analyticsId`

## Hardcoded text removed
- `Footer.tsx` — "Official Platform", "Quick Links", "Explore", "Official Support", "Built for competitive excellence", "All rights reserved." all CMS-driven
- `Navbar.tsx` — "OFFICIAL PLATFORM" now uses `settings.navBadgeText`
- `HeroSection.tsx` — "Professional Esports Organization" uses `settings.heroBadgeText`

## JWT Session Refresh (no more 8-hour logout)
- `admin_auth.ts` — `POST /admin/refresh` endpoint; verifies existing JWT, issues fresh 8h token; 60 req/min rate limit
- `AdminGuard.tsx` — 6-hour interval refresh + visibilitychange trigger; forces re-login if refresh fails

## Leaderboard Collection
- Added `leaderboard: unknown[]` and `customCode: unknown[]` to Database interface and DEFAULT_DB
- Both in `ALL_COLLECTIONS` (frontend) and `COLLECTIONS` (backend store.ts)

## Deployment
- `DEPLOYMENT.md` (root) — full guide with all 12 Q&A answers
- `render.yaml` — one-click Render deploy config (Singapore region, persistent disk)
- `artifacts/api-server/DEPLOYMENT.md` — Render-specific guide
- `artifacts/sbg-army/DEPLOYMENT.md` — Vercel split-deploy guide
- Existing `artifacts/sbg-army/vercel.json` — already correct; no changes needed

**Why:** Single-service Render deploy is simplest — API server builds frontend during deploy and serves it as static files. No CORS config needed.
