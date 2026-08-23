# Overview — Architecture & What Goes Where

## Current stack (unchanged)

- **Frontend**: React + Vite (`artifacts/sbg-army`) — static site after build
- **Backend**: Node.js + Express (`artifacts/api-server`) — REST API + WebSocket
- **Primary CMS data**: JSON files on disk (`artifacts/api-server/database/*.json`) — players, settings, sponsors, gallery, tournaments, etc.
- **Uploaded images**: local disk (`artifacts/api-server/database/uploads/`)
- **Relational data**: PostgreSQL via Drizzle ORM (`lib/db`) — used by a few routes (players/teams/matches/rankings/security tables); required for the server to boot even if you don't use those routes
- **Admin auth**: bcrypt-hashed passwords + JWT, signed with `SESSION_SECRET`
- **Optional**: Clerk auth (no-ops if its env vars are unset)

None of this changes for production — you're only choosing where each piece
*runs*, and wiring it together with environment variables.

## Where each piece lives in production

```
┌─────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Vercel         │  API   │   Render          │  SQL   │  Postgres        │
│   (frontend,     │ ─────► │   (backend,       │ ─────► │  (Render/Neon/   │
│   static build)  │  +WS   │   Express+Node)   │        │   Supabase)      │
└─────────────────┘        └──────────────────┘        └──────────────────┘
                                     │
                                     ▼
                            Persistent Disk
                            (JSON CMS data +
                             uploaded images)
```

- The frontend talks to the backend over HTTPS + WSS using `VITE_API_URL`
  (see [02-environment-variables.md](02-environment-variables.md)).
- The backend needs a **persistent disk** for its JSON database and uploads
  directory — Render's default filesystem resets on every deploy/restart,
  which would silently wipe admin-entered content. `render.yaml` already
  configures this disk for you.
- Postgres is only required because a handful of routes import the Drizzle
  client at startup; it does not need to hold your main CMS content.

## One-origin vs. split-origin

You have two supported options:

1. **Split origin (recommended, what these guides walk through)**: frontend
   on `sbgarmy.in` (Vercel), backend on `api.sbgarmy.in` (Render). Requires
   `VITE_API_URL` and `CORS_ORIGIN` to be set.
2. **Single origin**: put a reverse proxy (Vercel rewrites, or your own
   nginx — see `deploy/docker-compose.yml`) in front of both so the browser
   only ever sees one domain. Leave `VITE_API_URL`/`CORS_ORIGIN` unset in
   this case, matching current Replit behavior.

## What you will NOT need to touch after go-live

Once deployed, all future changes to config are through environment
variables in the Vercel and Render dashboards — you will not edit source
code to change environments (dev vs. production), rotate secrets, or point
at a different database.
