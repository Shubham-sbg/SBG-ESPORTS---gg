---
name: SBG ARMY external deployment conventions
description: Env-var conventions and infra requirements for deploying outside Replit (Vercel + Render + Postgres) without source changes.
---

## VITE_API_URL is origin-only
Set to the backend's origin with no path (e.g.
`https://sbg-army-api.onrender.com`), never with a trailing `/api`. Both
`wsClient.ts` (API + WS base) and `ImageUpload.tsx` (upload URL) read this
same variable and append their own paths — keep that convention if either
file changes, or the two will silently disagree on URL shape.

**Why:** `ImageUpload.tsx` already prefixed a full `/api/...` endpoint onto
this variable before the deployment-prep work; making it origin-only was
the only convention compatible with both call sites without changing
either one's existing path literals.

## Render needs a persistent disk for the JSON store
Most CMS content (players, settings, sponsors, gallery, etc.) is a
JSON-file store on local disk (`artifacts/api-server/database/`), not
Postgres. Render's default filesystem is wiped on every redeploy — a
persistent Disk mounted at that exact path is mandatory or admin-entered
content resets to defaults on every deploy.

## Postgres is required to boot even though it's barely used
The Postgres/Drizzle client (`lib/db`) is imported at server startup by a
few currently-dead routes (players/teams/matches/rankings/security via
Postgres — separate from and unused by the live JSON-store-backed
`/api/db/players` etc.). `DATABASE_URL` must be set or the process crashes
on boot, even in a deployment that never touches those routes.
