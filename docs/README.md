# SBG ARMY Esports Platform — Master Documentation Index

> **Enterprise Documentation Suite** | Version 3.0 | Last Updated: July 2026

---

## Overview

SBG ARMY is a full-stack esports organization management platform featuring a public-facing website, an administrative control panel, real-time database synchronization, a tournament engine, player/team management, CMS, shop, analytics, and more.

---

## Documentation Map

| # | Document | Description | Est. Pages |
|---|----------|-------------|------------|
| 1 | [PRD — Product Requirements Document](PRD.md) | Vision, goals, personas, user stories, features, roadmap | ~90 |
| 2 | [TRD — Technical Requirements Document](TRD.md) | Architecture, stack, APIs, DB, auth, deployment, performance | ~120 |
| 3 | [SRS — Software Requirements Specification](SRS.md) | Functional & non-functional requirements, use cases, constraints | ~60 |
| 4 | [ARCHITECTURE — System Architecture](ARCHITECTURE.md) | Frontend, backend, data flow, Mermaid diagrams | ~40 |
| 5 | [DATABASE — Database Design](DATABASE.md) | All collections, fields, indexes, relationships, ER diagrams | ~35 |
| 6 | [API — API Reference](API.md) | Every endpoint, request/response, auth, error codes | ~60 |
| 7 | [UI-UX — Design System](UI-UX.md) | Colors, typography, components, animations, breakpoints | ~40 |
| 8 | [ADMIN-PANEL — Admin Specification](ADMIN-PANEL.md) | Every admin module, CRUD, roles, permissions | ~50 |
| 9 | [DEPLOYMENT — Deployment Guide](DEPLOYMENT.md) | Hosting, CI/CD, env vars, SSL, domain, rollback | ~30 |
| 10 | [SECURITY — Security Document](SECURITY.md) | Auth, rules, rate limiting, XSS/CSRF, validation | ~35 |
| 11 | [TESTING — Testing Guide](TESTING.md) | Unit, integration, UI, security, performance tests | ~30 |
| 12 | [MAINTENANCE — Maintenance Guide](MAINTENANCE.md) | Monitoring, logging, backup, restore, troubleshooting | ~25 |
| 13 | [ROADMAP — Feature Roadmap & Changelog](ROADMAP.md) | V1–V5 history, upcoming features, priorities | ~20 |
| 14 | [BRAND — Brand Guidelines](BRAND.md) | Logo, colors, fonts, esports identity, sponsor placement | ~20 |

---

## Quick-Start for Developers

```bash
# Clone and install
git clone <repo-url>
cd sbg-army
pnpm install

# Environment setup
cp artifacts/api-server/.env.example artifacts/api-server/.env
cp artifacts/sbg-army/.env.example artifacts/sbg-army/.env

# Start all services
pnpm --filter @workspace/api-server run dev   # API on :5000
pnpm --filter @workspace/sbg-army run dev     # Frontend on :3000
```

> **Full setup instructions:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Platform Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│              SBG ARMY ESPORTS PLATFORM              │
├──────────────────────┬──────────────────────────────┤
│   PUBLIC WEBSITE     │      ADMIN PANEL             │
│   React + Wouter     │   JWT-Protected SPA          │
│   Framer Motion      │   18+ Management Modules     │
│   Three.js Hero      │   Real-time DB Sync          │
├──────────────────────┴──────────────────────────────┤
│              API SERVER (Express 5)                 │
│   REST Endpoints + WebSocket (ws)                   │
│   JWT Auth (bcryptjs) + Role-Based Access           │
├─────────────────────────────────────────────────────┤
│         JSON FLAT-FILE DATABASE (Node.js)           │
│   IndexedDB Client Cache + WS Broadcast Sync        │
└─────────────────────────────────────────────────────┘
```

---

## Key Technologies

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite |
| Routing | Wouter |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Animations | Framer Motion + Three.js |
| Charts | Recharts |
| Backend | Express 5 + Node.js |
| Real-time | WebSocket (ws library) |
| Auth | JWT + bcryptjs |
| Persistence | JSON flat-file + IndexedDB client cache |
| Logging | Pino |
| Package Manager | pnpm (workspace monorepo) |

---

## Repository Structure

```
/
├── artifacts/
│   ├── api-server/          # Express API + JSON database
│   ├── sbg-army/            # Main public + admin React app
│   ├── sbg-tournament/      # Standalone tournament site
│   └── sbg-pro/             # Enterprise platform
├── docs/                    # ← You are here
│   ├── README.md            # This file
│   ├── PRD.md
│   ├── TRD.md
│   └── ...
└── package.json             # Workspace root
```

---

*Documentation generated July 2026. For the most current state, re-run documentation generation against the latest codebase.*
