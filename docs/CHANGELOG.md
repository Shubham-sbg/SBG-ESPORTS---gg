# Changelog

## Unreleased — Production Deployment Readiness

No UI, UX, feature, or data-model changes. Scope: making the existing
Express + Postgres + JSON-file-store stack deployable outside Replit
(Vercel + Render + managed Postgres) purely through environment variables.

### Added
- `render.yaml` — Render Blueprint for the API server, including a
  persistent disk for the JSON CMS store and uploads.
- `artifacts/sbg-army/vercel.json` — Vercel build/output/rewrite config for the frontend.
- `deploy/Dockerfile`, `deploy/docker-compose.yml`, `deploy/nginx.conf` — optional self-hosted alternative, updated to target the live `sbg-army` app (previously referenced the archived `sbg-pro` variant and an unused Firebase config, both removed).
- `deploy/.env.example` — consolidated environment variable reference for both frontend and backend.
- `/docs/deployment/*` — beginner-friendly, step-by-step deployment guides (GitHub, environment variables, database, Render, Vercel, domain/SSL, testing, backup/restore/rollback, troubleshooting, production checklist).
- `/docs/api/README.md` — full API endpoint reference, including a call-out that `/api/db*` (JSON store) is the actively-used content API, distinct from the unused Postgres-backed `/api/players` etc. routes.
- `/docs/admin/README.md` — admin panel feature-to-collection reference.
- `/docs/architecture.md` — technical design document.

### Changed (code, env-var-gated, no behavior change by default)
- `artifacts/sbg-army/src/lib/wsClient.ts` — API base URL and WebSocket URL are now derived from `VITE_API_URL` when set (split-origin deployments), falling back to the existing relative `/api` / same-origin WS behavior when unset (default, matches current Replit deployment exactly).
- `artifacts/api-server/src/app.ts` — CORS origin is now configurable via `CORS_ORIGIN` (comma-separated allow-list) for split-origin deployments, defaulting to the existing permissive same-origin-reflecting behavior when unset.
- `artifacts/sbg-army/src/lib/wsClient.ts` / `database.ts` — WebSocket reconnect now triggers a full resync from the server (`resyncFromServer()`), with a periodic safety-net refresh, to fix a pre-existing bug where a stale browser tab's in-memory cache (after a dropped connection) could bulk-overwrite newly added data such as players.

### Removed
- `deploy/firebase.json`, `deploy/vercel.json` — stale scaffolding from an earlier, incorrect assumption that this project used Firebase and targeted the archived `sbg-pro` frontend; this project has never used Firebase.
