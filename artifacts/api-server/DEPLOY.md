# Deploying this folder (backend) to Render

This folder is the entire backend — an Express + WebSocket server. It also
serves the pre-built frontend as static files when `artifacts/sbg-army/dist/public`
exists next to it (same-domain deployment); for a split deployment (frontend
on Vercel, this on Render) that static-serving code simply never finds the
folder and no-ops.

## Render Blueprint settings

Render Root Directory for this service is the **repo root** (`.`), not this
folder — the build command needs the pnpm workspace root to install shared
packages under `/lib` and reference the frontend for static serving.

| Setting | Value |
|---|---|
| Root Directory | `.` (repo root) |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build` |
| Start Command | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| Health Check Path | `/api/healthz` |

These are already encoded in [`/render.yaml`](../../render.yaml) at the repo
root — Render picks it up automatically via "New +" → "Blueprint".

## Persistent disk — do not skip

Most CMS content (players, settings, sponsors, gallery, etc.) is a JSON-file
store in `database/` next to this file, and uploaded images live in
`database/uploads/`. Render's default filesystem is wiped on every redeploy.
`render.yaml` already declares a disk mounted at
`artifacts/api-server/database` — if you set the service up manually instead
of via Blueprint, you must add that disk yourself or admin-entered content
will silently reset to defaults on every deploy.

## Environment variables (set in Render dashboard)

| Variable | Required | Notes |
|---|---|---|
| `PORT` | Yes | `8080` |
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | **Yes** | Process fails to boot without it — a few routes (players/teams/matches/rankings via Postgres, separate from the JSON store above) require it even if unused in your setup |
| `SESSION_SECRET` | Yes | Admin/staff login returns 503 without it. Generate with `openssl rand -base64 32` |
| `CORS_ORIGIN` | Only for split deployments | Comma-separated frontend origin(s), e.g. `https://sbgarmy.in,https://www.sbgarmy.in`. Unset reflects any origin (only safe for same-domain deployments) |
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` | Optional | Only if Clerk auth features are enabled |
| `GOOGLE_API_KEY` | Optional | Only if a Google-API-backed feature is enabled |

## No source changes needed

CORS behavior is driven entirely by `CORS_ORIGIN` at runtime — see
`src/app.ts`. Unset defaults to the current same-origin-permissive behavior.

## Full guide

See [`/docs/deployment/04-render-backend.md`](../../docs/deployment/04-render-backend.md)
for the click-by-click walkthrough, and [`/deploy/README.md`](../../deploy/README.md)
for the fastest end-to-end path (both apps together).
