# API Server — Render Deployment

## What this does

- Serves the REST API at `/api/*`
- Hosts WebSocket at `/ws` for real-time DB sync
- In production, also **serves the compiled SBG ARMY frontend** from `../sbg-army/dist/public`
- Stores all data in `database/` as JSON flat files (needs a persistent disk)
- Stores uploaded images in `database/uploads/`

## Quick Deployment (Render)

| Setting | Value |
|---------|-------|
| **Root Directory** | `.` (repo root) |
| **Runtime** | Node |
| **Build Command** | `cd artifacts/sbg-army && pnpm install && pnpm run build && cd ../api-server && pnpm install && pnpm run build` |
| **Start Command** | `cd artifacts/api-server && node --enable-source-maps ./dist/index.mjs` |

## Required Environment Variables

| Variable | Value |
|----------|-------|
| `PORT` | Injected automatically by Render |
| `SESSION_SECRET` | Generate: `openssl rand -hex 32` |
| `NODE_ENV` | `production` |

## Optional Environment Variables

| Variable | When needed |
|----------|-------------|
| `CORS_ORIGIN` | Split deploy — set to Vercel frontend URL |
| `CLERK_PUBLISHABLE_KEY` | If Clerk player login is enabled |
| `CLERK_SECRET_KEY` | If Clerk player login is enabled |
| `LOG_LEVEL` | Default `info`. Set to `warn` in production for less noise. |

## Persistent Disk (Required)

The JSON database is stored at `artifacts/api-server/database/`.
On Render's ephemeral filesystem this is **wiped on every deploy**.

**Add a Persistent Disk** to your Render service:
- Mount path: `/opt/render/project/src/artifacts/api-server/database`
- Size: 1 GB minimum

This keeps all your data, admin accounts, and uploaded images safe across deploys.

## Admin Setup After Deploy

1. Visit `https://your-render-url.onrender.com/admin-setup` (first-time only)
2. Set your admin password
3. Log in at `https://your-render-url.onrender.com/admin`

## Build Output

```
artifacts/api-server/dist/index.mjs   ← compiled server entry
artifacts/sbg-army/dist/public/       ← compiled frontend (served as static)
```
