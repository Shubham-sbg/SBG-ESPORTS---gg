---
name: SBG ARMY admin auth architecture
description: bcrypt+JWT auth for admin/staff login; durable rules to preserve
---

## Never compare passwords client-side
`GET /db` scrubs `password`/`passwordHash` fields before sending data to the
client (security measure). Any login flow must POST credentials to a
server-side auth endpoint — comparing against DB data fetched client-side
will always fail (the field is always undefined) or, worse, invite a
plaintext-storage regression.

**Why:** a prior bug did exactly this (`account.password !== password` in
frontend code) and silently broke staff login until moved server-side.

## SESSION_SECRET fails closed
If `SESSION_SECRET` is unset, all auth routes return 503 rather than
allowing access. This is intentional — never "fix" it by defaulting to a
hardcoded secret.

## Token storage split is intentional
Admin tokens live in `sessionStorage` (clears on tab close); staff tokens
live in `localStorage` (7-day rolling session). Don't unify these without
discussing the security tradeoff — it was a deliberate choice.
