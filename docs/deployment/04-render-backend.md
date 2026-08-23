# 4. Deploy the Backend to Render

## 4.1 Log in

1. Go to https://render.com → **Get Started** → sign up (GitHub login is
   easiest — it also grants Render access to your repos).

## 4.2 Connect GitHub

1. Dashboard → **New +** → **Blueprint** (uses the `render.yaml` already in
   this repo, which sets up the web service, disk, and database together).
2. Click **Connect account** next to GitHub if not already connected, then
   authorize Render to access your `sbg-army` repository (or "All
   repositories" if you prefer).
3. Select the `sbg-army` repo → Render detects `render.yaml` automatically.

## 4.3 Review the Blueprint

Render shows you the resources `render.yaml` will create:
- **Web Service** `sbg-army-api`
- **Disk** `sbg-army-data` (1 GB, mounted so CMS data + uploads persist)
- **Postgres database** `sbg-army-db`

Click **Apply**.

### If you'd rather set it up manually instead of via Blueprint

1. **New +** → **Web Service** → connect the repo.
2. **Name**: `sbg-army-api`. **Region**: pick one near your users.
3. **Branch**: `main`. **Root Directory**: leave blank (repo root).
4. **Runtime**: Node.
5. **Build Command**:
   ```
   corepack enable && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
   ```
6. **Start Command**:
   ```
   node --enable-source-maps artifacts/api-server/dist/index.mjs
   ```
7. **Plan**: Starter (free tier will sleep after inactivity, which is fine
   for testing but not for a live production admin panel).
8. Scroll to **Disks** → **Add Disk** → Name `sbg-army-data`, Mount Path
   `/opt/render/project/src/artifacts/api-server/database`, Size 1 GB.
   **This step is critical** — without it, every redeploy wipes your CMS
   data and uploaded images back to the built-in defaults.
9. **Health Check Path**: `/api/healthz`.
10. Click **Create Web Service**.

## 4.4 Set environment variables

On the service page → **Environment** tab, add each variable from
[02-environment-variables.md](02-environment-variables.md) (backend table).
At minimum: `NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET`, and
`CORS_ORIGIN` (once you know your Vercel domain from step 5).

## 4.5 Deploy

Render deploys automatically after you save environment variables or push a
new commit. Watch the **Logs** tab — a successful boot looks like:

```
Serving SBG ARMY frontend static files   (safe to ignore — see note below)
WebSocket server initialized at /ws
Server listening (HTTP + WebSocket)
```

> Note: the backend can also serve the frontend itself if a built
> `artifacts/sbg-army/dist/public` folder exists next to it (this is how the
> current Replit deployment works). On Render you're deploying the backend
> alone, so that log line is harmless — the frontend is served separately by
> Vercel.

## 4.6 Verify the API is live

```bash
curl https://sbg-army-api.onrender.com/api/healthz
# → {"status":"ok"}
```

## 4.7 Troubleshooting

See [09-troubleshooting.md](09-troubleshooting.md#render-backend) for
common Render errors.

## Alternative: self-hosting with Docker

If you'd rather run everything on your own VPS instead of Render, use
`deploy/Dockerfile` (API server image) and `deploy/docker-compose.yml`
(Postgres + API server + nginx serving the built frontend), with
`deploy/nginx.conf` as the reverse proxy config. Steps:

```bash
pnpm --filter @workspace/sbg-army run build
cp deploy/.env.example deploy/.env   # fill in real values
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

The compose file mounts a named volume for the JSON database/uploads
directory, so data survives container recreation.
