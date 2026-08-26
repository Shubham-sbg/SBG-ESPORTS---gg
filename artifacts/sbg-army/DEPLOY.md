# Deploying this folder (frontend) to Vercel

This folder is the entire frontend — a static Vite/React build. It talks to
the backend (`artifacts/api-server`, deployed separately to Render) purely
over HTTP/WebSocket using an environment variable; it does not need the
backend's source code to build or run.

## Vercel project settings

| Setting | Value |
|---|---|
| Root Directory | `artifacts/sbg-army` |
| Build Command | `npm install && npm run build` |
| Output/Publish Directory | `dist` |

These are already encoded in [`vercel.json`](./vercel.json) in this folder —
Vercel reads them automatically when you import the repo with this Root
Directory. The build command `cd`s up to the monorepo root because this is a
pnpm workspace: the frontend depends on shared packages under `/lib`, which
must be present and typechecked before Vite builds.

## Environment variables (set in Vercel dashboard)

| Variable | Required | Value |
|---|---|---|
| `VITE_API_URL` | Only if the backend is on a different domain (e.g. Render) | Backend origin only — no trailing slash, no `/api` suffix. Example: `https://sbg-army-api.onrender.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Optional | Only needed if Clerk auth is enabled for this build |

Leave `VITE_API_URL` unset only if frontend and backend are served from the
same domain (e.g. both proxied behind one custom domain) — the app falls
back to relative `/api` and same-origin WebSocket, which is the current
default (non-split) behavior.

## No source changes needed

Every environment-specific behavior (API base URL, WebSocket URL) is driven
by `VITE_API_URL` at build time — see `src/lib/wsClient.ts`. You should
never need to hardcode a backend URL in this codebase.

## Full guide

See [`/docs/deployment/05-vercel-frontend.md`](../../docs/deployment/05-vercel-frontend.md)
for the click-by-click walkthrough, and [`/deploy/README.md`](../../deploy/README.md)
for the fastest end-to-end path (both apps together).
