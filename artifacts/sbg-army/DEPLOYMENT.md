# SBG ARMY Frontend — Production Deployment (Render / Vercel)

> **Static Site Deployment Guide** for `artifacts/sbg-army`.

## Render Static Site Settings

| Setting | Value |
|---------|-------|
| **Name** | `sbg-esports` |
| **Root Directory** | `artifacts/sbg-army` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Render Redirects / Rewrites (Crucial for SPA Routing)
Add a Rewrite rule in Render Dashboard (or via `render.yaml`):
- **Type**: `Rewrite`
- **Source**: `/*`
- **Destination**: `/index.html`

## Vercel Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `artifacts/sbg-army` |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

> The `vercel.json` in this folder is already configured correctly. Vercel will pick it up automatically.

## Required Environment Variables (split deploy)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL, e.g. `https://sbg-api.onrender.com` — **no trailing slash, no `/api` suffix** |

## Optional Environment Variables

| Variable | When needed |
|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | If Clerk player login is enabled |
| `VITE_SETUP_CODE` | Admin setup protection code |

## CORS on the Backend

When the frontend is on Vercel and the API is on Render, you **must** set `CORS_ORIGIN` on the Render service:

```
CORS_ORIGIN=https://your-app.vercel.app
```

## Build Output

The built site is written to `dist/public/`. This is a standard SPA — all routes serve `index.html` (already configured in `vercel.json`).

## Included vercel.json

- All routes rewrite to `index.html` (SPA routing)
- Security headers on all responses
- Immutable cache for hashed assets (`/assets/*`)
