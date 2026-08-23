# 2. Environment Variables — What, Why, and Where

Full reference file: [`deploy/.env.example`](../../deploy/.env.example).
Never commit real secret values to GitHub — only set them in the Vercel and
Render dashboards (steps 4 and 5).

## Backend (set on Render)

| Variable | Required | What it is | Where to get it |
|---|---|---|---|
| `PORT` | Yes (auto) | Port Express listens on | Render sets this itself |
| `NODE_ENV` | Yes | `production` | Fixed value |
| `DATABASE_URL` | Yes | Postgres connection string | From your Postgres provider — see [03-database.md](03-database.md) |
| `SESSION_SECRET` | Yes | Signs admin login JWTs; admin login is disabled without it | Generate: `openssl rand -base64 32` (or let Render auto-generate — see `render.yaml`) |
| `CORS_ORIGIN` | Yes for split-origin | Comma-separated list of frontend origins allowed to call the API with credentials | Your Vercel/production domain(s), e.g. `https://sbgarmy.in,https://www.sbgarmy.in` |
| `CLERK_SECRET_KEY` | Optional | Enables Clerk-backed auth features | Clerk dashboard, only if you use Clerk |
| `CLERK_PUBLISHABLE_KEY` | Optional | Pairs with the secret key above | Clerk dashboard |
| `GOOGLE_API_KEY` | Optional | Only if a Google-API-backed feature is enabled | Google Cloud Console |

## Frontend (set on Vercel)

| Variable | Required | What it is | Example |
|---|---|---|---|
| `VITE_API_URL` | Yes for split-origin | Backend **origin only** (no `/api` suffix, no trailing slash) | `https://sbg-army-api.onrender.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Optional | Only if Clerk auth is enabled on this frontend | Clerk dashboard |

> `VITE_API_URL` is intentionally origin-only — the app appends `/api` and
> `/ws` itself, and the existing image-upload component already uses this
> same variable the same way, so both stay in sync automatically.

## How to add a variable

**Render**: Dashboard → your service → **Environment** tab → **Add
Environment Variable** → enter key/value → **Save Changes** (triggers a
redeploy).

**Vercel**: Dashboard → your project → **Settings** → **Environment
Variables** → enter key/value → choose **Production** (and **Preview** if
you want it there too) → **Save**. You must **Redeploy** for a changed
variable to take effect (Vercel does not hot-reload env vars into a running
build).

## Never do this

- Never paste real secret values into source files, `.env.example`, commit
  messages, or chat.
- Never reuse a `SESSION_SECRET` between staging and production.
- Never set `CORS_ORIGIN` to `*` in production if `credentials: true` is in
  use (browsers reject that combination anyway, but don't try to work
  around it — list explicit domains instead).
