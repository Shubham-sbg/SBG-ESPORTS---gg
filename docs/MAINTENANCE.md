# Maintenance Guide
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Routine Maintenance

### 1.1 Daily Tasks

| Task | Method | Notes |
|------|--------|-------|
| Verify API server is running | Check PM2 status or Render dashboard | Should show "running" |
| Check error logs | `pm2 logs sbg-army-api --err` | Look for new ERROR or FATAL entries |
| Verify WebSocket is accepting connections | Load public website, check browser console | No WS errors |
| Review new contact/fan messages | Admin panel → Messages | Respond or archive |
| Check pending registrations | Admin panel → Tournaments | Approve or reject |

### 1.2 Weekly Tasks

| Task | Method | Notes |
|------|--------|-------|
| Manual database backup | Admin panel → Backup → Export | Download JSON file |
| Review recruitment applications | Admin panel → Recruitment | Process new applications |
| Check analytics | Admin panel → Analytics | Review traffic trends |
| Check disk usage | `df -h /data` (VPS) | Alert if >80% |
| Review error logs for patterns | `pm2 logs --lines 500` | Identify recurring issues |
| Update player/match records | Admin panel | Keep data current |

### 1.3 Monthly Tasks

| Task | Method | Notes |
|------|--------|-------|
| Security audit | `pnpm audit` in workspace | Update vulnerable packages |
| Dependency updates | `pnpm outdated` | Update minor/patch versions |
| SSL certificate check | `certbot certificates` | Renew if <30 days remaining |
| Performance audit | Lighthouse on production | Address regressions |
| Review and archive old data | Admin panel | Archive completed tournaments |
| Database backup verification | Restore to staging and verify | Ensure backup is valid |
| Review staff accounts | Admin panel → Staff | Remove inactive accounts |

---

## 2. Monitoring

### 2.1 Application Monitoring

**PM2 Built-in Monitoring (VPS):**
```bash
# Real-time dashboard
pm2 monit

# Process list and status
pm2 status

# Memory and CPU
pm2 show sbg-army-api
```

**Render Dashboard (if using Render):**
- Navigate to your service in Render dashboard
- "Logs" tab for real-time log streaming
- "Metrics" tab for CPU/memory graphs

### 2.2 Log Monitoring

**View live logs:**
```bash
# All logs
pm2 logs sbg-army-api

# Errors only
pm2 logs sbg-army-api --err

# Last 100 lines
pm2 logs sbg-army-api --lines 100

# Follow (tail -f style)
pm2 logs sbg-army-api --follow
```

**Key log patterns to watch for:**

| Pattern | Severity | Action |
|---------|----------|--------|
| `FATAL` | Critical | Immediate investigation + restart |
| `Error: ENOSPC` | Critical | Disk full — clear space immediately |
| `JWT expired` | Low | Normal user flow |
| `login_failed` frequency spike | High | Possible brute-force attack |
| `ECONNREFUSED` | Medium | Check if target service is running |
| `ETIMEDOUT` | Medium | Network or external service issue |
| Memory > 400MB | Medium | Check for memory leak; restart if needed |

### 2.3 Uptime Monitoring

Use a free uptime monitoring service to get alerted if the API goes down:

**Recommended tools:**
- **UptimeRobot** (free) — HTTP monitor every 5 minutes
- **BetterUptime** — includes incident management
- **Freshping** — free tier available

**Monitor these endpoints:**
```
https://api.sbgarmy.gg/api/health         (API health)
https://sbgarmy.gg/                        (Frontend)
wss://api.sbgarmy.gg/ws                   (WebSocket)
```

**Set up UptimeRobot:**
1. Create account at uptimerobot.com
2. Add HTTP(S) monitor for `https://api.sbgarmy.gg/api/health`
3. Set check interval: 5 minutes
4. Alert contacts: admin email + Discord webhook

### 2.4 Disk Usage Monitoring

```bash
# Check disk usage
df -h

# Find large files
du -sh /data/*
du -sh /data/uploads/*
du -sh /data/database/*

# Check log sizes
ls -lh /var/log/sbg-army/

# Rotate logs (if using logrotate)
logrotate /etc/logrotate.d/sbg-army
```

**Alert threshold:** 80% disk usage → investigation required

---

## 3. Logging

### 3.1 Log Structure (Pino JSON Format)

```json
{
  "level": 30,
  "time": 1721563200000,
  "pid": 1234,
  "hostname": "server-01",
  "msg": "Admin login successful",
  "event": "login_success",
  "userId": "staff_abc123",
  "username": "admin",
  "role": "super_admin",
  "ip": "203.0.113.1"
}
```

**Log levels:**
- `10` (trace): Very verbose, dev only
- `20` (debug): Debugging info
- `30` (info): Normal operation events
- `40` (warn): Recoverable issues
- `50` (error): Application errors
- `60` (fatal): Server-stopping errors

### 3.2 Log File Management

**Logrotate configuration** (`/etc/logrotate.d/sbg-army`):
```
/var/log/sbg-army/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3.3 Log Search & Analysis

```bash
# Search for errors in last 24 hours
grep '"level":50' /var/log/sbg-army/error.log | tail -50

# Count failed logins today
grep '"event":"login_failed"' /var/log/sbg-army/out.log | \
  grep $(date +%Y-%m-%d) | wc -l

# Find all actions by a specific admin
grep '"username":"suspicious_user"' /var/log/sbg-army/out.log

# Parse with jq (if logs are JSON)
cat /var/log/sbg-army/out.log | \
  jq 'select(.event == "login_failed") | {time, username, ip}'
```

---

## 4. Updates & Patching

### 4.1 Dependency Updates (Safe Process)

```bash
# 1. Create a backup first
# Via admin panel: Backup → Export database

# 2. Check what's outdated
cd /var/www/sbg-army
pnpm outdated

# 3. Check for security vulnerabilities
pnpm audit

# 4. Update patch versions (safe)
pnpm update

# 5. Update minor versions (review changelog)
pnpm update --latest

# 6. Run tests after update
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/sbg-army test

# 7. Test in development first
pnpm --filter @workspace/api-server run dev
# Verify functionality manually

# 8. If all good, deploy to production
pnpm --filter @workspace/api-server run build
pm2 restart sbg-army-api
```

### 4.2 Node.js Updates

```bash
# Check current version
node --version

# Install newer LTS version (NVM)
nvm install --lts
nvm use --lts

# Or with NodeSource (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4.3 Rollback After Failed Update

```bash
# Revert to previous package versions
git stash  # or git checkout package.json pnpm-lock.yaml

# Reinstall
pnpm install --frozen-lockfile

# Rebuild
pnpm --filter @workspace/api-server run build

# Restart
pm2 restart sbg-army-api
```

---

## 5. Backup & Restore

### 5.1 Manual Backup (Admin Panel)

1. Log into admin panel
2. Navigate to **Backup & Restore**
3. Click **Export Database**
4. Save the downloaded JSON file to a secure location

### 5.2 Manual Backup (CLI)

```bash
# Export via API
curl -X GET https://api.sbgarmy.gg/api/backup \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o "backup-$(date +%Y%m%d-%H%M).json"

# Copy database files directly (raw)
cp -r /data/database/ /backups/db-$(date +%Y%m%d)/

# Copy uploads
rsync -av /data/uploads/ /backups/uploads-$(date +%Y%m%d)/
```

### 5.3 Automated Backup Script

Create `/opt/sbg-army-backup.sh`:
```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/sbg-army"
DATE=$(date +%Y%m%d-%H%M%S)
ADMIN_TOKEN=$(cat /etc/sbg-army/admin-token)
API_URL="https://api.sbgarmy.gg"
RETAIN_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Export database
curl -sf -X GET "$API_URL/api/backup" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o "$BACKUP_DIR/db-$DATE.json"

# Copy uploads
rsync -a /data/uploads/ "$BACKUP_DIR/uploads-$DATE/"

# Remove backups older than RETAIN_DAYS
find "$BACKUP_DIR" -name "db-*.json" -mtime +$RETAIN_DAYS -delete
find "$BACKUP_DIR" -name "uploads-*" -maxdepth 1 -type d -mtime +$RETAIN_DAYS \
  -exec rm -rf {} +

echo "Backup completed: $DATE"
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /opt/sbg-army-backup.sh >> /var/log/sbg-army-backup.log 2>&1
```

### 5.4 Database Restore Process

**Via Admin Panel:**
1. Log in as admin
2. Navigate to **Backup & Restore**
3. Click **Restore Database**
4. Upload the backup JSON file
5. Confirm the warning dialog
6. Wait for completion message

**Via API:**
```bash
curl -X POST https://api.sbgarmy.gg/api/restore \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @backup-20260721.json
```

**Via direct file replacement:**
```bash
# 1. Stop API server
pm2 stop sbg-army-api

# 2. Backup current database
cp -r /data/database/ /data/database-pre-restore-$(date +%Y%m%d)/

# 3. Extract backup files
# (Use a script to extract JSON from backup to individual files)
node -e "
const backup = JSON.parse(require('fs').readFileSync('backup.json'));
Object.entries(backup.collections).forEach(([name, data]) => {
  require('fs').writeFileSync(\`/data/database/\${name}.json\`, JSON.stringify(data, null, 2));
});
"

# 4. Restart API server
pm2 start sbg-army-api
```

---

## 6. Troubleshooting

### 6.1 API Server Won't Start

**Problem:** API server fails to start or immediately crashes.

**Diagnostics:**
```bash
pm2 logs sbg-army-api --err --lines 50
```

**Common causes and fixes:**

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `SESSION_SECRET not set` | Missing env var | Add SESSION_SECRET to .env |
| `EADDRINUSE: port 5000` | Port already in use | `lsof -i:5000` then kill process |
| `Cannot find module '...'` | Missing build | Run `pnpm build` for api-server |
| `ENOENT: no such file or directory` | Missing database dir | `mkdir -p /data/database` |
| `SyntaxError: Unexpected token` | Corrupt JSON file | Restore the affected collection from backup |

### 6.2 WebSocket Connection Fails

**Problem:** Public website shows stale data, no live updates.

**Diagnostics:**
```bash
# Check if WS is accessible
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: api.sbgarmy.gg" \
  -H "Sec-WebSocket-Key: test==" \
  -H "Sec-WebSocket-Version: 13" \
  https://api.sbgarmy.gg/ws
```

**Common causes:**
- Nginx not passing WebSocket upgrade headers → Add `proxy_set_header Upgrade/Connection`
- Cloudflare not passing WebSockets → Enable in Cloudflare Network → WebSockets
- API server not running → Restart with PM2

### 6.3 Images Not Loading After Restart

**Problem:** Uploaded images return 404 after server restart.

**Cause:** No persistent disk configured — `/uploads/` is ephemeral on many platforms.

**Fix (Render):**
1. Add a Persistent Disk in Render service settings
2. Mount at `/data`
3. Update `multer` destination to `/data/uploads/`
4. Update static file serving: `app.use('/uploads', static('/data/uploads'))`

**Fix (VPS):** Ensure `/data/uploads/` is on a non-ephemeral volume.

### 6.4 Admin Can't Log In

**Problem:** Admin credentials are correct but login fails.

**Diagnostics:**
```bash
# Check if API server is running
pm2 status

# Check login endpoint
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}'
  
# Check if staffAccounts has any records
cat /data/database/staffAccounts.json
```

**Common causes:**
- `staffAccounts.json` is empty or corrupt → Restore from backup or run setup
- `SESSION_SECRET` changed → All existing tokens invalidated (users need to re-login)
- API server not running → Restart

### 6.5 Database Appears Empty

**Problem:** Admin panel shows no data; public site is blank.

**Diagnostics:**
```bash
# Check collection files
ls -la /data/database/
cat /data/database/players.json | jq '.length'

# Check API response
curl http://localhost:5000/api/db/players
```

**Common causes:**
- New deployment on ephemeral disk (data lost) → Restore from backup
- Collection not in `ALL_COLLECTIONS` → Add to array in `database.ts`
- JSON file is corrupt → Check with `jq` parser → Fix or restore

### 6.6 Real-Time Updates Not Working

**Problem:** Admin changes don't appear on public site without refresh.

**Diagnostics:**
```bash
# Open browser DevTools → Network → WS tab
# Filter for WebSocket connection
# Check if connection shows as "101 Switching Protocols"
# Check for db_update messages after admin actions
```

**Common causes:**
- WS connection dropped → Client should auto-reconnect; reload page if not
- Nginx timeout on WS → Add `proxy_read_timeout 86400;` to Nginx config
- Browser tab was hidden for long period → Visibility handler should re-sync

### 6.7 High Memory Usage

**Problem:** API server memory grows over time.

**Diagnostics:**
```bash
pm2 show sbg-army-api | grep memory
```

**Common causes:**
- Large analytics collection growing → Prune old analytics entries
- WebSocket connections not being cleaned up → Check `clients.delete(ws)` on close
- Log accumulation → Rotate logs; check Pino configuration

**Immediate fix:**
```bash
pm2 restart sbg-army-api
```

**Long-term:** Add `max_memory_restart: '400M'` to PM2 ecosystem config.

---

## 7. Emergency Procedures

### 7.1 Full Platform Recovery

If both frontend and API are down:

```bash
# 1. SSH to server
ssh user@server-ip

# 2. Check what's wrong
pm2 status
systemctl status nginx

# 3. Restart API server
pm2 restart sbg-army-api

# 4. Restart Nginx
sudo systemctl restart nginx

# 5. Verify
curl http://localhost:5000/api/db/players
curl https://sbgarmy.gg/

# 6. If API fails to restart, check logs
pm2 logs sbg-army-api --err --lines 100
```

### 7.2 Compromised Admin Account

```bash
# 1. Immediately rotate SESSION_SECRET
# This invalidates ALL existing tokens
export SESSION_SECRET=$(openssl rand -hex 32)
# Update .env file with new secret
pm2 restart sbg-army-api

# 2. Remove compromised account via direct DB edit
# (Since you can't use the panel without a valid token)
cat /data/database/staffAccounts.json | \
  jq 'map(select(.username != "compromised_user"))' > /tmp/staff.json
mv /tmp/staff.json /data/database/staffAccounts.json

# 3. Log in with remaining valid admin account
# Create new credentials if needed

# 4. Review all recent changes in activity log
```

---

*Maintenance Guide v3.0 — SBG ARMY Esports Platform — July 2026*
