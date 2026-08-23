# 7. Production Testing Checklist

Run through this after every deploy, and especially after the first one.

## Connectivity
- [ ] `curl https://api.sbgarmy.in/api/healthz` → `{"status":"ok"}`
- [ ] `https://sbgarmy.in` loads with no blank page / console errors
- [ ] Browser DevTools → Network → `/api/db` request succeeds (status 200)
- [ ] Browser DevTools → Network → WS connection to `wss://api.sbgarmy.in/ws` shows status 101 (Switching Protocols)

## Core site content
- [ ] Homepage shows the current roster, sponsors, and settings (matches what you see on the current Replit deployment)
- [ ] Navigate to a few other pages (Tournaments, Hall of Fame, Shop, etc.) — content matches

## Admin panel
- [ ] Admin login works (`SESSION_SECRET` is set correctly)
- [ ] Add a test player → refresh the page → the player is still there
- [ ] Add the same test player, then **wait a few minutes and reload from a different browser/device** → confirm it's still there (validates the persistent disk is actually mounted, not just in-memory)
- [ ] Upload an image (e.g. in Gallery or Sponsors) → confirm it displays after a hard refresh
- [ ] Delete your test player when done

## Cross-origin specifics (only if frontend/backend are on separate domains)
- [ ] No CORS errors in the browser console
- [ ] Admin POST/PATCH/DELETE actions succeed (these require `credentials` to work — confirms `CORS_ORIGIN` is configured, not just GET requests)

## Performance / SEO (should be unaffected by the move, but verify)
- [ ] Lighthouse score is comparable to the current Replit deployment
- [ ] `robots.txt` and sitemap (if present) are reachable at the new domain
- [ ] Social share preview (Open Graph) renders correctly for the new domain

## Notifications / background features (if applicable to your build)
- [ ] Any scheduled/analytics tracking still records events (`/api/analytics/track`)

If everything above passes, you're ready for [10-production-checklist.md](10-production-checklist.md).
