# Feature Roadmap & Version History
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Version History

### V1.0 — Foundation (Q1 2025)

**Theme:** _Core infrastructure and basic web presence_

**Released Features:**
- ✅ React + Vite frontend scaffolding
- ✅ Express API server with JSON database
- ✅ Basic admin login (bcrypt + JWT)
- ✅ Player CRUD (name, game, role, image)
- ✅ Team CRUD (name, game, logo)
- ✅ News articles (create, publish)
- ✅ Public homepage with static hero
- ✅ Basic news feed
- ✅ Sponsor listings
- ✅ Contact form (stores to DB)
- ✅ Responsive mobile layout
- ✅ Tailwind CSS + shadcn/ui component system
- ✅ Wouter routing

**Technical debt acknowledged:**
- No real-time sync (page refresh required to see updates)
- No file upload system (image URLs entered manually)
- No rate limiting on auth endpoints

---

### V2.0 — Platform Expansion (Q2–Q3 2025)

**Theme:** _Tournament engine, real-time sync, and content richness_

**Released Features:**
- ✅ WebSocket real-time database sync (`wsClient.ts` + server broadcast)
- ✅ IndexedDB client-side caching (`idb-keyval`)
- ✅ Tournament management system
  - Tournament creation with game, format, dates
  - Registration form with UPI QR payment
  - Payment screenshot upload and admin verification
  - Bracket generation (single elimination)
  - Room ID distribution to approved teams
- ✅ Match manager (scheduling, live scores, results)
- ✅ File upload system (multer, `POST /api/upload`)
- ✅ Gallery manager with image upload
- ✅ Three.js hero section with WebGL detection + CSS fallback
- ✅ Framer Motion page transitions and section animations
- ✅ Hall of Fame with achievements and milestones
- ✅ Weekly events calendar
- ✅ Giveaway system (basic)
- ✅ Fan message board
- ✅ Shop product listings
- ✅ Recruitment application form
- ✅ Analytics tracking (page visits)
- ✅ Navigation menu builder
- ✅ Feature flags system
- ✅ Dynamic theme injection (CSS custom properties from settings)
- ✅ Founders and creators sections
- ✅ Staff accounts with per-module permissions
- ✅ Community page
- ✅ Live stream embed page

**Bug fixes from V1:**
- Added rate limiting to auth endpoints
- Fixed CORS for production deployments
- Implemented proper error states in admin panel

---

### V3.0 — CMS & Security Hardening (Q4 2025 – Q2 2026) ← **Current**

**Theme:** _Content management, security, and operational stability_

**Released Features:**
- ✅ Full CMS-driven pages:
  - About page (CMS-editable sections)
  - Privacy Policy page (legal CMS)
  - Terms of Service page (legal CMS)
  - Cookie Policy page (legal CMS)
  - Gallery with admin-managed categories
- ✅ AboutCMS admin module (timeline, values, statistics)
- ✅ LegalPages admin module (rich text editor)
- ✅ JWT auto-refresh endpoint (`POST /api/admin/refresh`)
- ✅ AdminGuard auto-refresh every 20 minutes
- ✅ Custom code injection module (CSS/JS, super_admin only)
- ✅ `POST /api/db` now requires admin authentication (was public)
- ✅ `GET /api/backup` and `POST /api/restore` now auth-protected
- ✅ Admin links stripped from public-facing output (`mergeSensitive()`)
- ✅ Body size limit increased to 10MB
- ✅ Password stripping bug fixed in staff account responses
- ✅ `SESSION_SECRET` fails-closed on startup
- ✅ URL sanitization utilities (prevent javascript: XSS)
- ✅ WS stale-tab bulk-save bug fixed (reconnect re-sync guard)
- ✅ Activity log module (audit trail for admin actions)
- ✅ Extended Player interface (stats, social links, country)
- ✅ Extended Sponsor interface (tiers, date range)
- ✅ Tournament registration stats rendering guard
- ✅ Footer navigation prop support
- ✅ `customCode` collection added to `ALL_COLLECTIONS`
- ✅ Collab request inbox
- ✅ tnmt_* collections for standalone tournament site

**Security fixes:**
- Rate limiting on all auth endpoints
- CORS restricted to configured origin in production
- Sensitive fields stripped from all API responses
- Request body size enforcement

---

## 2. Upcoming Releases

### V3.1 — Stability & Polish (Q3 2026)

**Theme:** _Bug fixes, UX improvements, and missing small features_

**Planned:**
- 🔲 DOMPurify integration for CMS HTML content (security)
- 🔲 Lighthouse score optimization (target: 90+ performance)
- 🔲 Article rich text editor (Tiptap or Quill)
- 🔲 Search functionality on public player/news pages
- 🔲 Tournament bracket display on public site
- 🔲 Match result history page
- 🔲 PWA manifest and service worker
- 🔲 Automated daily database backup (cron)
- 🔲 Pre-restore snapshot before DB restore
- 🔲 Admin activity log persistence to disk (not in-memory)
- 🔲 Email notification on new contact/recruitment form (EmailJS)
- 🔲 Image lazy loading optimization
- 🔲 Error boundaries on all public page sections
- 🔲 Keyboard navigation audit for admin panel
- 🔲 ARIA improvements for screen reader support

**Bug fixes in scope:**
- Gallery image ordering (drag-and-drop save)
- Tournament registration duplicate detection edge cases
- Mobile admin sidebar close on navigation

---

### V4.0 — Community & Monetization (Q4 2026 – Q1 2027)

**Theme:** _Fan authentication, shop fulfillment, and growth features_

**Planned Features:**

#### 4.1 Fan Authentication (Supabase)
- Player/fan account creation (email + password)
- Claim own player profile
- Personal stats dashboard
- Favourite team tracking
- Tournament registration with saved profile

#### 4.2 Full Shop
- Shopping cart
- Checkout flow (payment gateway integration)
- Order management for admins
- Inventory tracking with low-stock alerts
- Order status email notifications
- Discount codes / promo system

#### 4.3 Push Notifications (PWA)
- Subscribe to tournament updates
- Match result notifications
- New article notifications
- Giveaway start/end notifications
- Admin can send targeted push notifications

#### 4.4 Advanced Analytics
- User session tracking (anonymized)
- Cohort analysis
- Content performance (article read time, scroll depth)
- Tournament funnel (views → registrations → approvals)
- Revenue analytics (when shop live)
- Export analytics to CSV

#### 4.5 Enhanced Tournament Engine
- Double elimination bracket
- Round robin format
- Group stage + knockout
- Seeding system
- Head-to-head statistics
- Automated bracket progression (admin confirms match results)

#### 4.6 Player Profiles (Public)
- Dedicated `/players/:id` route
- Full career statistics
- Tournament history
- Achievement badges
- Social embed card (OG tags)

---

### V5.0 — Enterprise Scale (Q2–Q3 2027)

**Theme:** _Database migration, microservices, multi-org support_

#### 5.1 PostgreSQL Migration
- Replace JSON flat-file with PostgreSQL
- Zero downtime migration script
- Database abstraction layer (drop-in replacement)
- Full-text search on players, news, teams
- Proper transactions and referential integrity
- Read replicas for analytics queries

#### 5.2 Redis Integration
- Session caching
- WebSocket pub/sub for horizontal scaling
- Rate limiting shared state
- Analytics event queuing

#### 5.3 File Storage Migration
- AWS S3 or Cloudflare R2 for media files
- Automatic image resizing/optimization on upload (Sharp)
- CDN delivery for all media
- Image format conversion to WebP

#### 5.4 Multi-Organization Support
- White-label mode for other esports orgs
- Organization-level admin isolation
- Shared infrastructure, isolated data
- Custom domain per org
- Pricing tiers (Starter, Pro, Enterprise)

#### 5.5 Native Mobile App
- React Native cross-platform app
- iOS and Android distribution
- Deep linking from web to app
- Native push notifications
- Offline tournament bracket viewing

#### 5.6 Streaming Integration
- Direct YouTube Data API integration
- Twitch API for live viewer counts
- Auto-detect when org is live streaming
- Live match overlay sync with stream
- VOD archive with match timestamps

#### 5.7 CI/CD Pipeline
- GitHub Actions full pipeline
- Automated testing on PR
- Staging environment auto-deploy
- Production deploy on merge to main
- Automated database migration runs
- Rollback automation

---

## 3. Feature Backlog (Unscheduled)

| Feature | Description | Priority |
|---------|-------------|----------|
| Discord Bot | Post match results, announce tournaments to Discord | High |
| Bracket Embed | Embeddable tournament bracket widget | High |
| Season System | Seasonal rankings, points tables, promotions | High |
| Player Trading | Internal transfer system between teams | Medium |
| Scouting Tool | Admin tool to tag and track potential recruits | Medium |
| Press Kit Page | Auto-generated downloadable press kit | Medium |
| API v2 | Versioned public API with docs | Medium |
| Multilingual | Internationalization (i18n) support | Medium |
| Dark/Light Theme | User-toggleable theme | Low |
| Twitch Clips | Auto-embed team Twitch clip highlights | Low |
| Fantasy League | Fan fantasy team building | Low |
| Merchandise Design Tool | Community jersey design voting | Low |

---

## 4. Deprecation Notices

| Feature | Status | Replacement | Deadline |
|---------|--------|-------------|----------|
| JSON flat-file database | Maintained | PostgreSQL (V5.0) | Q2 2027 |
| Local file uploads | Maintained | S3/R2 (V5.0) | Q2 2027 |
| Single-server WS | Maintained | Redis pub/sub (V5.0) | Q2 2027 |
| Supabase auth (secondary) | Deprecated | Native auth system (V4.0) | Q1 2027 |

---

## 5. Breaking Changes Log

### V3.0 Breaking Changes
- `POST /api/db` now requires admin authentication (previously public)
  - **Impact:** Any external scripts writing to DB must include auth header
  - **Migration:** Obtain admin token and add `Authorization: Bearer <token>` header

### V2.0 Breaking Changes
- Database schema: `players` collection now requires `status` field
  - **Migration:** Run `db.players.forEach(p => p.status = p.status || 'active')`

---

*Roadmap v3.0 — SBG ARMY Esports Platform — July 2026*
