# Software Requirements Specification (SRS)
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026 | **Status:** Approved

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the SBG ARMY Esports Platform. It is intended for developers, architects, QA engineers, and stakeholders responsible for implementing, testing, and maintaining the system.

### 1.2 Scope
The SBG ARMY Esports Platform encompasses:
- A public-facing website for fans, players, and partners
- An administrative control panel for organization management
- A RESTful API server with real-time WebSocket synchronization
- A JSON-backed database with client-side IndexedDB caching
- A standalone tournament management site (sbg-tournament)
- An enterprise platform variant (sbg-pro)

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| Admin | Authorized organization staff with panel access |
| JWT | JSON Web Token — used for stateless authentication |
| WS | WebSocket — persistent bidirectional connection |
| CMS | Content Management System |
| CRUD | Create, Read, Update, Delete |
| IndexedDB | Browser-native client-side database |
| PRD | Product Requirements Document |
| TRD | Technical Requirements Document |
| SPA | Single Page Application |
| PWA | Progressive Web App |

### 1.4 References
- [PRD.md](PRD.md) — Product Requirements Document
- [TRD.md](TRD.md) — Technical Requirements Document
- [API.md](API.md) — API Reference
- [DATABASE.md](DATABASE.md) — Database Design

### 1.5 Overview
This document is organized into the following sections:
- **Section 2:** Overall System Description
- **Section 3:** Functional Requirements (use cases)
- **Section 4:** Non-Functional Requirements
- **Section 5:** External Interface Requirements
- **Section 6:** System Constraints
- **Section 7:** Assumptions & Dependencies

---

## 2. Overall System Description

### 2.1 System Perspective

The SBG ARMY platform operates as a web-based SaaS-style application. It consists of:

```
External Users
(Fans, Players, Sponsors)
        │
        ▼
Public Website ◄──── API Server ◄──── Admin Panel
(React SPA)          (Express)         (React SPA)
        │                │                  │
        └────────────────┼──────────────────┘
                         │
                    JSON Database
                  + WebSocket sync
                  + File storage
```

### 2.2 System Functions (Summary)

1. **Content Display** — Present organization information, news, rosters, and media to public users
2. **Tournament Management** — Create events, accept registrations, generate brackets, update results
3. **Player/Team Management** — Maintain roster data, statistics, and team assignments
4. **Community Engagement** — Fan messages, recruitment, giveaways, contact forms
5. **Administrative Control** — Secure panel for all org data management
6. **Real-Time Synchronization** — WebSocket-driven live updates across all clients
7. **Analytics** — Track and display platform usage metrics

### 2.3 User Classes and Characteristics

| User Class | Technical Level | Access Level | Frequency |
|------------|----------------|--------------|-----------|
| Anonymous Visitor | Low–High | Public website only | Daily |
| Registered Player | Medium | Public + profile | Weekly |
| Staff Member | Medium | Admin (permitted modules) | Daily |
| Admin | High | Full admin panel | Multiple/day |
| Super Admin | High | Unrestricted | Multiple/day |

### 2.4 Operating Environment

- **Client browsers:** Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- **Mobile browsers:** iOS Safari 15+, Chrome for Android
- **Server OS:** Linux (Ubuntu 20.04+ / NixOS)
- **Node.js version:** 20 LTS
- **Minimum server RAM:** 512MB (1GB recommended)
- **Minimum storage:** 5GB (for uploads and database)

---

## 3. Functional Requirements

### 3.1 Use Case: UC-001 — View Public Homepage

**Actor:** Anonymous Visitor  
**Precondition:** Browser has internet access  
**Main Flow:**
1. User navigates to the platform root URL
2. System serves the React SPA
3. SPA loads from IndexedDB cache for instant display
4. SPA connects to API via WS to sync latest data
5. Homepage renders with hero animation, teams, news, sponsors
6. User can navigate to any public page

**Alternative Flow A (WebGL Unavailable):**
- Step 5a: System detects WebGL unavailability
- Step 5b: CSS particle background renders instead of Three.js scene

**Postcondition:** Homepage displayed with current data

---

### 3.2 Use Case: UC-002 — Tournament Registration

**Actor:** Anonymous Visitor  
**Precondition:** An active tournament with open registration exists  
**Main Flow:**
1. User navigates to `/tournaments`
2. System displays list of tournaments (upcoming, active, completed)
3. User clicks on an active tournament
4. User clicks "Register" button
5. System displays registration form
6. User enters: team name, contact info, in-game ID, team members
7. System displays UPI QR code for payment
8. User completes payment and takes screenshot
9. User uploads payment screenshot
10. User submits form
11. System creates registration record with status "pending"
12. Admin receives notification in panel
13. Admin verifies payment screenshot and approves
14. System updates registration status to "approved"
15. Room ID/password released to registered team

**Exception Flow A (Form validation fails):**
- Step 9a: System shows inline validation errors
- Step 9b: User corrects and resubmits

**Exception Flow B (Duplicate registration):**
- Step 10a: System detects duplicate team name or contact
- Step 10b: System returns error; user contacts admin

**Postcondition:** Team registered; admin notified

---

### 3.3 Use Case: UC-003 — Admin Login

**Actor:** Admin / Staff  
**Precondition:** Account exists in staffAccounts collection  
**Main Flow:**
1. User navigates to `/admin`
2. System displays login form (redirected from protected route)
3. User enters username and password
4. System sends `POST /api/admin/login`
5. Server validates credentials via bcrypt comparison
6. Server signs and returns JWT
7. Client stores JWT in sessionStorage
8. Client redirects to admin dashboard
9. AdminGuard component schedules token refresh every 20 minutes

**Exception Flow A (Invalid credentials):**
- Step 5a: bcrypt comparison fails
- Step 5b: Server returns 401 with error message
- Step 5c: Login attempts are rate-limited (5 per 15 minutes)

**Exception Flow B (Session expired):**
- Step 8a: Stored token is expired
- Step 8b: AdminGuard detects expiry on route access
- Step 8c: User redirected to login

**Postcondition:** Admin authenticated with valid JWT session

---

### 3.4 Use Case: UC-004 — Manage Player Roster

**Actor:** Admin / Staff (with players permission)  
**Precondition:** Authenticated admin session  
**Main Flow:**
1. Admin opens Player Manager from sidebar
2. System displays paginated list of all players
3. Admin clicks "Add Player"
4. System displays player creation form
5. Admin enters: name, game, role, bio, social links
6. Admin uploads profile image (optional)
7. Admin submits form
8. System saves to players collection
9. WebSocket broadcasts update to all connected clients
10. Public website player list updates in real-time

**Alternative Flow (Edit Player):**
- Step 3a: Admin clicks edit icon on existing player
- Step 4a–7a: Admin modifies desired fields
- Continues from step 8

**Alternative Flow (Delete Player):**
- Step 3b: Admin clicks delete icon
- Step 3c: Confirmation dialog shown
- Step 3d: On confirm, player removed from collection
- Step 9: WS broadcast; public site updates

**Postcondition:** Player data updated in database and reflected on public site

---

### 3.5 Use Case: UC-005 — Publish News Article

**Actor:** Admin / Staff (with news permission)  
**Precondition:** Authenticated admin session  
**Main Flow:**
1. Admin opens News CMS from sidebar
2. Admin clicks "New Article"
3. System displays article editor
4. Admin enters: title, content (rich text), category, cover image
5. Admin sets status to "Published" (or "Draft")
6. Admin saves article
7. System stores in posts collection with timestamp
8. WS broadcasts update
9. Public news page shows new article immediately

**Business Rule:** Draft articles are not displayed on the public website.

**Postcondition:** Article published and visible to public (if status = Published)

---

### 3.6 Use Case: UC-006 — Database Backup

**Actor:** Super Admin  
**Precondition:** Authenticated super_admin session  
**Main Flow:**
1. Super admin navigates to Backup module
2. Clicks "Export Database"
3. System calls `GET /api/backup`
4. Server serializes all collections to JSON
5. Browser downloads file: `sbg-army-backup-<date>.json`

**Restore Flow:**
1. Super admin clicks "Restore Database"
2. Warning dialog shown: "This will overwrite all current data"
3. Admin uploads backup JSON file
4. System calls `POST /api/restore`
5. Server validates backup format
6. Server overwrites all collections
7. WS broadcasts full db_init to all clients
8. Clients reflect restored state

**Postcondition:** Database exported (backup) or restored (restore)

---

### 3.7 Use Case: UC-007 — Real-Time Score Update

**Actor:** Admin  
**Precondition:** Match record exists; tournament is active  
**Main Flow:**
1. Admin opens Match Manager
2. Selects active match
3. Updates score fields for each team
4. Saves match
5. System updates matches collection
6. WS broadcasts `{type: 'db_update', collection: 'matches', data: [...]}`
7. All connected public site visitors see updated score within 500ms

**Postcondition:** Match score updated in real-time across all clients

---

### 3.8 Use Case: UC-008 — Staff Account Management

**Actor:** Super Admin  
**Precondition:** Authenticated super_admin session  
**Main Flow:**
1. Super admin opens Staff Manager
2. Clicks "Add Staff Account"
3. Enters: username, password, display name, role (admin/staff)
4. If role = staff, configures module permissions
5. Saves account
6. System hashes password with bcrypt
7. Stores in staffAccounts collection (password field stripped from response)

**Permission Matrix Configuration:**
```
modules: {
  players: true/false,
  teams: true/false,
  tournaments: true/false,
  news: true/false,
  gallery: true/false,
  sponsors: true/false,
  shop: true/false,
  recruitment: true/false,
  analytics: true/false
}
```

**Postcondition:** Staff account created; can log in with assigned permissions

---

### 3.9 Use Case: UC-009 — Custom Code Injection

**Actor:** Super Admin  
**Precondition:** Authenticated super_admin session  
**Main Flow:**
1. Super admin opens Custom Code module
2. System shows current custom CSS and custom JS fields
3. Admin edits CSS/JS snippets
4. Admin saves
5. System stores in customCode collection
6. WS broadcasts update
7. Public site injects custom CSS in `<head>` and custom JS before `</body>`

**Security Note:** Custom code injection is restricted to super_admin only. All code is stored as-is and executed in the browser context.

**Postcondition:** Custom CSS/JS injected into all public pages

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-P01 | Public homepage initial load | Time-to-Interactive < 3s on 4G (10 Mbps) |
| NFR-P02 | API response time | p50 < 50ms, p95 < 200ms, p99 < 500ms |
| NFR-P03 | WebSocket message delivery | < 100ms end-to-end |
| NFR-P04 | Admin panel navigation | < 500ms between modules |
| NFR-P05 | Database file write | < 100ms for single collection |
| NFR-P06 | Image upload processing | < 5s for files up to 5MB |
| NFR-P07 | Concurrent WebSocket connections | System stable at 500+ connections |

### 4.2 Reliability Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-R01 | Platform availability | 99.5% monthly uptime |
| NFR-R02 | WebSocket reconnection | Client reconnects within 30 seconds of disconnect |
| NFR-R03 | Data durability | Zero data loss on normal server restart |
| NFR-R04 | Crash recovery | API server restarts within 10 seconds (PM2 watch) |
| NFR-R05 | Backup availability | Manual backup available on demand; daily automated |

### 4.3 Security Requirements

| ID | Requirement |
|----|-------------|
| NFR-S01 | All passwords stored with bcrypt (≥12 rounds) |
| NFR-S02 | JWTs signed with minimum 256-bit secret |
| NFR-S03 | JWTs expire within 24 hours |
| NFR-S04 | Auth endpoints rate-limited: max 5 req/15min per IP |
| NFR-S05 | All admin routes return 401 without valid JWT |
| NFR-S06 | CORS restricted to configured origin(s) |
| NFR-S07 | No credentials stored in client-accessible storage beyond sessionStorage |
| NFR-S08 | File uploads restricted to allowed MIME types (image/jpeg, image/png, image/webp) |
| NFR-S09 | Request body limit: 10MB |
| NFR-S10 | All API responses strip sensitive fields (password, passwordHash, token) |

### 4.4 Usability Requirements

| ID | Requirement |
|----|-------------|
| NFR-U01 | Public site must be fully responsive at 320px, 768px, 1024px, 1440px |
| NFR-U02 | Admin panel optimized for ≥1280px viewport |
| NFR-U03 | All interactive elements must have visible focus indicators |
| NFR-U04 | Color contrast ratio ≥ 4.5:1 (WCAG AA) |
| NFR-U05 | All images must have descriptive alt text |
| NFR-U06 | Forms must show validation errors inline, adjacent to the relevant field |
| NFR-U07 | Loading states must be shown for all async operations |
| NFR-U08 | Error states must be shown with actionable messages |

### 4.5 Maintainability Requirements

| ID | Requirement |
|----|-------------|
| NFR-M01 | All TypeScript code (strict mode where possible) |
| NFR-M02 | No console.log in production builds (use Pino) |
| NFR-M03 | Environment configuration exclusively via .env files |
| NFR-M04 | New database collections must be added to ALL_COLLECTIONS or fail loudly |
| NFR-M05 | All API endpoints documented in API.md |

### 4.6 Portability Requirements

| ID | Requirement |
|----|-------------|
| NFR-PO01 | Platform deployable on any Node.js 20+ environment |
| NFR-PO02 | Database layer replaceable with PostgreSQL without frontend changes |
| NFR-PO03 | Frontend buildable to static files deployable to any CDN |
| NFR-PO04 | No OS-specific dependencies |

---

## 5. External Interface Requirements

### 5.1 User Interface Requirements

- Web-based interface accessible via modern browsers
- Responsive design supporting mobile, tablet, and desktop
- Progressive enhancement: core content accessible without JavaScript (SSR future consideration)
- Keyboard navigable admin panel
- RTL language support consideration for future

### 5.2 API Interface Requirements

- RESTful HTTP API on configurable port (default: 5000)
- JSON request/response format
- Standard HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500)
- WebSocket endpoint at `/ws` on the same server/port

### 5.3 External Service Interfaces

| Service | Interface Type | Purpose | Required |
|---------|---------------|---------|----------|
| Supabase | REST API / Client SDK | Player authentication, supplementary DB | Optional |
| EmailJS | Client-side API | Contact form email delivery | Optional |
| Firebase | Client SDK | Legacy auth integration | Optional |
| YouTube/Twitch | Embed iFrame API | Live stream embed | Optional |

### 5.4 Hardware Interface Requirements

- No specific hardware requirements
- Server must support persistent disk for file storage (critical for production)
- Minimum 512MB RAM server recommended

---

## 6. System Constraints

### 6.1 Technical Constraints

| Constraint | Description |
|------------|-------------|
| Node.js 20+ | API server requires LTS Node.js |
| pnpm | Workspace management uses pnpm; npm/yarn not supported |
| JSON DB limit | Not suitable for >100,000 records per collection |
| Single-writer DB | No concurrent write transactions supported |
| Local file uploads | Requires persistent disk in production |
| WS scalability | Single-server WebSocket; multi-server requires Redis pub/sub |

### 6.2 Regulatory Constraints

| Constraint | Description |
|------------|-------------|
| GDPR | User data collected via forms must be deletable on request |
| Cookie consent | Cookie banner required before non-essential cookies |
| Age restriction | Platform targets users 13+ (COPPA consideration) |
| Privacy Policy | Must disclose data collection practices |

### 6.3 Business Constraints

- Platform must be operational 24/7 (esports events happen across time zones)
- Admin panel changes must reflect on public site within 1 second
- Tournament data must never be lost (backup before any restore)

---

## 7. Assumptions & Dependencies

### 7.1 Assumptions

| ID | Assumption |
|----|------------|
| A01 | Admins use modern desktop browsers with 1280px+ displays |
| A02 | Server has reliable internet connectivity |
| A03 | Uploaded media files are appropriate for public display |
| A04 | Payment verification is manual (no automated payment gateway) |
| A05 | The organization operates with a small to medium admin team (<20 staff) |
| A06 | Tournament prize distribution is handled outside the platform |
| A07 | Three.js hero is a visual enhancement; platform must function without it |

### 7.2 Dependencies

| ID | Dependency | Impact if Unavailable |
|----|------------|----------------------|
| D01 | Node.js 20+ runtime | API server cannot start |
| D02 | pnpm package manager | Workspace commands fail |
| D03 | SESSION_SECRET env var | API server refuses to start |
| D04 | Persistent disk (production) | Uploads lost on restart |
| D05 | VITE_API_URL env var | Frontend cannot communicate with API |
| D06 | Supabase (optional) | Player auth disabled; other features unaffected |
| D07 | EmailJS (optional) | Contact form submits to DB only; no email delivery |

---

*SRS v3.0 — SBG ARMY Esports Platform — July 2026*
