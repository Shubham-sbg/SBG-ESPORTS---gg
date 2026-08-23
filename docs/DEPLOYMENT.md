# Deployment Guide
## SBG ARMY Esports Platform

> **Version:** 3.0 | **Date:** July 2026

---

## 1. Overview

The SBG ARMY platform consists of two deployable units:

| Unit | Type | Description |
|------|------|-------------|
| **API Server** | Node.js Web Service | Express + WebSocket + JSON DB |
| **Frontend** | Static Site | Vite-built React SPA |

Both units can be deployed independently and connected via environment variables.

---

## 2. Prerequisites

### 2.1 Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Server runtime |
| pnpm | 8+ | Package management |
| Git | 2.x | Version control |

### 2.2 Required Environment Variables

**API Server (mandatory):**
```bash
SESSION_SECRET=<random 32+ character string>
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
```

**Frontend (mandatory):**
```bash
VITE_API_URL=https://your-api-server.com
```

Generate a secure SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Local Development Setup

### 3.1 Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd sbg-army

# 2. Install all workspace dependencies
pnpm install

# 3. Configure API server environment
cp artifacts/api-server/.env.example artifacts/api-server/.env
# Edit .env with your SESSION_SECRET and other values

# 4. Configure frontend environment
cp artifacts/sbg-army/.env.example artifacts/sbg-army/.env
# Edit .env with VITE_API_URL=http://localhost:5000
```

### 3.2 Starting Services

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server run dev
# Server starts on http://localhost:5000
# WebSocket available at ws://localhost:5000/ws
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/sbg-army run dev
# Frontend starts on http://localhost:3000
```

**Or with Replit workflows (recommended):**
```bash
# Both services are pre-configured as Replit workflows
# Use the workflow panel to start/stop services
```

### 3.3 First-Run Admin Setup

1. Ensure API server is running
2. Set `VITE_SETUP_CODE` in frontend `.env` to a secret code
3. Navigate to `http://localhost:3000/admin/setup`
4. Enter the setup code and create your super_admin account
5. Immediately change or remove `VITE_SETUP_CODE` after setup

---

## 4. Production Deployment

### 4.1 Option A — Render.com (Recommended)

#### API Server on Render

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure:**

| Setting | Value |
|---------|-------|
| Name | `sbg-army-api` |
| Environment | `Node` |
| Region | Closest to your users |
| Branch | `main` |
| Root Directory | `artifacts/api-server` |
| Build Command | `pnpm install && pnpm run build` |
| Start Command | `pnpm run start` |
| Health Check Path | `/api/health` |

4. **Add Environment Variables:**
```
SESSION_SECRET = <generated secret>
NODE_ENV = production
PORT = 10000
CORS_ORIGIN = https://your-frontend.onrender.com
LOG_LEVEL = info
```

5. **Add a Persistent Disk:**
   - Mount Path: `/data`
   - Size: 10GB (minimum)
   - Update `database.ts` to use `/data/database/` path
   - Update multer to use `/data/uploads/` path

> ⚠️ **Critical:** Without a persistent disk, all uploaded files and database JSON files will be lost on every deploy or restart.

#### Frontend on Render (Static Site)

1. **Create a new Static Site** on Render
2. **Configure:**

| Setting | Value |
|---------|-------|
| Name | `sbg-army-frontend` |
| Branch | `main` |
| Root Directory | `artifacts/sbg-army` |
| Build Command | `pnpm install && pnpm run build` |
| Publish Directory | `dist` |

3. **Add Environment Variables (Build-time):**
```
VITE_API_URL = https://sbg-army-api.onrender.com
```

4. **Add Redirect/Rewrite Rule:**
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite
   - *(Required for SPA client-side routing)*

---

### 4.2 Option B — VPS (Ubuntu)

#### Server Setup

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install pnpm
npm install -g pnpm

# 3. Install PM2 (process manager)
npm install -g pm2

# 4. Install Nginx
sudo apt install nginx

# 5. Clone repository
cd /var/www
git clone <repository-url> sbg-army
cd sbg-army
pnpm install
```

#### Build

```bash
# Build API server
pnpm --filter @workspace/api-server run build

# Build frontend
pnpm --filter @workspace/sbg-army run build
```

#### PM2 Configuration

Create `/var/www/sbg-army/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'sbg-army-api',
    script: './artifacts/api-server/dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      SESSION_SECRET: 'your-secret-here',
      CORS_ORIGIN: 'https://sbgarmy.gg',
      LOG_LEVEL: 'info'
    },
    instances: 1,          // Increase with Redis for multi-instance
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/var/log/sbg-army/error.log',
    out_file: '/var/log/sbg-army/out.log'
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs sbg-army-api
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/sbgarmy.gg

# Frontend (static)
server {
    listen 80;
    server_name sbgarmy.gg www.sbgarmy.gg;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sbgarmy.gg www.sbgarmy.gg;

    ssl_certificate /etc/letsencrypt/live/sbgarmy.gg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sbgarmy.gg/privkey.pem;

    root /var/www/sbg-army/artifacts/sbg-army/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|webp|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Server
server {
    listen 443 ssl http2;
    server_name api.sbgarmy.gg;

    ssl_certificate /etc/letsencrypt/live/api.sbgarmy.gg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sbgarmy.gg/privkey.pem;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # WebSocket
        proxy_set_header Connection "upgrade";        # WebSocket
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;                    # WebSocket keepalive
    }

    # Serve uploads directly (bypass Node.js for better performance)
    location /uploads {
        alias /var/www/sbg-army/artifacts/api-server/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sbgarmy.gg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sbgarmy.gg -d www.sbgarmy.gg -d api.sbgarmy.gg
# Auto-renewal is set up by certbot
```

---

### 4.3 Option C — Docker (Optional)

`Dockerfile` for API server:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY artifacts/api-server/src ./artifacts/api-server/src
COPY artifacts/api-server/tsconfig.json ./artifacts/api-server/

# Build
RUN pnpm --filter @workspace/api-server run build

# Create data directories
RUN mkdir -p /data/database /data/uploads

EXPOSE 5000

CMD ["node", "artifacts/api-server/dist/index.js"]
```

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
      - CORS_ORIGIN=https://sbgarmy.gg
      - PORT=5000
    volumes:
      - sbg_data:/data
    restart: unless-stopped

volumes:
  sbg_data:
```

---

## 5. Environment Variables Reference

### 5.1 API Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_SECRET` | ✅ | — | JWT signing secret (min 32 chars). Server fails closed if missing. |
| `PORT` | ❌ | `5000` | HTTP server port |
| `CORS_ORIGIN` | ❌ | `*` | Allowed CORS origin (set in production!) |
| `NODE_ENV` | ❌ | `development` | `development` or `production` |
| `LOG_LEVEL` | ❌ | `info` | `trace\|debug\|info\|warn\|error\|fatal` |
| `CLERK_SECRET_KEY` | ❌ | — | If using Clerk authentication |

### 5.2 Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ | — | API server origin URL (no /api suffix!) |
| `VITE_SUPABASE_URL` | ❌ | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ❌ | — | Supabase anonymous key |
| `VITE_SETUP_CODE` | ❌ | — | First-run admin setup code |
| `VITE_CLERK_PUBLISHABLE_KEY` | ❌ | — | If using Clerk authentication |

> **Important:** `VITE_API_URL` must be the origin only: `https://api.sbgarmy.gg` not `https://api.sbgarmy.gg/api`

---

## 6. Build Commands

```bash
# Full workspace install
pnpm install

# Build API server (TypeScript → JavaScript)
pnpm --filter @workspace/api-server run build

# Build frontend (Vite → static files)
pnpm --filter @workspace/sbg-army run build

# Build tournament site
pnpm --filter @workspace/sbg-tournament run build

# Build all
pnpm run build  # (if root build script configured)

# Development (with hot reload)
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/sbg-army run dev
```

---

## 7. Health Checks

### 7.1 API Server Health

```bash
# Basic check
curl https://api.sbgarmy.gg/api/health

# Expected response
{ "status": "ok", "timestamp": "2026-07-21T12:00:00Z" }

# Check specific collection
curl https://api.sbgarmy.gg/api/db/players | jq '.length'
```

### 7.2 WebSocket Health

```javascript
// Quick connectivity test
const ws = new WebSocket('wss://api.sbgarmy.gg/ws');
ws.onopen = () => console.log('WS: Connected ✅');
ws.onerror = (e) => console.error('WS: Error ❌', e);
```

### 7.3 Frontend Health

```bash
# Static site serving
curl -I https://sbgarmy.gg/
# Expect: 200 OK, Content-Type: text/html

# SPA routing
curl -I https://sbgarmy.gg/tournaments
# Expect: 200 OK (served via rewrite rule, not 404)
```

---

## 8. Rollback Procedure

### 8.1 Code Rollback

**Render:**
1. Open Render dashboard
2. Navigate to the service
3. Click "Deploys" tab
4. Find the last working deploy
5. Click "Rollback to this deploy"

**VPS with PM2:**
```bash
# Check git history
git log --oneline -10

# Revert to previous commit
git revert HEAD~1
git push origin main

# Or reset hard (caution: loses commits)
git reset --hard <commit-hash>
git push --force origin main

# Rebuild and restart
pnpm --filter @workspace/api-server run build
pm2 restart sbg-army-api
```

### 8.2 Database Rollback

1. Log into admin panel
2. Navigate to Backup & Restore module
3. Upload the most recent backup JSON file
4. Confirm restoration

Or via API:
```bash
curl -X POST https://api.sbgarmy.gg/api/restore \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @sbg-army-backup-2026-07-20.json
```

---

## 9. Domain Configuration

### 9.1 DNS Records

```
Type    Name        Value                          TTL
A       sbgarmy.gg  <server-ip>                    300
A       www         <server-ip>                    300
A       api         <server-ip>                    300
CNAME   www         sbgarmy.gg                     3600
```

### 9.2 Cloudflare (Recommended)

If using Cloudflare as CDN/proxy:
- Enable "Full (strict)" SSL mode
- Enable HTTP→HTTPS redirect
- Set WebSocket support to "On" (Cloudflare → Network → WebSockets)
- Cache level: "Standard" for static assets
- Bypass cache for `/api/*` paths

---

## 10. CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy SBG ARMY Platform

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build API Server
        run: pnpm --filter @workspace/api-server run build
        
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build Frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: pnpm --filter @workspace/sbg-army run build
        
      - name: Deploy to Render Static
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_STATIC_SERVICE_ID: ${{ secrets.RENDER_STATIC_SERVICE_ID }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            "https://api.render.com/v1/services/$RENDER_STATIC_SERVICE_ID/deploys"
```

---

*Deployment Guide v3.0 — SBG ARMY Esports Platform — July 2026*
