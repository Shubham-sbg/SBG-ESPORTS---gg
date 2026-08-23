# Deploy SBG ARMY — Quick Start

This folder plus the root-level `render.yaml` and `artifacts/sbg-army/vercel.json`
are everything you need to take this repo from GitHub to a live production
deployment. Full step-by-step guides live in [`/docs/deployment`](../docs/deployment/README.md) —
this file is just the fast path.

## What's in here

| File | Used by | Purpose |
|---|---|---|
| `../render.yaml` | Render | Backend web service + persistent disk + Postgres (must stay at repo root — Render only auto-detects it there) |
| `../artifacts/sbg-army/vercel.json` | Vercel | Frontend build/output/rewrite config (must stay next to the frontend app — Vercel's Root Directory setting points there) |
| `.env.example` | You | Every environment variable used, with comments. Copy values into Render/Vercel dashboards — never into a file you commit |
| `Dockerfile`, `docker-compose.yml`, `nginx.conf` | Optional self-hosting | Only needed if you run your own server instead of Vercel + Render |

## Fastest path: GitHub → Render → Vercel

```
1. Push this repo to GitHub                         → docs/deployment/01-github.md
2. Create a Postgres database                        → docs/deployment/03-database.md
3. Render → New → Blueprint → select this repo        → docs/deployment/04-render-backend.md
   (picks up ../render.yaml automatically, including
   the persistent disk your CMS data needs)
4. Vercel → Add New Project → select this repo,
   Root Directory = artifacts/sbg-army                → docs/deployment/05-vercel-frontend.md
5. Set VITE_API_URL (Vercel) and CORS_ORIGIN (Render)
   once you know both domains, then redeploy both      → docs/deployment/02-environment-variables.md
6. Run through the testing checklist                   → docs/deployment/07-testing-checklist.md
```

That's it — steps 3 and 4 are literally "point the platform at the repo,"
since the config files here tell each platform exactly how to build and run
the app. No source code changes are needed after this; only environment
variables in the Render/Vercel dashboards going forward.

## Critical thing not to skip

Render's default filesystem resets on every deploy. `render.yaml` already
configures a persistent disk for the JSON-file CMS store — if you set the
backend up manually instead of via Blueprint, you **must** add that disk
yourself (see [docs/deployment/04-render-backend.md](../docs/deployment/04-render-backend.md#4.3)),
or admin-entered content will silently reset on every redeploy.

## Self-hosting instead (own VPS)

```bash
pnpm --filter @workspace/sbg-army run build
cp deploy/.env.example deploy/.env   # fill in real values, never commit this file
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```
