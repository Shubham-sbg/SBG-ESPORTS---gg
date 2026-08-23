# 8. Backup, Restore & Rollback

## 8.1 Backing up CMS data (JSON store)

The admin panel already has this built in — no shell access required:

1. Log into the admin panel → **Settings** (or wherever the backup control
   is surfaced in your build) → **Download Backup**, which hits
   `GET /api/backup` and downloads a single JSON file containing every
   collection.
2. Store this file somewhere safe (cloud storage, local disk). Do this on a
   schedule (e.g. weekly) and before any risky change.

Manually, from a shell with network access to the backend:
```bash
curl -o sbg-army-backup-$(date +%F).json https://api.sbgarmy.in/api/backup
```

## 8.2 Restoring CMS data

Via the admin panel: **Settings** → **Restore Backup** → choose the JSON
file you downloaded → confirm. This calls `POST /api/restore`, which
overwrites every collection with the file's contents (admin-only,
authenticated).

## 8.3 Backing up Postgres

Render Postgres: Dashboard → your database → **Backups** tab → automatic
daily backups are included; you can also click **Create Backup** for an
on-demand snapshot, and **Restore** from any listed backup.

Neon/Supabase: both offer point-in-time recovery from their dashboards; see
their respective docs for the exact steps under your plan.

Manual dump/restore (works with any Postgres provider):
```bash
pg_dump "<DATABASE_URL>" -Fc -f sbg-army-db-backup.dump
pg_restore --clean --if-exists -d "<DATABASE_URL>" sbg-army-db-backup.dump
```

## 8.4 Backing up uploaded images

If you're on Render with the persistent disk configured, download the
`artifacts/api-server/database/uploads/` folder periodically via `render
ssh` (Render CLI) or by adding a temporary admin-only export route. If
self-hosting with Docker, back up the `api_data` named volume:
```bash
docker run --rm -v api_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data uploads
```

## 8.5 Rollback (code)

**Vercel**: Deployments tab → find the last known-good deployment → **⋯** →
**Promote to Production**. Instant, no rebuild needed.

**Render**: service page → **Events**/**Deploys** tab → find the last
known-good deploy → **Rollback to this deploy**.

## 8.6 Rollback (data)

If a bad change corrupted CMS data, restore the most recent JSON backup
(8.2) and/or the most recent Postgres backup (8.3). Always take a fresh
backup of the *current* (possibly bad) state before restoring an old one,
in case you need to recover something from it later.
