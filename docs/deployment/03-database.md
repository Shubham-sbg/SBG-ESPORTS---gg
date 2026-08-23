# 3. Database — Provision Postgres

The backend needs `DATABASE_URL` to boot (a few routes use Postgres via
Drizzle). Pick ONE option below.

## Option A — Render Postgres (simplest, same dashboard as your backend)

1. Render Dashboard → **New +** → **PostgreSQL**.
2. Name: `sbg-army-db`. Region: same region you'll use for the API service
   (for lowest latency). Plan: Free tier is fine to start.
3. Click **Create Database**. Wait ~1 minute for it to provision.
4. On the database page, copy the **Internal Database URL** (use this if
   your API service is also on Render — it's faster and free) or the
   **External Database URL** (if connecting from elsewhere).
5. You'll paste this into the `DATABASE_URL` environment variable in step 5
   (Render backend deploy). If you used `render.yaml` as a Blueprint, this
   database is created and linked automatically.

## Option B — Neon (generous free tier, works from anywhere)

1. Go to https://neon.tech → sign up → **Create a project**.
2. Name it `sbg-army`, pick a region close to your users.
3. Once created, copy the **Connection string** shown (it already includes
   `?sslmode=require`).
4. Use this as `DATABASE_URL`.

## Option C — Supabase

1. Go to https://supabase.com → **New project**.
2. Set a database password (save it somewhere safe).
3. Project Settings → **Database** → **Connection string** → **URI** tab →
   copy it, replacing `[YOUR-PASSWORD]` with the password you set.
4. Use this as `DATABASE_URL`.

## Applying the schema

The schema is managed with Drizzle (`lib/db`). From the Replit shell (or any
machine with the repo and `DATABASE_URL` set), run once against your new
production database:

```bash
DATABASE_URL="<your production connection string>" pnpm --filter @workspace/db exec drizzle-kit push
```

This creates the tables the app expects without touching your existing JSON
CMS data (which is a separate, file-based store — see
[00-overview.md](00-overview.md)).

## Verifying

```bash
psql "<your DATABASE_URL>" -c '\dt'
```

You should see the tables listed with no errors.
