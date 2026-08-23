# Product Requirements Document (PRD)
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Status:** Production | **Date:** July 2026  
> **Owner:** SBG ARMY Organization | **Classification:** Internal

---

## Table of Contents

1. [Vision & Mission](#1-vision--mission)
2. [Goals & Objectives](#2-goals--objectives)
3. [User Personas](#3-user-personas)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Complete Feature List](#7-complete-feature-list)
8. [Public Website Requirements](#8-public-website-requirements)
9. [Admin Panel Requirements](#9-admin-panel-requirements)
10. [Business Rules](#10-business-rules)
11. [User Flows](#11-user-flows)
12. [Wireframe Descriptions](#12-wireframe-descriptions)
13. [Success Metrics](#13-success-metrics)
14. [Product Roadmap](#14-product-roadmap)

---

## 1. Vision & Mission

### 1.1 Vision Statement

> *"To be the premier digital home for SBG ARMY esports — where fans, players, and partners converge in a seamlessly managed, professionally presented ecosystem."*

### 1.2 Mission Statement

SBG ARMY Esports Platform provides an all-in-one digital infrastructure for esports organization management. It empowers administrators to manage rosters, tournaments, content, and community engagement through a powerful control panel while simultaneously delivering an immersive, high-performance experience for fans and players through a stunning public website.

### 1.3 Problem Statement

Esports organizations typically rely on fragmented tools — Discord for communication, Google Sheets for rosters, Challonge for brackets, WordPress for news — creating operational silos, data inconsistency, and an unprofessional brand presence.

**SBG ARMY Platform solves this by:**
- Unifying all management functions into a single admin panel
- Providing a branded, animated public website that reflects professional esports identity
- Enabling real-time updates across all connected clients via WebSocket sync
- Eliminating third-party dependencies for core operations

---

## 2. Goals & Objectives

### 2.1 Business Goals

| Goal | KPI | Target |
|------|-----|--------|
| Establish brand presence | Monthly unique visitors | 10,000+ |
| Grow player roster | Registered players | 500+ |
| Tournament participation | Registrations per tournament | 100+ |
| Community engagement | Fan messages & contact submissions | 200+/month |
| Sponsor acquisition | Active sponsors displayed | 10+ |
| Operational efficiency | Admin tasks completed without external tools | 95% |

### 2.2 Product Objectives

1. **Operational Excellence** — All org data (players, teams, matches, tournaments) managed from a single admin panel
2. **Brand Authority** — Public website with high production value (Three.js animations, smooth transitions, mobile-first)
3. **Real-Time Transparency** — Live match scores, tournament brackets, and announcements update instantly
4. **Community Building** — Fan engagement through messages, recruitment, giveaways, and shop
5. **Scalability** — Architecture supports growing player base, more games, and expanding staff

---

## 3. User Personas

### 3.1 Persona A — The Esports Fan (Visitor)

| Attribute | Detail |
|-----------|--------|
| **Name** | Alex, 19 |
| **Role** | Public website visitor / fan |
| **Devices** | Primarily mobile (Android), secondary desktop |
| **Goals** | Follow the organization, track match results, view player profiles, buy merch |
| **Pain Points** | Outdated rosters on other platforms, no single source of truth, slow websites |
| **Tech Comfort** | High — daily social media, gaming platforms |

**Key needs:** Fast page loads, mobile-friendly design, live match updates, player/team info, news feed.

---

### 3.2 Persona B — The Competitive Player

| Attribute | Detail |
|-----------|--------|
| **Name** | Ravi, 22 |
| **Role** | Active player / potential recruit |
| **Devices** | Desktop (gaming PC), mobile |
| **Goals** | Track own stats, register for tournaments, apply for team membership |
| **Pain Points** | Complex registration flows, unclear team hierarchy, no stat tracking |
| **Tech Comfort** | Very high |

**Key needs:** Tournament registration, player profile visibility, match scheduling, recruitment application.

---

### 3.3 Persona C — The Team Manager / Coach

| Attribute | Detail |
|-----------|--------|
| **Name** | Sarah, 27 |
| **Role** | Team captain / coach |
| **Devices** | Desktop |
| **Goals** | Manage team roster, submit match results, view performance analytics |
| **Pain Points** | Manual roster updates, no centralized match log, communication gaps |
| **Tech Comfort** | High |

**Key needs:** Team management dashboard, match result submission, player stat access, notification system.

---

### 3.4 Persona D — The Super Administrator

| Attribute | Detail |
|-----------|--------|
| **Name** | Jordan, 30 |
| **Role** | Organization director / super admin |
| **Devices** | Desktop |
| **Goals** | Oversee entire org operations, manage staff, publish content, audit logs |
| **Pain Points** | No audit trail, multiple tools to manage, security concerns |
| **Tech Comfort** | High |

**Key needs:** Full admin panel access, activity logs, staff management, backup/restore, analytics.

---

### 3.5 Persona E — The Sponsor Partner

| Attribute | Detail |
|-----------|--------|
| **Name** | Corporate Marketing Manager |
| **Role** | Sponsor / brand partner |
| **Devices** | Desktop |
| **Goals** | Verify brand visibility, measure reach, professional partnership presentation |
| **Pain Points** | No visibility into platform metrics, unprofessional digital presence |
| **Tech Comfort** | Medium |

**Key needs:** Sponsor logo display, platform credibility, analytics access (read-only).

---

## 4. User Stories

### 4.1 Visitor Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| VS-01 | Visitor | See the organization homepage | I can understand who SBG ARMY is | Must Have |
| VS-02 | Visitor | View active player roster | I can follow my favorite players | Must Have |
| VS-03 | Visitor | See upcoming and past tournaments | I can track competitive events | Must Have |
| VS-04 | Visitor | Read latest news and updates | I stay informed about the org | Must Have |
| VS-05 | Visitor | View match schedule and results | I know when games are happening | Must Have |
| VS-06 | Visitor | Browse the org gallery | I see behind-the-scenes content | Should Have |
| VS-07 | Visitor | Visit the shop | I can purchase branded merchandise | Should Have |
| VS-08 | Visitor | Submit a contact message | I can get in touch with the org | Must Have |
| VS-09 | Visitor | View Hall of Fame | I learn about historic achievements | Should Have |
| VS-10 | Visitor | Watch live streams embedded | I can follow live competitive play | Should Have |
| VS-11 | Visitor | Apply for recruitment | I can try out for the team | Must Have |
| VS-12 | Visitor | View sponsor partners | I know who supports the org | Should Have |

### 4.2 Admin Stories

| ID | As an... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| AD-01 | Admin | Log in securely | I can access the control panel | Must Have |
| AD-02 | Admin | Add/edit/remove players | The roster stays current | Must Have |
| AD-03 | Admin | Create and manage tournaments | Competitive events are organized | Must Have |
| AD-04 | Admin | Publish news articles | Fans receive timely updates | Must Have |
| AD-05 | Admin | Upload images to gallery | Visual content is maintained | Must Have |
| AD-06 | Admin | Manage team rosters | Team compositions are accurate | Must Have |
| AD-07 | Admin | Configure site settings | Platform appearance is customizable | Must Have |
| AD-08 | Admin | View analytics dashboard | I understand platform performance | Should Have |
| AD-09 | Admin | Manage staff accounts | Access control is maintained | Must Have |
| AD-10 | Admin | Export/import database | Data can be backed up and restored | Must Have |
| AD-11 | Admin | Receive and manage recruitment apps | Talent pipeline is tracked | Should Have |
| AD-12 | Admin | Manage sponsor listings | Partners are properly featured | Must Have |
| AD-13 | Admin | View activity logs | Operations are auditable | Must Have |
| AD-14 | Admin | Manage match schedules | Schedule is always up to date | Must Have |
| AD-15 | Admin | Run giveaways | Community engagement is active | Could Have |
| AD-16 | Admin | Manage shop products | Merchandise is properly listed | Should Have |
| AD-17 | Admin | Configure navigation | Site menu structure is flexible | Must Have |

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| AUTH-01 | System shall provide secure admin login with username/password | Must |
| AUTH-02 | Passwords shall be hashed using bcrypt with minimum 12 salt rounds | Must |
| AUTH-03 | Successful login shall return a signed JWT token (RS256 or HS256) | Must |
| AUTH-04 | JWT tokens shall expire after a configurable period (default: 24h) | Must |
| AUTH-05 | A token refresh endpoint shall extend valid sessions | Must |
| AUTH-06 | Admin panel shall be completely inaccessible without a valid token | Must |
| AUTH-07 | System shall support role hierarchy: super_admin > admin > staff | Must |
| AUTH-08 | Staff accounts shall have granular per-module permissions | Must |
| AUTH-09 | First-run setup shall allow creating the initial super_admin account | Must |
| AUTH-10 | All auth failures shall be logged with IP, timestamp, and reason | Must |

### 5.2 Player Management

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| PLY-01 | Admin can create player profiles with name, game, role, stats | Must |
| PLY-02 | Player profiles shall support profile image upload | Must |
| PLY-03 | Players can be assigned to teams | Must |
| PLY-04 | Player status (active, inactive, retired) shall be trackable | Must |
| PLY-05 | Player social links (Twitter, YouTube, Twitch) shall be supported | Should |
| PLY-06 | Player win/loss statistics shall be displayed | Should |
| PLY-07 | Public player profile page shall be accessible without login | Must |

### 5.3 Team Management

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| TM-01 | Admin can create teams with name, game, logo, description | Must |
| TM-02 | Teams can have multiple players assigned | Must |
| TM-03 | Team captain/coach designation shall be supported | Should |
| TM-04 | Team history and season records shall be maintained | Should |
| TM-05 | Teams can be active or archived | Must |

### 5.4 Tournament Management

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| TRN-01 | Admin can create tournaments with name, game, date, format | Must |
| TRN-02 | Tournament registration shall be publicly accessible | Must |
| TRN-03 | Registration fee collection via UPI QR code screenshot submission | Must |
| TRN-04 | Admin can verify and approve payment screenshots | Must |
| TRN-05 | Tournament brackets shall be auto-generated from approved registrations | Must |
| TRN-06 | Match results shall be updatable in real-time | Must |
| TRN-07 | Room IDs and passwords shall be distributable to approved teams | Must |
| TRN-08 | Tournament public page shall display bracket, standings, schedule | Must |

### 5.5 Content Management

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| CMS-01 | Admin can create, edit, publish, and delete news articles | Must |
| CMS-02 | Articles shall support rich text, images, and categories | Must |
| CMS-03 | Gallery images shall be uploadable and categorizable | Must |
| CMS-04 | About page content shall be CMS-driven | Must |
| CMS-05 | Legal pages (Privacy, Terms, Cookie Policy) shall be CMS-driven | Must |
| CMS-06 | Homepage hero content (text, CTA) shall be configurable | Must |
| CMS-07 | Navigation menu items shall be configurable | Must |

### 5.6 Community Features

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| COM-01 | Public contact form shall send messages to admin inbox | Must |
| COM-02 | Recruitment application form shall collect player info | Must |
| COM-03 | Fan message board shall allow public submissions | Should |
| COM-04 | Giveaway system shall manage entries and winner selection | Could |
| COM-05 | Collaboration request form shall be available | Could |

### 5.7 Analytics

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| ANL-01 | Platform shall track page visits, unique visitors | Must |
| ANL-02 | Admin dashboard shall display visit trends as charts | Must |
| ANL-03 | Public analytics summary shall be available via API | Should |
| ANL-04 | Analytics data shall be retained for 90+ days | Should |

### 5.8 Real-Time Sync

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| RT-01 | All database changes shall be broadcast via WebSocket | Must |
| RT-02 | Admin panel clients shall reflect changes within 500ms | Must |
| RT-03 | Client shall reconnect automatically on WS disconnect | Must |
| RT-04 | Client shall re-sync full database state on reconnect | Must |
| RT-05 | Offline clients shall sync from IndexedDB cache | Should |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Req ID | Requirement | Target |
|--------|-------------|--------|
| PF-01 | Public homepage Time-to-Interactive | < 3 seconds on 4G |
| PF-02 | API endpoint response time (p95) | < 200ms |
| PF-03 | WebSocket message delivery latency | < 100ms |
| PF-04 | Image assets shall be compressed and optimized | < 200KB per image |
| PF-05 | Admin panel initial load | < 2 seconds |

### 6.2 Reliability

| Req ID | Requirement | Target |
|--------|-------------|--------|
| RL-01 | Platform uptime | 99.5% |
| RL-02 | Database backup frequency | Daily automatic |
| RL-03 | Recovery time objective (RTO) | < 4 hours |
| RL-04 | Recovery point objective (RPO) | < 24 hours |

### 6.3 Security

| Req ID | Requirement |
|--------|-------------|
| SC-01 | All admin routes must require valid JWT |
| SC-02 | All inputs must be sanitized to prevent XSS |
| SC-03 | Rate limiting must be applied to all auth endpoints |
| SC-04 | HTTPS must be enforced in production |
| SC-05 | Sensitive fields (passwords, tokens) must never be returned in API responses |
| SC-06 | CORS must be configured to allow only trusted origins |

### 6.4 Usability

| Req ID | Requirement |
|--------|-------------|
| UX-01 | Public website must be fully responsive (mobile-first) |
| UX-02 | Admin panel must function on 1280px+ screens |
| UX-03 | All interactive elements must have loading/error states |
| UX-04 | Forms must provide inline validation feedback |
| UX-05 | WebGL hero must gracefully degrade on unsupported devices |

### 6.5 Scalability

| Req ID | Requirement |
|--------|-------------|
| SCA-01 | Database layer must be replaceable with PostgreSQL without frontend changes |
| SCA-02 | API must be stateless (JWT-based) for horizontal scaling |
| SCA-03 | Frontend assets must be CDN-deployable |
| SCA-04 | System must support 500+ concurrent WebSocket connections |

### 6.6 Maintainability

| Req ID | Requirement |
|--------|-------------|
| MT-01 | Codebase must use TypeScript throughout |
| MT-02 | All components must be documented with JSDoc |
| MT-03 | Environment configuration must use .env files |
| MT-04 | Logging must capture all errors with stack traces |

---

## 7. Complete Feature List

### 7.1 Public Website Features

- ✅ Animated hero section (Three.js 3D / CSS particle fallback)
- ✅ Organization overview & mission statement
- ✅ Live player roster with profiles
- ✅ Team showcase with logos and game tags
- ✅ Tournament listings (upcoming, active, completed)
- ✅ Public tournament registration with payment
- ✅ Match schedule & live scoreboard
- ✅ News & announcements feed
- ✅ Photo & media gallery
- ✅ Hall of Fame with achievements and milestones
- ✅ Weekly events calendar
- ✅ Shop / merchandise browser
- ✅ Sponsor showcase
- ✅ Recruitment application form
- ✅ Fan message board
- ✅ Live stream embed (YouTube/Twitch)
- ✅ Community page
- ✅ Contact form
- ✅ About, Privacy, Terms, Cookie Policy pages (CMS-driven)
- ✅ PWA-ready (installable on mobile)
- ✅ SEO meta tags
- ✅ Cookie consent banner

### 7.2 Admin Panel Features

- ✅ Secure JWT login & session management
- ✅ Dashboard with analytics charts
- ✅ Player Manager (CRUD, images, stats, social links)
- ✅ Team Manager (CRUD, logos, rosters, history)
- ✅ Match Manager (schedule, results, live updates)
- ✅ Tournament Manager (create, brackets, registrations, payments)
- ✅ News CMS (create, publish, delete articles)
- ✅ Gallery Manager (upload, categorize, delete)
- ✅ Sponsor Manager (CRUD, logos, tiers)
- ✅ Recruitment Inbox (view, approve, reject applications)
- ✅ Contact Message Inbox
- ✅ Fan Messages Inbox
- ✅ Giveaway Manager
- ✅ Shop Manager (products, orders)
- ✅ Achievement & Trophy Manager
- ✅ Hall of Fame Editor
- ✅ Weekly Events Manager
- ✅ Game Manager (supported titles)
- ✅ Founders & Creators Sections
- ✅ Navigation Menu Builder
- ✅ Site Settings (theme, colors, branding, feature flags)
- ✅ Analytics Dashboard (charts, trends)
- ✅ Staff Account Manager (roles, permissions)
- ✅ Activity / Audit Log
- ✅ Database Backup & Restore
- ✅ Custom Code Injection (CSS/JS)
- ✅ CMS Pages (About, Legal, Gallery content)
- ✅ Collab Request Inbox

---

## 8. Public Website Requirements

### 8.1 Page Inventory

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, featured teams, latest news, upcoming tournaments |
| Tournaments | `/tournaments` | Tournament listings and registration |
| Schedule | `/schedule` | Match calendar and results |
| About | `/about` | Organization history, mission, founders |
| News | `/news` | Article feed, individual article view |
| Gallery | `/gallery` | Photo and media gallery |
| Hall of Fame | `/hall-of-fame` | Achievements, milestones, trophies |
| Community | `/community` | Fan messages, giveaways, events |
| Shop | `/shop` | Merchandise listings |
| Live | `/live` | Embedded live stream |
| Contact | `/contact` | Contact form |
| Privacy Policy | `/privacy` | CMS-driven legal page |
| Terms of Service | `/terms` | CMS-driven legal page |
| Cookie Policy | `/cookies` | CMS-driven legal page |

### 8.2 Navigation Requirements

- Persistent top navigation bar with org logo
- Mobile hamburger menu with slide-out drawer
- Active page indicator in nav
- CTA button (e.g., "Join Now" / "Register")
- Social media icon links
- Navigation items shall be configurable via admin panel

### 8.3 Homepage Sections

1. **Hero** — Full-screen animated 3D section, tagline, CTA buttons
2. **Featured Matches** — Upcoming/live matches with countdown
3. **Teams Showcase** — Grid of active teams with logos
4. **Latest News** — Three most recent articles
5. **Tournament Highlights** — Active/upcoming tournaments
6. **Sponsors Bar** — Scrolling sponsor logo strip
7. **Recruitment CTA** — Invitation to join the org
8. **Footer** — Links, social, legal

---

## 9. Admin Panel Requirements

### 9.1 Access Control Matrix

| Module | super_admin | admin | staff (with permission) |
|--------|-------------|-------|------------------------|
| Dashboard | ✅ | ✅ | ✅ |
| Player Manager | ✅ | ✅ | ⚙️ |
| Team Manager | ✅ | ✅ | ⚙️ |
| Tournament Manager | ✅ | ✅ | ⚙️ |
| News CMS | ✅ | ✅ | ⚙️ |
| Gallery | ✅ | ✅ | ⚙️ |
| Settings | ✅ | ✅ | ❌ |
| Staff Manager | ✅ | ❌ | ❌ |
| Backup/Restore | ✅ | ❌ | ❌ |
| Logs | ✅ | ✅ | ❌ |
| Shop | ✅ | ✅ | ⚙️ |

*⚙️ = access granted per-staff permissions*

### 9.2 Dashboard Requirements

- Total player count widget
- Active tournament count widget
- Recent contact messages
- Visit analytics chart (7-day, 30-day)
- Latest news articles
- Pending recruitment applications count
- Quick-action shortcuts

---

## 10. Business Rules

| Rule ID | Rule |
|---------|------|
| BR-01 | A player may only belong to one active team per game |
| BR-02 | Tournament registration is closed after admin manually closes it |
| BR-03 | Payment screenshots must be admin-verified before registration is approved |
| BR-04 | Room IDs are only revealed to teams with approved registrations |
| BR-05 | Staff accounts cannot modify other staff accounts |
| BR-06 | Only super_admin can create or delete admin/staff accounts |
| BR-07 | Backup files exported contain full database state |
| BR-08 | Restored backup overwrites current database state |
| BR-09 | Deleted gallery images are removed from both disk and database |
| BR-10 | News articles in draft status are not visible on public site |
| BR-11 | Feature flags in admin override default feature visibility |
| BR-12 | Custom code injection is restricted to super_admin |

---

## 11. User Flows

### 11.1 Tournament Registration Flow

```
Visitor lands on /tournaments
        │
        ▼
Selects active tournament
        │
        ▼
Clicks "Register" button
        │
        ▼
Fills registration form
(Team name, contact, game ID)
        │
        ▼
Views UPI QR code
        │
        ▼
Makes payment, takes screenshot
        │
        ▼
Uploads payment screenshot
        │
        ▼
Submits form → Pending status
        │
        ▼
Admin reviews in Tournament Manager
        │
     ┌──┴──┐
  Approve  Reject
     │        │
     ▼        ▼
Room ID    Notification
revealed   (optional)
```

### 11.2 Admin Login Flow

```
Admin navigates to /admin
        │
        ▼
Enters username + password
        │
        ▼
POST /api/admin/login
        │
     ┌──┴──┐
  Success  Failure
     │        │
     ▼        ▼
JWT stored  Error shown
sessionStorage rate-limited
     │
     ▼
Redirect to Admin Dashboard
     │
     ▼
Token auto-refreshed
every 20 minutes
```

### 11.3 Content Publish Flow

```
Admin opens News CMS
        │
        ▼
Clicks "New Article"
        │
        ▼
Fills title, content, image
        │
        ▼
Sets status: Draft / Published
        │
        ▼
Saves → POST /db/posts
        │
        ▼
WebSocket broadcasts update
        │
        ▼
All connected clients
update in real-time
```

---

## 12. Wireframe Descriptions

### 12.1 Homepage

```
┌─────────────────────────────────────────────┐
│ [LOGO]   Nav: Home Teams News Tournaments  [Join] │
├─────────────────────────────────────────────┤
│                                             │
│         THREE.JS 3D HERO SECTION           │
│      "SBG ARMY" animated particles          │
│       [Play Now]  [Watch Live]              │
│                                             │
├─────────────────────────────────────────────┤
│  FEATURED TEAMS (horizontal card scroll)   │
├─────────────────────────────────────────────┤
│  LATEST NEWS (3-column grid)               │
├─────────────────────────────────────────────┤
│  SPONSORS TICKER (auto-scroll logos)       │
└─────────────────────────────────────────────┘
```

### 12.2 Admin Panel

```
┌──────────┬──────────────────────────────────┐
│          │  Dashboard / Module Header       │
│  SIDE    ├──────────────────────────────────┤
│  NAV     │                                  │
│          │   Module Content Area            │
│ • Players│   (Tables, Forms, Charts)        │
│ • Teams  │                                  │
│ • Tourns │                                  │
│ • News   │                                  │
│ • ...    │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

---

## 13. Success Metrics

### 13.1 Platform Health KPIs

| Metric | Measurement | Target |
|--------|-------------|--------|
| Monthly Active Users | Unique visitors/month | 10,000+ |
| Tournament Registrations | Per tournament | 50–200 |
| News Articles Published | Per month | 4+ |
| Admin Session Time | Avg. session | 15+ minutes |
| Page Load Time | Lighthouse score | 85+ |
| Uptime | Monthly | 99.5%+ |
| Mobile Traffic % | Of total visitors | 60%+ |
| Sponsor Renewals | Year-over-year | 80%+ |

### 13.2 Engagement Metrics

- Fan message submissions per month
- Recruitment applications per month  
- Gallery views per session
- Tournament page conversion rate (view → register)

---

## 14. Product Roadmap

### V1.0 — Foundation (Completed)
- Basic React frontend with static content
- Express API server with JSON persistence
- Admin login and player/team CRUD
- Public homepage with news feed

### V2.0 — Platform Expansion (Completed)
- Tournament management with bracket generation
- Payment verification flow (UPI QR)
- Gallery and sponsor management
- WebSocket real-time sync
- Three.js hero with WebGL detection

### V3.0 — CMS & Security Hardening (Current)
- Full CMS for About, Legal, Gallery pages
- JWT refresh + AdminGuard auto-refresh
- Custom code manager
- Backup/restore security (admin-only)
- Staff permissions system
- Activity logging
- POST /db auth protection

### V4.0 — Community & Monetization (Planned)
- Full shop with order management
- Giveaway system with automated selection
- Fan authentication (Supabase-based)
- Player profile claiming
- Push notifications (PWA)
- Advanced analytics with retention metrics

### V5.0 — Enterprise Scale (Future)
- PostgreSQL migration from JSON flat-file
- Microservices extraction (auth, media, notifications)
- CI/CD pipeline automation
- Multi-org support (white-label)
- Native mobile app (React Native)
- Streaming integration (direct Twitch/YouTube API)

---

*PRD v3.0 — SBG ARMY Esports Platform — July 2026*
