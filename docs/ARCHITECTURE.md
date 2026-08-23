# System Architecture Document
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Architecture Overview

### 1.1 High-Level System Diagram

```mermaid
graph TB
    subgraph Browser["Browser / Client"]
        PW[Public Website<br/>React SPA]
        AP[Admin Panel<br/>React SPA]
        IDB[(IndexedDB<br/>Client Cache)]
        WSC[WS Client<br/>wsClient.ts]
    end

    subgraph Server["API Server (Express 5)"]
        HTTP[REST API<br/>/api/*]
        WSS[WebSocket Server<br/>/ws]
        AUTH[Auth Middleware<br/>JWT + bcrypt]
        UPL[Upload Handler<br/>multer]
        LOG[Pino Logger]
    end

    subgraph DB["Persistence Layer"]
        DBE[Database Engine<br/>database.ts]
        JSON[(JSON Files<br/>*.json)]
        FS[(File System<br/>uploads/)]
    end

    subgraph External["External Services (Optional)"]
        SB[Supabase Auth]
        EJS[EmailJS]
        YT[YouTube Embed]
    end

    PW <-->|HTTP/REST| HTTP
    AP <-->|HTTP/REST| HTTP
    PW <-->|WebSocket| WSS
    AP <-->|WebSocket| WSS
    PW <-->|read/write| IDB
    AP <-->|read/write| IDB
    PW -.->|auth| SB
    PW -.->|contact| EJS
    PW -.->|live stream| YT

    HTTP --> AUTH
    HTTP --> DBE
    HTTP --> UPL
    WSS --> DBE
    AUTH --> LOG
    DBE --> JSON
    UPL --> FS
```

---

## 2. Frontend Architecture

### 2.1 Component Hierarchy

```mermaid
graph TD
    Root[main.tsx<br/>React Root]
    App[App.tsx<br/>Router]
    
    Root --> App
    
    App --> PL[Public Layout]
    App --> AL[Admin Layout]
    
    PL --> NB[Navbar]
    PL --> PAGES[Page Components]
    PL --> FT[Footer]
    
    NB --> LOGO[Logo]
    NB --> LINKS[Nav Links<br/>from DB]
    NB --> MOB[Mobile Menu]
    NB --> CTA[CTA Button]
    
    PAGES --> HP[HomePage]
    PAGES --> TP[TournamentsPage]
    PAGES --> NP[NewsPage]
    PAGES --> GP[GalleryPage]
    PAGES --> CP[ContactPage]
    PAGES --> SC[SchedulePage]
    PAGES --> AB[AboutPage]
    PAGES --> HOF[HallOfFamePage]
    PAGES --> COM[CommunityPage]
    PAGES --> SH[ShopPage]
    PAGES --> LV[LivePage]
    
    HP --> HERO[HeroSection<br/>Three.js / CSS]
    HP --> TM[TeamsShowcase]
    HP --> NW[NewsPreview]
    HP --> SP[SponsorTicker]
    
    AL --> SIDEBAR[AdminSidebar]
    AL --> ADMHDR[AdminHeader]
    AL --> MODULES[Admin Modules]
    
    MODULES --> PLM[Player Manager]
    MODULES --> TMM[Team Manager]
    MODULES --> TRN[Tournament Manager]
    MODULES --> CMS[News CMS]
    MODULES --> GLR[Gallery Manager]
    MODULES --> SET[Site Settings]
    MODULES --> STF[Staff Manager]
    MODULES --> ANA[Analytics]
    MODULES --> BCK[Backup/Restore]
```

### 2.2 State Flow

```mermaid
sequenceDiagram
    participant Client
    participant IndexedDB
    participant WSClient
    participant APIServer
    participant Database

    Client->>IndexedDB: Load cached state (fast)
    Client->>WSClient: Connect to /ws
    WSClient->>APIServer: WebSocket handshake
    APIServer->>Database: Load all collections
    Database-->>APIServer: Full DB state
    APIServer-->>WSClient: {type: 'db_init', data: {...}}
    WSClient-->>Client: Update React state
    Client->>IndexedDB: Persist updated state
    
    Note over Client,Database: Real-time update flow
    
    Client->>APIServer: POST /api/db/players (admin action)
    APIServer->>Database: Write players.json
    APIServer-->>WSClient: Broadcast {type:'db_update', collection:'players'}
    WSClient-->>Client: Update players state
    Client->>IndexedDB: Update cache
```

### 2.3 Data Loading Strategy

```
Page Mount
    │
    ▼
Check IndexedDB cache
    │
  ┌─┴──┐
Hit   Miss
 │      │
 ▼      ▼
Render  Show
cached  skeleton
state   loader
 │      │
 └──┬───┘
    │
    ▼
Connect WebSocket
    │
    ▼
Receive db_init from server
    │
    ▼
Merge server state with local
(server is source of truth)
    │
    ▼
Re-render with fresh data
    │
    ▼
Persist to IndexedDB
    │
    ▼
Listen for db_update events
(incremental updates)
```

---

## 3. Backend Architecture

### 3.1 Express Middleware Pipeline

```mermaid
graph LR
    REQ[Request] --> CORS[CORS<br/>Check]
    CORS --> BODY[Body<br/>Parser<br/>10MB]
    BODY --> LOG[Pino<br/>Logger]
    LOG --> STATIC[Static<br/>Files<br/>/uploads]
    LOG --> ROUTE[Route<br/>Match]
    ROUTE --> AUTH[requireAdmin<br/>JWT Check]
    AUTH --> HANDLER[Route<br/>Handler]
    HANDLER --> DB[Database<br/>Engine]
    DB --> WS[WS<br/>Broadcast]
    HANDLER --> RES[Response]
```

### 3.2 Database Engine Architecture

```mermaid
graph TB
    REQ[API Request] --> DBE[Database Engine]
    
    DBE --> CACHE[In-Memory Cache<br/>Map<string, Record[]>]
    
    CACHE --> READ{Read or Write?}
    
    READ -->|Read| RETURN[Return cached data]
    READ -->|Write| VALIDATE[Validate input]
    VALIDATE --> UPDATE[Update in-memory cache]
    UPDATE --> WRITE[Atomic file write<br/>*.json]
    WRITE --> BROADCAST[WS Broadcast<br/>db_update]
    BROADCAST --> CLIENTS[All WS Clients]
    
    subgraph Startup
        INIT[Server Start] --> LOAD[Load all JSON files<br/>into memory]
        LOAD --> CACHE
    end
```

---

## 4. Authentication Architecture

### 4.1 JWT Token Flow

```mermaid
sequenceDiagram
    participant Browser
    participant AdminGuard
    participant LoginPage
    participant APIServer
    participant bcrypt
    participant Database

    Browser->>AdminGuard: Access /admin/*
    AdminGuard->>AdminGuard: Check sessionStorage for JWT
    
    alt No token or expired
        AdminGuard->>LoginPage: Redirect to /admin/login
        LoginPage->>Browser: Display login form
        Browser->>APIServer: POST /api/admin/login {username, password}
        APIServer->>Database: Find staff by username
        Database-->>APIServer: Staff record (with hash)
        APIServer->>bcrypt: compare(password, hash)
        bcrypt-->>APIServer: valid/invalid
        
        alt Valid
            APIServer->>APIServer: jwt.sign({id, username, role, permissions})
            APIServer-->>Browser: {token, user}
            Browser->>Browser: sessionStorage.setItem('admin_token', token)
            Browser->>AdminGuard: Retry navigation
            AdminGuard-->>Browser: Allow access
        else Invalid
            APIServer-->>Browser: 401 {error: "Invalid credentials"}
        end
    else Token valid
        AdminGuard-->>Browser: Allow access to module
    end
    
    loop Every 20 minutes
        AdminGuard->>APIServer: POST /api/admin/refresh
        APIServer-->>AdminGuard: New token
        AdminGuard->>Browser: Update sessionStorage
    end
```

---

## 5. WebSocket Architecture

### 5.1 Connection Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Disconnected: Page load
    Disconnected --> Connecting: App mounts
    Connecting --> Connected: WS handshake success
    Connected --> Syncing: Receive db_init
    Syncing --> Live: State updated
    Live --> Live: db_update events
    Live --> Disconnected: Network drop / server restart
    Disconnected --> Connecting: Reconnect timer fires
    Connecting --> Disconnected: Connection refused (backoff)
    Live --> Reconnecting: Connection lost
    Reconnecting --> Connected: Reconnect success
    Connected --> Syncing: Re-sync full state
```

### 5.2 Message Types

```mermaid
graph LR
    SERVER[Server] -->|db_init| CLIENT[All Clients]
    SERVER -->|db_update| CLIENT
    SERVER -->|db_update_bulk| CLIENT
    SERVER -->|ping| CLIENT
    CLIENT -->|pong| SERVER
```

| Message Type | Direction | Payload | Description |
|-------------|-----------|---------|-------------|
| `db_init` | Server → Client | Full DB state | Sent on new connection |
| `db_update` | Server → Client | `{collection, data}` | Single collection updated |
| `db_update_bulk` | Server → Client | `{collections: {...}}` | Multiple collections updated |
| `ping` | Server → Client | `{}` | Keepalive |
| `pong` | Client → Server | `{}` | Keepalive response |

---

## 6. Data Flow Diagrams

### 6.1 Read Data Flow (Public Page)

```
User visits /tournaments
        │
        ▼
App.tsx loads TournamentsPage
        │
        ▼
useDatabase() hook
        │
    ┌───┴───┐
   IDB     WS
  Cache  Update
    │       │
    ▼       ▼
  Render  Re-render
 (fast)   (fresh)
        │
        ▼
Display tournaments list
with registration buttons
```

### 6.2 Write Data Flow (Admin Action)

```
Admin edits player in panel
        │
        ▼
Form submit
        │
        ▼
POST /api/db/players
{Authorization: Bearer <token>}
        │
        ▼
requireAdmin() middleware
verifies JWT
        │
        ▼
Handler validates payload
        │
        ▼
database.ts saves players.json
        │
        ▼
broadcast() sends db_update
to all WS connections
        │
    ┌───┴───────────┐
Admin tab        All other
updates          clients update
instantly        within 500ms
```

### 6.3 File Upload Data Flow

```
Admin uploads player image
        │
        ▼
POST /api/upload
multipart/form-data
{file, category: 'players'}
        │
        ▼
multer middleware
saves to /uploads/players/<uuid>.<ext>
        │
        ▼
Response: {url: '/uploads/players/<file>'}
        │
        ▼
Admin panel stores URL
in player record
        │
        ▼
POST /api/db/players
(update with image URL)
        │
        ▼
Public site renders
<img src="https://api.domain.com/uploads/players/<file>">
```

---

## 7. Deployment Architecture

### 7.1 Production Infrastructure

```mermaid
graph TB
    subgraph CDN["CDN / Edge (Cloudflare)"]
        CF[Cloudflare CDN<br/>TLS termination<br/>DDoS protection]
    end

    subgraph Frontend["Frontend Hosting (Static)"]
        FE[Vite Build Output<br/>HTML + JS + CSS<br/>Static Site Host]
    end

    subgraph Backend["API Server (Render / VPS)"]
        API[Express API Server<br/>Node.js 20<br/>Port 5000]
        WS[WebSocket Server<br/>Same process]
    end

    subgraph Storage["Persistent Storage"]
        DISK[Persistent Disk<br/>/uploads - Media files<br/>/database - JSON files]
    end

    Internet -->|HTTPS 443| CF
    CF -->|HTTPS| FE
    CF -->|HTTPS/WSS| API
    API --> DISK
    FE -.->|VITE_API_URL| API
```

### 7.2 Request Routing

```
User Request: https://sbgarmy.gg/
    → CDN serves static React build
    → React router handles /*, /admin, etc.
    → SPA calls https://api.sbgarmy.gg/api/* for data
    → SPA connects WSS://api.sbgarmy.gg/ws for real-time
```

---

## 8. Security Architecture

### 8.1 Defense Layers

```
Internet Request
        │
        ▼
[Layer 1] TLS/HTTPS — Cloudflare/Load Balancer
        │
        ▼
[Layer 2] CORS — Only configured origins allowed
        │
        ▼
[Layer 3] Rate Limiting — Auth: 5/15min per IP
        │
        ▼
[Layer 4] JWT Verification — All /admin/* routes
        │
        ▼
[Layer 5] Role/Permission Check — Per module
        │
        ▼
[Layer 6] Input Validation — Zod schemas
        │
        ▼
[Layer 7] Output Sanitization — Strip passwords/tokens
        │
        ▼
Database Write / Response
```

---

## 9. Monorepo Structure

### 9.1 Workspace Graph

```mermaid
graph TD
    ROOT[workspace root<br/>pnpm-workspace.yaml]
    
    ROOT --> API[artifacts/api-server<br/>Express + WS + DB]
    ROOT --> ARMY[artifacts/sbg-army<br/>Public + Admin React]
    ROOT --> TNMT[artifacts/sbg-tournament<br/>Standalone Tournament]
    ROOT --> PRO[artifacts/sbg-pro<br/>Enterprise Platform]
    ROOT --> MOCK[artifacts/mockup-sandbox<br/>Component Preview]
    
    ARMY -.->|HTTP/WS at runtime| API
    TNMT -.->|HTTP/WS at runtime| API
    PRO -.->|HTTP/WS at runtime| API
```

### 9.2 Shared Configuration

- TypeScript configuration: each workspace has its own `tsconfig.json`
- Tailwind: shared base config extended by each frontend workspace
- pnpm: version pinned via `.npmrc` + `packageManager` in root `package.json`

---

*Architecture Document v3.0 — SBG ARMY Esports Platform — July 2026*
