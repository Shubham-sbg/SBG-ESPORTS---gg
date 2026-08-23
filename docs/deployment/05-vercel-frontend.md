# 5. Deploy the Frontend to Vercel

## 5.1 Log in

1. Go to https://vercel.com → **Sign Up** (GitHub login recommended).

## 5.2 Import the repository

1. Dashboard → **Add New...** → **Project**.
2. **Import Git Repository** → find `sbg-army` → click **Import**. If it
   doesn't show up, click **Adjust GitHub App Permissions** and grant
   Vercel access to the repo.

## 5.3 Configure the project

1. **Framework Preset**: choose **Other** (this is a pnpm-workspace
   monorepo; the settings below override the preset anyway).
2. **Root Directory**: click **Edit** → select `artifacts/sbg-army`.
3. Expand **Build and Output Settings**:
   - **Build Command**: override and enter
     ```
     cd ../.. && pnpm run typecheck:libs && pnpm --filter @workspace/sbg-army run build
     ```
   - **Output Directory**: `dist/public`
   - **Install Command**: override and enter
     ```
     corepack enable && pnpm install --frozen-lockfile
     ```
   (These match `artifacts/sbg-army/vercel.json`, already committed — Vercel
   will pick most of this up automatically from that file, but double-check
   the Root Directory setting since Vercel can't infer it.)
4. **Environment Variables**: add `VITE_API_URL` set to your Render backend
   URL, e.g. `https://sbg-army-api.onrender.com` (origin only, no `/api`
   suffix — see [02-environment-variables.md](02-environment-variables.md)).
   Add `VITE_CLERK_PUBLISHABLE_KEY` too if you use Clerk.
5. Click **Deploy**.

## 5.4 Watch the build

Vercel streams build logs live. A successful build ends with "Deployment
completed" and gives you a `*.vercel.app` preview URL.

## 5.5 Redeploying after an environment variable change

Vercel does **not** automatically rebuild when you only change an
environment variable. After editing one:

1. Go to the **Deployments** tab.
2. Click the **⋯** menu on the latest (or any) deployment → **Redeploy**.
3. Confirm **without** using the build cache the first time, to make sure
   the new variable is picked up.

## 5.6 Verify

Open the `*.vercel.app` URL. The site should load and, if `VITE_API_URL` is
set correctly, all data (players, sponsors, etc.) should appear exactly as
it does on your current Replit deployment. Open browser DevTools → Network
tab and confirm requests to `/api/db` and the `wss://` WebSocket connection
succeed (no CORS errors — if you see one, revisit `CORS_ORIGIN` on Render).

## 5.7 Custom domain and SSL

Covered in [06-domain-and-ssl.md](06-domain-and-ssl.md).

## 5.8 Troubleshooting

See [09-troubleshooting.md](09-troubleshooting.md#vercel-frontend).
