# SBG ARMY GG23

An esports team platform: public site (roster, sponsors, tournaments, gallery, shop, etc.) plus a full admin CMS, real-time synced across sessions over WebSocket.

## Stack

- **Frontend**: React + Vite — `artifacts/sbg-army`
- **Backend**: Node.js + Express — `artifacts/api-server`
- **Data**: JSON-file store for CMS content (`artifacts/api-server/database/`) + PostgreSQL via Drizzle for auxiliary tables
- **Realtime**: WebSocket sync across all tabs and sessions
- **Auth**: JWT + bcrypt admin authentication
- **Package manager**: pnpm workspaces (monorepo — see `pnpm-workspace.yaml`)

---

## Quick Start

```bash
# Install all dependencies
pnpm install

# Configure environment
cp .env.example .env   # fill in DATABASE_URL and SESSION_SECRET

# Start backend (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (port 5173)
pnpm --filter @workspace/sbg-army run dev
```

Admin panel: http://localhost:5173/admin  
First run: http://localhost:5173/admin/setup

---

## Deployment

Fastest path: **GitHub → Render (backend) → Vercel (frontend)** — ~15 minutes, no source code changes needed.

👉 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** — top-level quick reference  
👉 **[docs/deployment/README.md](docs/deployment/README.md)** — full step-by-step guide

---

## Documentation

| File | Description |
|------|-------------|
| [INSTALL.md](INSTALL.md) | Local installation and build instructions |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Deployment quick reference (all platforms) |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Pre-launch checklist |
| [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) | All env vars documented |
| [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) | Security hardening checklist |
| [BACKUP_GUIDE.md](BACKUP_GUIDE.md) | How to back up production data |
| [RESTORE_GUIDE.md](RESTORE_GUIDE.md) | How to restore from a backup |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [.env.example](.env.example) | Environment variable template |
| [docs/deployment/](docs/deployment/README.md) | Full deployment guides |
| [docs/api/README.md](docs/api/README.md) | API endpoint reference |
| [docs/admin/README.md](docs/admin/README.md) | Admin panel reference |
| [docs/architecture.md](docs/architecture.md) | Technical design document |
| [docs/SECURITY.md](docs/SECURITY.md) | Full security documentation |

---

## Deployment Configs

| Platform | Config File |
|----------|-------------|
| Render (backend) | [`render.yaml`](render.yaml) |
| Vercel (frontend) | [`artifacts/sbg-army/vercel.json`](artifacts/sbg-army/vercel.json) |
| Railway | [`deploy/railway.toml`](deploy/railway.toml) |
| Netlify (frontend) | [`deploy/netlify.toml`](deploy/netlify.toml) |
| Cloudflare Pages | [`deploy/cloudflare/wrangler.toml`](deploy/cloudflare/wrangler.toml) |
| Firebase (frontend) | [`deploy/firebase.json`](deploy/firebase.json) |
| Docker (self-hosted) | [`deploy/docker-compose.yml`](deploy/docker-compose.yml) |
| Nginx | [`deploy/nginx.conf`](deploy/nginx.conf) |

---

## Project Structure

```
sbg-army-gg23/
├── artifacts/
│   ├── api-server/          # Backend Express API + JSON CMS store
│   │   ├── src/             # Source code
│   │   ├── database/        # JSON data files + uploads (persistent disk in prod)
│   │   └── dist/            # Production build output
│   └── sbg-army/            # React + Vite frontend
│       ├── src/             # Source code
│       └── dist/public/     # Production build output
├── deploy/                  # Deployment configs (Docker, Nginx, Netlify, etc.)
├── docs/                    # Full documentation
├── lib/                     # Shared libraries (DB schema, etc.)
├── scripts/                 # Build and setup scripts
├── render.yaml              # Render Blueprint (backend + disk + Postgres)
├── .env.example             # Environment variable template
└── pnpm-workspace.yaml      # Monorepo workspace config
```
