# 9. Troubleshooting

## Render backend

**Build fails with "Use pnpm instead"**
The repo's `preinstall` script blocks npm/yarn. Make sure the Build Command
starts with `corepack enable && pnpm install ...` exactly as in
`render.yaml`.

**Server crashes immediately: "DATABASE_URL must be set"**
`DATABASE_URL` is missing or empty in Render's Environment tab. See
[03-database.md](03-database.md).

**Admin login returns 503 "Server misconfiguration: SESSION_SECRET not set"**
Add `SESSION_SECRET` in Render's Environment tab (generate with
`openssl rand -base64 32`) and redeploy.

**Data (players, settings, images) disappears after a redeploy**
The persistent disk isn't mounted, or is mounted at the wrong path. Confirm
in Render → service → **Disks** that a disk is mounted at exactly
`/opt/render/project/src/artifacts/api-server/database`.

**Free-tier service "spins down" and the first request after idle is slow**
Expected behavior on Render's free plan — the first request after ~15
minutes of inactivity can take 30–60s while the instance wakes up. Upgrade
to a paid plan to avoid this for a live production admin panel.

## Vercel frontend

**Build fails: "pnpm: command not found" or wrong Node/pnpm version**
Ensure the Install Command includes `corepack enable` (see
[05-vercel-frontend.md](05-vercel-frontend.md)).

**Build succeeds but site is blank / 404 on refresh of a non-home route**
Confirm `artifacts/sbg-army/vercel.json`'s SPA rewrite
(`/(.*) → /index.html`) is present and the Output Directory is set to
`dist/public`.

**Site loads but shows no data (empty roster, no sponsors, etc.)**
`VITE_API_URL` is missing, wrong, or you forgot to redeploy after setting
it (Vercel doesn't hot-reload env vars — see 5.5). Check the Network tab
for the actual request URL being called.

## CORS

**Console error: "has been blocked by CORS policy... No
'Access-Control-Allow-Origin' header"**
Set `CORS_ORIGIN` on Render to your exact frontend origin(s), comma
separated, no trailing slash, e.g. `https://sbgarmy.in,https://www.sbgarmy.in`.
Redeploy the backend after changing it.

**CORS works for GET but admin POST/PATCH/DELETE requests fail with a
network error, not a CORS error**
Usually a mixed-content issue (frontend on `https://` calling a backend on
plain `http://`) or an expired/misconfigured SSL cert on the backend
domain — verify with `curl -I https://api.sbgarmy.in/api/healthz`.

## Authentication

**Clerk-related console warnings**
Harmless if you're not using Clerk — the relevant middleware no-ops when
`CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY` are unset. Only worth
investigating if you intend to use Clerk features.

## Build errors (general)

**"Cannot find module '@workspace/db'" or similar workspace-package errors**
The build command must run from the repository root so pnpm can resolve
workspace packages (`lib/db`, `lib/api-zod`, etc.) — this is why
`artifacts/sbg-army/vercel.json`'s build command starts with `cd ../..`.

## Environment variables

**Changed a variable but the old behavior persists**
- Render: env var changes trigger an automatic redeploy — check the
  **Events** tab to confirm a new deploy actually ran.
- Vercel: env var changes do **not** auto-redeploy — you must manually
  **Redeploy** (see 5.5).

## Storage / uploads

**Uploaded images 404 after a redeploy**
Same root cause as "data disappears" above — the persistent disk isn't
mounted, or was mounted after uploads were already made to ephemeral
storage (in which case those specific files are unrecoverable — restore
from a backup if you have one, see
[08-backup-restore-rollback.md](08-backup-restore-rollback.md)).

## API

**A specific admin action returns 401 Unauthorized**
The admin JWT (from `sessionStorage`) expired or wasn't sent — log out and
back in. If this happens immediately after login, check that `SESSION_SECRET`
is identical across all running backend instances (it must be, since Render
can run multiple instances behind a load balancer on paid plans).
