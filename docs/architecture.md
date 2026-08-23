# Technical Design Document — SBG ARMY

## Summary

SBG ARMY is a pnpm-workspace monorepo containing a React/Vite frontend
(`artifacts/sbg-army`), an Express/Node API server (`artifacts/api-server`),
and shared TypeScript packages (`lib/db`, `lib/api-zod`,
`lib/api-client-react`, `lib/api-spec`). An archived enterprise variant
frontend (`artifacts/sbg-pro`) also exists in the workspace but is not the
live product.

## Data model

Two independent stores, by design (see [api/README.md](api/README.md) for
the full breakdown):

1. **JSON file store** (`artifacts/api-server/lib/store.ts`) — the
   authoritative store for essentially all site content: players, settings,
   sponsors, tournaments, achievements, gallery, etc. Read/write via
   `GET/POST /api/db[/:collection]`. In-memory cached, flushed to
   `artifacts/api-server/database/*.json` on every write.
2. **PostgreSQL via Drizzle** (`lib/db`) — used by a handful of routes
   (`players.ts`, `teams.ts`, `matches_pg.ts`, `rankings.ts`, `security.ts`)
   that are present in the codebase but not currently exercised by the live
   frontend. Required for the server process to boot (the schema module
   throws if `DATABASE_URL` is unset), even in deployments that never touch
   these routes.

## Client-side caching & sync

The frontend keeps an in-memory singleton (`dbCache` in
`src/lib/database.ts`), persisted to IndexedDB, and synchronized across
browser tabs via `BroadcastChannel` and across sessions/devices via a
WebSocket (`src/lib/wsClient.ts`) that receives `db_update`/`db_update_bulk`
events broadcast by the server on every write.

**Reconnect resync**: if the WebSocket drops (e.g. a backgrounded tab is
throttled by the browser) and later reconnects, the client automatically
re-fetches the full server state (`resyncFromServer()`) before trusting its
local cache again — this prevents a stale tab from bulk-overwriting data
that changed elsewhere while it was disconnected. A 3-minute interval and a
`visibilitychange` listener provide a safety net for connections that drop
without a clean WebSocket close event.

## Authentication

- **Admin/staff**: bcrypt password hashing + JWT (signed with
  `SESSION_SECRET`), issued by `POST /api/admin/login`, verified by the
  `requireAdmin` middleware on writes to `/api/db*`.
- **Clerk** (optional): proxied through `/api/__clerk` so it works without
  custom DNS/CNAME setup; entirely inert if its env vars are unset.

## Deployment topology (production)

See [deployment/00-overview.md](deployment/00-overview.md) for the full
diagram and rationale. Summary: Vercel (frontend, static build) + Render
(backend, Node process with a persistent disk for the JSON store and
uploads) + managed Postgres (Render/Neon/Supabase).

## Security posture

- `helmet` for standard security headers
- `express-rate-limit`: 500 req/15min general, 20 req/15min on auth-sensitive routes
- CORS: configurable allow-list via `CORS_ORIGIN` (defaults to permissive same-origin behavior when unset, matching current Replit deployment)
- Sensitive fields (`staffAccounts.password`, `playerUsers.passwordHash`) are stripped from all public JSON-store reads and merged back in server-side on writes so a client can never accidentally erase them by round-tripping a scrubbed object

## Known architectural notes (not changed as part of production-readiness work)

- Two parallel players/teams/matches implementations exist (JSON store vs.
  Postgres) — see the warning in [api/README.md](api/README.md). This is
  pre-existing and intentionally left as-is per the "preserve all
  functionality" requirement; consolidating them is a larger follow-up.
- Full-snapshot bulk writes (`POST /api/db`) are last-write-wins with no
  optimistic concurrency control. The client-side reconnect-resync
  mitigation above significantly reduces the practical risk, but two admins
  editing unrelated fields at the exact same moment could still race.
