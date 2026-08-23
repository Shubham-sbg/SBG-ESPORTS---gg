# 10. Final Production Checklist

Go through this once, right before pointing your real domain at the new
deployment and calling it live.

## Infrastructure
- [ ] Postgres database provisioned and reachable (`DATABASE_URL` set)
- [ ] Render backend deployed, `/api/healthz` returns `{"status":"ok"}`
- [ ] Render **persistent disk** mounted at `artifacts/api-server/database`
- [ ] Vercel frontend deployed and loading correctly
- [ ] Custom domains connected on both Vercel and Render, SSL valid on both

## Environment variables
- [ ] `SESSION_SECRET` set to a unique, randomly generated value (not the example)
- [ ] `CORS_ORIGIN` set to your exact production frontend domain(s)
- [ ] `VITE_API_URL` set to your exact production backend domain
- [ ] No secret values committed to the git repository (check `deploy/.env.example` only has placeholders)

## Functional parity with the current Replit deployment
- [ ] Full [07-testing-checklist.md](07-testing-checklist.md) passed
- [ ] Admin: add/edit/delete tested on at least one collection (players) and confirmed persisted after a redeploy
- [ ] Image upload tested and confirmed persisted after a redeploy

## Data safety
- [ ] A CMS backup (`GET /api/backup`) has been downloaded and stored somewhere outside Render
- [ ] Postgres automatic backups are enabled (default on Render/Neon/Supabase)
- [ ] You know how to roll back both code (8.5) and data (8.6) before you need to

## Security
- [ ] `helmet` is active (already wired in `app.ts` — no action needed)
- [ ] Rate limiting is active (already wired — no action needed)
- [ ] No `.env` files committed to git
- [ ] Admin credentials use strong, unique passwords

## Monitoring
- [ ] You know where to find backend logs (Render → service → Logs)
- [ ] You know where to find frontend build/runtime issues (Vercel → project → Deployments → View Function Logs / Build Logs)

## Cutover
- [ ] DNS TTL lowered ahead of time if migrating an existing live domain, to speed up propagation
- [ ] Old deployment (if any) left running until the new one is confirmed stable for at least 24–48 hours
- [ ] Team/stakeholders informed of the new admin URL and any process changes (there are none — the admin panel works identically)

Once every box is checked, you're live.
