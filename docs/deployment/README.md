# SBG ARMY — Deployment Documentation

This folder is the complete, beginner-friendly guide to taking the SBG ARMY
site from this Replit workspace to a live production deployment on
**Vercel (frontend) + Render (backend) + a managed Postgres database**,
without changing any UI, feature, or business logic.

Read the guides in order the first time you deploy:

1. [00-overview.md](00-overview.md) — architecture, what goes where, and why
2. [01-github.md](01-github.md) — push this project to GitHub
3. [02-environment-variables.md](02-environment-variables.md) — what each variable is and where to get it
4. [03-database.md](03-database.md) — provision Postgres
5. [04-render-backend.md](04-render-backend.md) — deploy the API server to Render
6. [05-vercel-frontend.md](05-vercel-frontend.md) — deploy the site to Vercel
7. [06-domain-and-ssl.md](06-domain-and-ssl.md) — connect your own domain
8. [07-testing-checklist.md](07-testing-checklist.md) — verify everything works
9. [08-backup-restore-rollback.md](08-backup-restore-rollback.md) — protect your data
10. [09-troubleshooting.md](09-troubleshooting.md) — fix common errors
11. [10-production-checklist.md](10-production-checklist.md) — final go-live checklist

Also in `/docs`:
- [../api/README.md](../api/README.md) — every API endpoint documented
- [../admin/README.md](../admin/README.md) — every admin panel feature documented
- [../architecture.md](../architecture.md) — technical design document
- [../CHANGELOG.md](../CHANGELOG.md) — version history

Alternative: self-hosting with Docker (your own VPS) is covered by
`deploy/Dockerfile` and `deploy/docker-compose.yml` — see
[04-render-backend.md](04-render-backend.md#alternative-self-hosting-with-docker).
