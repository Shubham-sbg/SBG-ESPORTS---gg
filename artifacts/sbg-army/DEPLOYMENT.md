# SBG ARMY Frontend — Vercel Deployment

> **Default setup:** The frontend is served by the API server (Render).
> Use this guide only if you want to deploy the **frontend separately on Vercel** (split deploy).

## Quick Deployment (Vercel)

| Setting | Value |
|---------|-------|
| **Root Directory** | `artifacts/sbg-army` |
| **Framework** | Vite (auto-detected) |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist/public` |
| **Install Command** | `corepack enable && pnpm install --frozen-lockfile` |

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
