# API Documentation

Base URL: `https://api.sbgarmy.in/api` (production) or `http://localhost:8080/api` (development).
All endpoints are prefixed with `/api` (mounted in `artifacts/api-server/src/app.ts`).

## Authentication

Two independent auth mechanisms exist:

1. **Admin JWT** (primary, used by the CMS/admin panel): `POST /admin/login`
   returns a JWT signed with `SESSION_SECRET`. Send it as
   `Authorization: Bearer <token>` on subsequent admin-only requests
   (enforced by the `requireAdmin` middleware). Tokens are stored
   client-side in `sessionStorage`.
2. **Clerk** (optional, no-ops if `CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY`
   are unset): proxied through `/api/__clerk`.

Rate limits: 500 requests / 15 min per IP on all `/api` routes; 20 requests
/ 15 min per IP on `/api/__clerk` and admin login/setup/staff endpoints.

## ⚠️ Two storage backends — read this first

- **`/api/db` and `/api/db/:collection`** (in `routes/database.ts`) is the
  **primary, actively-used store** — a JSON-file-backed key/value store
  (`lib/store.ts`). This is what the frontend (`src/lib/database.ts` /
  `wsClient.ts`) reads and writes for essentially all CMS content: players,
  settings, sponsors, gallery, tournaments, ads, posts, navigation, staff
  accounts, etc. See the collection list in `lib/store.ts`'s `COLLECTIONS`
  array for the authoritative set.
- **`/api/players`, `/api/teams`, `/api/matches-pg`, `/api/rankings`,
  `/api/security/*`** are Postgres-backed (Drizzle) routes that exist in
  the codebase but are **not** currently wired up to the frontend — the
  frontend's "players" feature actually goes through `/api/db/players`
  above, not `/api/players`. Treat these as available-but-unused unless you
  build a new client that calls them directly.

If you're integrating a new client or debugging "my change isn't showing
up," always check which of the two stores the relevant frontend code
actually calls (`wsClient.ts` → `/api/db*`) before assuming the Postgres
route is involved.

## Core content endpoints (`/api/db`-backed)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/db` | none | Full DB snapshot (all collections), sensitive fields scrubbed |
| GET | `/db/:collection` | none | One collection, scrubbed |
| POST | `/db/:collection` | admin | Replace one collection |
| POST | `/db` | admin | Bulk-replace multiple collections in one call |
| GET | `/backup` | none | Download full DB as a JSON file |
| POST | `/restore` | admin | Restore full DB from an uploaded JSON backup |
| GET | `/db/ws-status` | none | Number of currently connected WebSocket clients |

Real-time updates: connecting to `wss://<host>/ws` streams `{"type":
"db_update", collection, data}` or `{"type": "db_update_bulk", updates}`
messages whenever any client writes via the endpoints above — this is how
multiple open admin tabs/browsers stay in sync without polling.

## Admin auth

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/admin/login` | rate-limited | Log in, returns a JWT |
| GET | `/admin/verify` | Bearer JWT | Verify a token is still valid |
| POST | `/admin/setup` | rate-limited | First-run admin account creation |
| POST | `/admin/staff` | rate-limited | Create a staff account |
| DELETE | `/admin/staff/:id` | rate-limited | Remove a staff account |

## Uploads

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/upload` | admin | Upload an image (multipart `image` field, ≤20MB, jpeg/png/gif/webp/svg), returns its public URL |
| GET | `/uploads/:filename` | none | Serve an uploaded image |

## Content management (a mix of JSON-store convenience routes and Postgres routes — see the warning above for which is actually live)

`ads`, `applications`, `audit-logs`, `contact`, `events`, `matches-pg`,
`memberships` + `coupons`, `navigation`, `players`, `posts`, `products` +
`orders`, `rankings`, `security/*`, `settings`, `sponsors`, `teams`,
`tournaments`, `users` each expose standard `GET` (list/detail), `POST`
(create), `PATCH` (update), `DELETE` (remove) endpoints following REST
conventions — see the corresponding file in `artifacts/api-server/src/routes/`
for exact request/response shapes and any collection-specific fields.

## Analytics

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/analytics/track` | none | Record a page-view/visit event |
| GET | `/platform/stats` | none | Aggregate platform stats |
| GET | `/platform/activity` | none | Recent activity feed |

## Health

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/healthz` | none | Liveness probe — used by Render's health check |

## Errors

All routes return JSON. Common shapes:
- `{ "error": "<message>" }` — 4xx client errors (validation, not found)
- `{ "ok": false, "error": "<message>" }` — used by database/backup/restore routes
- 500s are logged server-side (pino) and return a generic `{ "error": "Failed" }`

## Example

```bash
# Log in
curl -X POST https://api.sbgarmy.in/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}'
# → { "token": "eyJ..." }

# Update the players collection (admin-only)
curl -X POST https://api.sbgarmy.in/api/db/players \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '[{"id":"p1","name":"...", ...}]'
```
