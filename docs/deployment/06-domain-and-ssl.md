# 6. Domain Configuration & SSL

## 6.1 Buy a domain

Any registrar works (Namecheap, GoDaddy, Google Domains, Cloudflare
Registrar). Example used throughout these docs: `sbgarmy.in`.

## 6.2 Point the frontend domain at Vercel

1. Vercel project → **Settings** → **Domains** → enter `sbgarmy.in` (and
   `www.sbgarmy.in`) → **Add**.
2. Vercel shows DNS records to add. At your registrar's DNS settings, add
   the record it shows — usually:
   - `A` record: `@` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com`
3. Wait for DNS to propagate (a few minutes to a few hours). Vercel's
   Domains page shows a green check once verified.
4. SSL is automatic — Vercel issues and renews a Let's Encrypt certificate
   for you; no action needed.

## 6.3 Point the backend subdomain at Render

1. Render service → **Settings** → **Custom Domain** → enter
   `api.sbgarmy.in` → **Save**.
2. Render shows a `CNAME` target (e.g. `sbg-army-api.onrender.com`). Add
   that `CNAME` record at your registrar for the `api` subdomain.
3. Render auto-provisions SSL once DNS verifies (can take up to an hour).

## 6.4 Update environment variables to match

Once both domains are live:

- Render `sbg-army-api` → **Environment** → `CORS_ORIGIN` =
  `https://sbgarmy.in,https://www.sbgarmy.in`
- Vercel `sbg-army` → **Environment Variables** → `VITE_API_URL` =
  `https://api.sbgarmy.in`
- **Redeploy both** after changing these (see 4.5/5.5).

## 6.5 Verify HTTPS

```bash
curl -I https://sbgarmy.in
curl -I https://api.sbgarmy.in/api/healthz
```

Both should return `HTTP/2 200` with no certificate warnings. Open the site
in a browser and confirm the padlock icon shows a valid certificate.
