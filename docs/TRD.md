# Technical Requirements Document (TRD)
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Status:** Production | **Date:** July 2026

---

## Table of Contents

1. [Overall Architecture](#1-overall-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Authentication Flow](#5-authentication-flow)
6. [Database Architecture](#6-database-architecture)
7. [WebSocket Architecture](#7-websocket-architecture)
8. [File Storage & Upload](#8-file-storage--upload)
9. [State Management](#9-state-management)
10. [API Architecture](#10-api-architecture)
11. [Security Architecture](#11-security-architecture)
12. [Error Handling & Logging](#12-error-handling--logging)
13. [Backup System](#13-backup-system)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Performance Optimization](#15-performance-optimization)
16. [Scalability Plan](#16-scalability-plan)
17. [Folder Structure](#17-folder-structure)
18. [Environment Configuration](#18-environment-configuration)

---

## 1. Overall Architecture

### 1.1 System Overview

The SBG ARMY platform is a **monorepo workspace** (pnpm workspaces) containing multiple artifacts that function as a cohesive system:

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                          │
│                                                                  │
│  ┌─────────────────────────┐   ┌──────────────────────────────┐  │
│  │   PUBLIC WEBSITE        │   │   ADMIN PANEL (SPA)          │  │
│  │   artifacts/sbg-army    │   │   artifacts/sbg-army/admin   │  │
│  │   React 18 + Wouter     │   │   JWT-gated React SPA        │  │
│  │   Framer Motion         │   │   18+ management modules     │  │
│  │   Three.js              │   │                              │  │
│  └────────────┬────────────┘   └──────────────┬───────────────┘  │
│               │                               │                  │
│               └───────────── HTTP / WS ───────┘                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                    API SERVER (Express 5)                        │
│                    artifacts/api-server                          │
│                                                                  │
│   ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│   │  REST Endpoints  │  │  WebSocket   │  │  Middleware      │   │
│   │  /api/*          │  │  /ws         │  │  JWT, CORS,      │   │
│   │                  │  │  broadcast   │  │  Rate limit,     │   │
│   │                  │  │  sync        │  │  Pino logger     │   │
│   └────────┬─────────┘  └──────┬───────┘  └─────────────────┘   │
│            │                   │                                  │
│   ┌────────▼───────────────────▼──────────────────────────────┐  │
│   │              DATABASE LAYER (database.ts)                  │  │
│   │   JSON flat-files per collection (./database/*.json)       │  │
│   │   In-memory cache + atomic write + WS broadcast            │  │
│   └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

CLIENT-SIDE CACHE
┌──────────────────────────────────────────────────────────────────┐
│  IndexedDB (idb-keyval)    wsClient.ts                          │
│  Persists db state         Manages WS connection lifecycle       │
│  Serves as offline cache   Reconnect + re-sync on disconnect     │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | JSON flat-file | Low operational overhead, zero dependencies, easy backup/restore |
| Auth | JWT + bcrypt | Stateless, portable, standard |
| Real-time | WebSocket (ws) | Lower overhead than Socket.IO for this use case |
| Client cache | IndexedDB | Offline support, fast re-render on reconnect |
| Routing | Wouter | Lightweight React router (vs. React Router's heavier bundle) |
| Styling | Tailwind + Radix UI | Rapid development, accessible primitives |
| Animations | Framer Motion + Three.js | Professional esports aesthetic |
| Monorepo | pnpm workspaces | Shared deps, consistent tooling |

---

## 2. Technology Stack

### 2.1 Frontend (artifacts/sbg-army)

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| Framework | react | ^18 | Component model |
| Framework | react-dom | ^18 | DOM rendering |
| Build Tool | vite | ^5 | Dev server + bundler |
| Language | TypeScript | ^5 | Type safety |
| Routing | wouter | ^3 | Client-side routing |
| Styling | tailwindcss | ^3 | Utility CSS |
| UI Components | @radix-ui/* | latest | Accessible primitives |
| UI Components | shadcn/ui | - | Pre-built component library |
| Animations | framer-motion | ^11 | Declarative animations |
| 3D Graphics | three | ^0.165 | WebGL hero section |
| Charts | recharts | ^2 | Analytics visualizations |
| Icons | lucide-react | latest | Icon system |
| DB Cache | idb-keyval | ^6 | IndexedDB wrapper |
| Form | react-hook-form | ^7 | Form state management |
| Validation | zod | ^3 | Schema validation |
| HTTP | fetch (native) | - | API calls |
| Date | date-fns | ^3 | Date formatting |

### 2.2 Backend (artifacts/api-server)

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| Framework | express | ^5 | HTTP server |
| Language | TypeScript | ^5 | Type safety |
| Runtime | Node.js | ^20 | Server runtime |
| Auth | jsonwebtoken | ^9 | JWT sign/verify |
| Auth | bcryptjs | ^2 | Password hashing |
| WebSocket | ws | ^8 | Real-time sync |
| Upload | multer | ^1 | Multipart file handling |
| Logging | pino | ^9 | Structured JSON logging |
| Logging | pino-pretty | ^13 | Dev log formatting |
| CORS | cors | ^2 | Cross-origin headers |
| Env | dotenv | ^16 | Environment variables |
| Dev | tsx | ^4 | TypeScript execution |
| Dev | nodemon | ^3 | File watching |

### 2.3 DevOps / Tooling

| Tool | Purpose |
|------|---------|
| pnpm | Package manager + workspace orchestration |
| pnpm workspaces | Monorepo management |
| TypeScript | End-to-end type safety |
| ESLint | Code quality |
| Prettier | Code formatting |

---

## 3. Frontend Architecture

### 3.1 Application Entry Point

```
artifacts/sbg-army/
├── index.html              # Vite HTML entry
└── src/
    ├── main.tsx            # React root + providers
    ├── App.tsx             # Router configuration
    ├── pages/              # Route-level components
    ├── components/         # Shared components
    │   ├── ui/             # shadcn/ui components
    │   ├── admin/          # Admin panel components
    │   └── public/         # Public site components
    ├── hooks/              # Custom React hooks
    │   ├── useDatabase.ts  # DB state + sync
    │   └── useAuth.ts      # Admin auth state
    ├── lib/
    │   ├── wsClient.ts     # WebSocket client
    │   ├── supabaseAuth.ts # Supabase integration
    │   └── utils.ts        # Utility functions
    └── types/              # TypeScript interfaces
```

### 3.2 Routing Architecture

The application uses **Wouter** for client-side routing. Routes are defined in `App.tsx`:

```typescript
// Public routes
/                    → HomePage
/tournaments         → TournamentsPage
/schedule            → SchedulePage
/about               → AboutPage
/news                → NewsPage
/news/:id            → ArticlePage
/gallery             → GalleryPage
/hall-of-fame        → HallOfFamePage
/community           → CommunityPage
/shop                → ShopPage
/live                → LivePage
/contact             → ContactPage
/privacy             → PrivacyPage
/terms               → TermsPage
/cookies             → CookiePolicyPage

// Admin routes (JWT-gated)
/admin               → AdminLogin / AdminDashboard
/admin/setup         → AdminSetup (first-run only)
```

### 3.3 Component Architecture

```
Component Hierarchy:

App
├── Layout (public)
│   ├── Navbar
│   │   ├── Logo
│   │   ├── NavLinks (from DB settings)
│   │   ├── MobileMenu (Drawer)
│   │   └── CTAButton
│   ├── [Page Component]
│   │   └── [Section Components]
│   └── Footer
│       ├── FooterLinks
│       ├── SocialIcons
│       └── LegalLinks
│
└── AdminLayout (JWT protected)
    ├── AdminSidebar
    │   └── ModuleLinks (permission-filtered)
    ├── AdminHeader
    │   ├── UserInfo
    │   └── LogoutButton
    └── [Module Component]
        ├── DataTable
        ├── EditModal/Form
        └── ActionButtons
```

### 3.4 Theme System

The platform uses a **dynamic theme injection** system. Theme values (colors, fonts, border-radius) are stored in the `settings` collection and injected as CSS custom properties at runtime:

```typescript
// Injected as CSS variables
--primary-color: #<from settings>
--secondary-color: #<from settings>
--accent-color: #<from settings>
--font-family: <from settings>
--border-radius: <from settings>
```

This allows admins to change the entire platform color scheme without a code deployment.

### 3.5 Three.js Hero Implementation

The `HeroSection` component uses Three.js to render a 3D particle scene:

```typescript
// WebGL availability check
if (isWebGLAvailable()) {
  // Render Three.js scene
  // Animated particle field, org name in 3D text
} else {
  // Fallback: CSSParticleBackground
  // Pure CSS animated particles
}
```

**Scene composition:**
- Particle field (BufferGeometry with Points)
- Ambient + directional lighting
- Responsive camera (resize handler)
- OrbitControls (optional)
- RequestAnimationFrame game loop

---

## 4. Backend Architecture

### 4.1 Express Server Setup

```typescript
// artifacts/api-server/src/index.ts
const app = express();

// Middleware stack (in order)
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoMiddleware);          // Request logging
app.use('/uploads', static());    // Serve uploaded files

// Routes
app.use('/api', router);
app.use('/api/admin', adminRouter);
app.use('/api/tnmt', tournamentRouter);

// WebSocket upgrade
server.on('upgrade', handleWsUpgrade);
```

### 4.2 Middleware Pipeline

```
Incoming Request
      │
      ▼
CORS Check
      │
      ▼
JSON Body Parse (10mb limit)
      │
      ▼
Pino HTTP Logger
      │
      ▼
Route Matching
      │
   ┌──┴──┐
Public  Protected
Route   Route
  │        │
  │        ▼
  │    requireAdmin()
  │    Verifies JWT
  │    Extracts role/user
  │        │
  ▼        ▼
Handler Function
      │
      ▼
Response
```

### 4.3 Route Organization

```
artifacts/api-server/src/
├── index.ts              # Server entry + WS setup
├── routes/
│   ├── db.ts             # /api/db - CRUD, backup, restore
│   ├── admin.ts          # /api/admin - auth, staff
│   ├── upload.ts         # /api/upload - file handling
│   ├── tournament.ts     # /api/tnmt - public tournament
│   └── analytics.ts      # /api/analytics-public
├── middleware/
│   ├── auth.ts           # requireAdmin(), requireSuperAdmin()
│   └── rateLimit.ts      # Rate limiting configurations
├── lib/
│   ├── database.ts       # DB engine (read/write/cache)
│   ├── broadcast.ts      # WS broadcast helpers
│   └── backup.ts         # Export/import logic
└── types/
    └── index.ts          # Shared TypeScript interfaces
```

### 4.4 Database Engine

The custom database engine (`database.ts`) provides:

```typescript
interface DatabaseEngine {
  // Read
  getCollection(name: string): Promise<Record[]>;
  getRecord(collection: string, id: string): Promise<Record>;
  
  // Write
  saveCollection(name: string, data: Record[]): Promise<void>;
  saveRecord(collection: string, record: Record): Promise<void>;
  deleteRecord(collection: string, id: string): Promise<void>;
  
  // Bulk
  saveDB(allCollections: DBState): Promise<void>;
  loadDB(): Promise<DBState>;
  
  // Backup
  exportDB(): Promise<string>;  // JSON string
  importDB(json: string): Promise<void>;
}
```

**File layout:**
```
artifacts/api-server/database/
├── players.json
├── teams.json
├── tournaments.json
├── matches.json
├── posts.json
├── sponsors.json
├── gallery.json
├── settings.json
├── staffAccounts.json
├── analytics.json
└── ...  (one file per collection)
```

**Critical requirement:** Every collection must be registered in `ALL_COLLECTIONS` array in `database.ts`. Collections not in this array are silently skipped during bulk `saveDB()` operations.

---

## 5. Authentication Flow

### 5.1 Admin Authentication Sequence

```
Client                    API Server                    Database
  │                            │                            │
  │  POST /api/admin/login     │                            │
  │  {username, password}      │                            │
  ├──────────────────────────►│                            │
  │                            │  findStaff(username)       │
  │                            ├──────────────────────────►│
  │                            │◄──────────────────────────┤
  │                            │  staffRecord               │
  │                            │                            │
  │                            │  bcrypt.compare(           │
  │                            │    password,               │
  │                            │    staffRecord.hash        │
  │                            │  )                         │
  │                            │                            │
  │                            │  jwt.sign({                │
  │                            │    id, username,           │
  │                            │    role, permissions       │
  │                            │  }, SESSION_SECRET)        │
  │                            │                            │
  │  200 { token, user }       │                            │
  │◄──────────────────────────┤                            │
  │                            │                            │
  │  Store token in            │                            │
  │  sessionStorage            │                            │
  │                            │                            │
```

### 5.2 Request Authorization Flow

```
Protected Request
      │
      ▼
Extract Bearer token
from Authorization header
      │
      ▼
jwt.verify(token, SESSION_SECRET)
      │
   ┌──┴──────┐
Valid        Invalid/Expired
  │              │
  ▼              ▼
Attach user   401 Unauthorized
to req.admin  {"error": "Invalid token"}
  │
  ▼
Check role/permissions
  │
  ▼
Execute handler
```

### 5.3 Token Refresh Flow

```
AdminGuard component
mounts in admin panel
      │
      ▼
Schedules refresh
every 20 minutes
      │
      ▼
POST /api/admin/refresh
{Authorization: Bearer <token>}
      │
      ▼
Server re-signs new token
with same payload
      │
      ▼
Client updates
sessionStorage with new token
```

### 5.4 Role Hierarchy

```
super_admin
    │
    ├── Full platform access
    ├── Staff management
    ├── Backup/restore
    ├── Custom code injection
    └── All admin capabilities
    
admin
    │
    ├── All content management
    ├── Player/team/tournament CRUD
    ├── News, gallery, sponsors
    └── Analytics viewing
    
staff (per-module permissions)
    │
    ├── Granted modules only
    └── Read-only on others
```

### 5.5 Password Security

```typescript
// Hashing (on account creation/update)
const hash = await bcrypt.hash(password, 12);  // 12 salt rounds

// Verification (on login)
const valid = await bcrypt.compare(plaintext, hash);

// CRITICAL: Password hash must never be returned in API responses
// mergeSensitive() strips 'password' and 'passwordHash' fields
```

---

## 6. Database Architecture

### 6.1 Collection Registry

All collections must be declared in `ALL_COLLECTIONS`:

```typescript
const ALL_COLLECTIONS = [
  'players', 'matches', 'tournaments', 'registrations',
  'posts', 'sponsors', 'games', 'creators', 'founders',
  'orders', 'staffAccounts', 'playerUsers',
  'contact_messages', 'fan_messages', 'giveaways',
  'collab_requests', 'settings', 'features', 'analytics',
  'navigation', 'achievements', 'hofMilestones', 'trophies',
  'teamRecords', 'teamSeasons', 'weeklyEvents', 'gallery',
  'customCode', 'shop',
  // Tournament-specific (sbg-tournament)
  'tnmt_tournaments', 'tnmt_registrations', 'tnmt_matches'
];
```

### 6.2 Data Consistency Model

The database uses an **optimistic in-memory cache** with **atomic file writes**:

1. Read: Load JSON file → parse → return
2. Write: Validate → update in-memory → write file atomically → broadcast WS
3. On server start: Load all collections into memory
4. Cache invalidation: Never (server is source of truth; clients sync via WS)

### 6.3 Client-Side Sync Protocol

```
Server starts
      │
      ▼
Client connects via WS
      │
      ▼
Server sends full DB snapshot
{type: 'db_init', data: {all collections}}
      │
      ▼
Client stores in IndexedDB
      │
      ▼
[Normal operation]
      │
Admin makes change
      │
      ▼
Server writes JSON file
      │
      ▼
Server broadcasts:
{type: 'db_update', collection: 'X', data: [...]}
      │
      ▼
All WS clients update
their local state
      │
      ▼
React re-renders
```

---

## 7. WebSocket Architecture

### 7.1 Server-Side WebSocket

```typescript
// Server-side WS management
const wss = new WebSocketServer({ noServer: true });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Send full DB state to new client
  ws.send(JSON.stringify({
    type: 'db_init',
    data: await loadDB()
  }));
  
  ws.on('close', () => clients.delete(ws));
});

// Broadcast to all connected clients
function broadcast(message: object) {
  const payload = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
```

### 7.2 Client-Side WebSocket (wsClient.ts)

```typescript
class WsClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      // Clear reconnect timer
      // Trigger re-sync flag
    };
    
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // Route to appropriate handler
      this.handleMessage(msg);
    };
    
    this.ws.onclose = () => {
      // Schedule reconnect (exponential backoff)
      this.scheduleReconnect();
    };
  }
  
  private scheduleReconnect() {
    // 1s, 2s, 4s, 8s, max 30s
  }
}
```

### 7.3 Reconnect & Re-sync Guards

To prevent stale-tab bulk-save bugs, the client implements:

1. **Reconnect guard**: On WS reconnect, client re-fetches full state from server before allowing any writes
2. **Visibility guard**: On tab becoming visible after being hidden, client checks if state is stale
3. **Interval sync**: Every 5 minutes, client syncs from server if WS is active

---

## 8. File Storage & Upload

### 8.1 Upload Architecture

Files are stored on the API server's local filesystem:

```
artifacts/api-server/
└── uploads/
    ├── players/         # Player profile images
    ├── teams/           # Team logos
    ├── gallery/         # Gallery images
    ├── sponsors/        # Sponsor logos
    ├── news/            # Article images
    ├── tournaments/     # Tournament banners, QR codes
    └── misc/            # General uploads
```

### 8.2 Upload Endpoint

```
POST /api/upload
Content-Type: multipart/form-data

Fields:
  file     - The file blob
  category - Upload category (players, gallery, etc.)
  
Response:
  { url: "/uploads/<category>/<filename>" }
```

### 8.3 File Serving

Uploaded files are served as static assets:

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

**Public access:** All uploaded files are publicly accessible via URL. Sensitive files should not be stored here.

### 8.4 Production Persistence

> ⚠️ **IMPORTANT:** When deploying to platforms like Render, the server must have a **persistent disk** mounted at `/uploads`. Ephemeral filesystems will lose all uploads on restart.

---

## 9. State Management

### 9.1 useDatabase Hook

The primary state management mechanism is the `useDatabase` custom hook:

```typescript
function useDatabase() {
  const [db, setDb] = useState<DBState>(initialState);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 1. Load from IndexedDB (fast, offline-first)
    // 2. Connect to WS
    // 3. Sync from server on WS connect
    // 4. Update state on WS messages
  }, []);
  
  const save = async (collection: string, data: any[]) => {
    // Optimistic update local state
    // POST to /api/db/:collection
    // WS broadcast handles remote clients
  };
  
  return { db, loading, save };
}
```

### 9.2 IndexedDB Integration

```typescript
import { get, set } from 'idb-keyval';

// Save to IndexedDB
await set('sbg-army-db', dbState);

// Load from IndexedDB
const cached = await get('sbg-army-db');
```

### 9.3 State Shape

```typescript
interface DBState {
  players: Player[];
  teams: Team[];
  matches: Match[];
  tournaments: Tournament[];
  posts: Post[];
  sponsors: Sponsor[];
  gallery: GalleryItem[];
  settings: Settings;
  navigation: NavItem[];
  features: FeatureFlag[];
  analytics: AnalyticsEntry[];
  staffAccounts: StaffAccount[];
  // ... all collections
}
```

---

## 10. API Architecture

### 10.1 API Design Principles

- **RESTful** conventions (GET, POST, PUT, DELETE)
- **JSON** request/response bodies
- **Bearer token** authentication for protected routes
- **Consistent error format**: `{ error: string, code?: string }`
- **CORS** restricted to configured origins
- **Rate limiting** on auth endpoints

### 10.2 Base URL

```
Development:  http://localhost:5000/api
Production:   https://<domain>/api
```

### 10.3 Authentication Header

```
Authorization: Bearer <jwt-token>
```

---

## 11. Security Architecture

### 11.1 Defense in Depth

```
Layer 1: HTTPS (TLS termination at load balancer/CDN)
Layer 2: CORS (origin whitelist)
Layer 3: Rate limiting (auth endpoints: 5 req/15min)
Layer 4: JWT verification (all /admin routes)
Layer 5: Role/permission check (per module)
Layer 6: Input validation (Zod schemas)
Layer 7: Output sanitization (password stripping)
Layer 8: Content-Security-Policy headers
```

### 11.2 XSS Protection

- All user-generated content rendered via React (escaped by default)
- `dangerouslySetInnerHTML` used only for CMS content with sanitization
- Custom code injection limited to super_admin with escaping
- Content-Security-Policy header set in production

### 11.3 CSRF Protection

- JWT in `sessionStorage` (not cookies) — immune to CSRF attacks
- All state-mutating requests require `Authorization` header
- SameSite=Strict on any cookies used

---

## 12. Error Handling & Logging

### 12.1 Backend Logging (Pino)

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',  // Dev only
    options: { colorize: true }
  }
});

// Log levels used:
logger.info(...)    // Normal operations
logger.warn(...)    // Recoverable issues
logger.error(...)   // Application errors
logger.fatal(...)   // Server-stopping errors
```

**Logged events:**
- All HTTP requests (method, path, status, duration)
- Auth attempts (success and failure, with username/IP)
- Database operations (collection, operation type)
- WebSocket connects/disconnects
- File upload operations
- All unhandled exceptions

### 12.2 Frontend Error Handling

- React Error Boundaries wrap major page sections
- API errors display toast notifications
- Network errors trigger offline mode with stale IndexedDB data
- Three.js load failures trigger CSS fallback (no crash)

### 12.3 Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}  // Optional additional context
}
```

---

## 13. Backup System

### 13.1 Export

```
GET /api/backup
Authorization: Bearer <admin-token>

Response: 
  Content-Type: application/json
  Content-Disposition: attachment; filename="sbg-army-backup-<date>.json"
  
  {
    "version": "3.0",
    "timestamp": "2026-07-21T...",
    "collections": {
      "players": [...],
      "teams": [...],
      // all collections
    }
  }
```

### 13.2 Restore

```
POST /api/restore
Authorization: Bearer <admin-token>
Content-Type: application/json

Body: { backup JSON from export }

Response: { success: true, message: "Database restored" }
```

### 13.3 Backup Strategy

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Manual export | On-demand | Permanent | Admin download |
| Scheduled auto | Daily (cron) | 30 days | Server /backups/ |
| Pre-restore snapshot | Before restore | 7 days | Server /backups/pre-restore/ |

---

## 14. Deployment Architecture

### 14.1 Production Environment

```
Internet
    │
    ▼
CDN / Load Balancer (Cloudflare / Nginx)
    │         │
    ▼         ▼
Frontend    API Server
(Static)    (Node.js process)
Vite build  Express + WS
    │
    ▼
Persistent Disk
(uploads/ + database/*.json)
```

### 14.2 Render Deployment

**API Server:**
- Service type: Web Service
- Build command: `pnpm install && pnpm --filter @workspace/api-server run build`
- Start command: `pnpm --filter @workspace/api-server run start`
- Persistent disk: `/uploads` and `/database`

**Frontend:**
- Service type: Static Site
- Build command: `pnpm install && pnpm --filter @workspace/sbg-army run build`
- Publish directory: `artifacts/sbg-army/dist`

### 14.3 Environment Variables (Required)

**API Server:**
```
SESSION_SECRET=<strong-random-secret>
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

**Frontend:**
```
VITE_API_URL=https://your-api-server.onrender.com
VITE_SUPABASE_URL=<if using Supabase>
VITE_SUPABASE_ANON_KEY=<if using Supabase>
VITE_SETUP_CODE=<one-time admin setup code>
```

---

## 15. Performance Optimization

### 15.1 Frontend Optimizations

| Technique | Implementation |
|-----------|---------------|
| Code splitting | Vite automatic + React.lazy() for admin modules |
| Image optimization | WebP format, lazy loading, compressed uploads |
| Bundle optimization | Tree-shaking, Vite rollup config |
| Caching | IndexedDB client cache, browser HTTP cache |
| Three.js lazy load | Only loaded when WebGL is available |
| Font loading | `font-display: swap` |

### 15.2 Backend Optimizations

| Technique | Implementation |
|-----------|---------------|
| In-memory cache | All DB collections loaded at startup |
| WS broadcast | Single broadcast to all clients vs. N HTTP polls |
| Response compression | gzip via compression middleware |
| Static file serving | express.static with ETags |
| Pino logging | Async, non-blocking structured logging |

### 15.3 Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | 85+ |
| Accessibility | 90+ |
| Best Practices | 90+ |
| SEO | 90+ |
| PWA | Pass |

---

## 16. Scalability Plan

### 16.1 Current Bottlenecks

| Bottleneck | Impact | Solution (V4/V5) |
|------------|--------|-------------------|
| JSON flat-file DB | Single-writer, no transactions | PostgreSQL migration |
| In-memory state | Not horizontally scalable | Redis shared cache |
| Local file uploads | Not replicated | S3/CDN storage |
| Single process | No failover | Process manager (PM2 cluster) |

### 16.2 PostgreSQL Migration Path

The database abstraction layer (`database.ts`) is designed to be replaceable:

```typescript
// Current: JSON engine
import { db } from './database-json';

// Future: PostgreSQL engine (drop-in replacement)
import { db } from './database-postgres';
```

All consuming code uses the same interface — no changes needed in routes or frontend.

### 16.3 Horizontal Scaling

With PostgreSQL + Redis:
```
Load Balancer
├── API Server Instance 1
├── API Server Instance 2
└── API Server Instance N
        │
        ▼
PostgreSQL (primary + read replicas)
Redis (session + WS pub/sub)
S3 (file storage)
```

---

## 17. Folder Structure

```
/ (monorepo root)
├── package.json                    # Workspace config
├── pnpm-workspace.yaml             # pnpm workspace definition
│
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── index.ts            # Server entry
│   │   │   ├── routes/
│   │   │   │   ├── db.ts           # Database CRUD routes
│   │   │   │   ├── admin.ts        # Admin auth routes
│   │   │   │   ├── upload.ts       # File upload routes
│   │   │   │   └── tournament.ts   # Public tournament routes
│   │   │   ├── lib/
│   │   │   │   ├── database.ts     # DB engine
│   │   │   │   └── broadcast.ts    # WS helpers
│   │   │   └── middleware/
│   │   │       └── auth.ts         # JWT middleware
│   │   ├── database/               # JSON collection files
│   │   │   ├── players.json
│   │   │   └── ...
│   │   ├── uploads/                # Uploaded media files
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env                    # Never commit!
│   │
│   ├── sbg-army/
│   │   ├── src/
│   │   │   ├── main.tsx            # React entry
│   │   │   ├── App.tsx             # Router
│   │   │   ├── pages/
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── AdminPage.tsx   # Admin panel root
│   │   │   │   └── ...
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn/ui
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   │   ├── useDatabase.ts
│   │   │   │   └── useAuth.ts
│   │   │   └── lib/
│   │   │       ├── wsClient.ts
│   │   │       └── utils.ts
│   │   ├── public/                 # Static assets
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── package.json
│   │   └── .env                    # Never commit!
│   │
│   ├── sbg-tournament/             # Standalone tournament site
│   └── sbg-pro/                    # Enterprise platform
│
└── docs/                           # This documentation
```

---

## 18. Environment Configuration

### 18.1 API Server (.env)

```bash
# Required
SESSION_SECRET=<minimum 32 character random string>
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Optional
LOG_LEVEL=info                    # trace|debug|info|warn|error|fatal
CLERK_SECRET_KEY=<if using Clerk>
NODE_ENV=development              # development|production
```

### 18.2 Frontend (.env)

```bash
# Required
VITE_API_URL=http://localhost:5000

# Optional but recommended
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_SETUP_CODE=<one-time admin setup code>
VITE_CLERK_PUBLISHABLE_KEY=<if using Clerk>
```

### 18.3 Environment Variable Notes

- `VITE_API_URL` must be the **origin only** (no `/api` suffix): `https://api.example.com` not `https://api.example.com/api`
- `SESSION_SECRET` must be at least 32 characters and randomly generated. Server fails closed if not set.
- Never commit `.env` files to version control

---

*TRD v3.0 — SBG ARMY Esports Platform — July 2026*
