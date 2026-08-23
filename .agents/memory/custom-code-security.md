---
name: Custom Code Manager & Security Hardening
description: AdminCustomCode component, security fixes, Google Sign-In guard
---

## Custom Code Manager
- Collection: `customCode` via `/api/db/customCode` (standard readCol/writeCol pattern)
- Component: `artifacts/sbg-army/src/components/admin/AdminCustomCode.tsx`
- Module id `custom_code` in AdminPage MODULES (SYSTEM group)
- Uses `getAdminToken()` from `@/lib/auth` (added at bottom of that file)
- Role check: renders only for `admin`/`super_admin`; client-side backup before each save

## Security fixes
- `/backup` and `/source-export` protected with `requireAdmin` middleware
- express.json body limit: 50mb → 10mb
- Admin/Staff direct links removed from DashboardPage (~line 106, ~339)

## Google Sign-In
- `supabaseConfigured` guard added in PlayerLoginPage before calling googleLogin()
- Shows friendly error when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set

**Why:** OAuth call was silently failing with a network error when Supabase unconfigured.
**How to apply:** Import `supabaseConfigured` from `@/lib/supabase` and gate any OAuth call.
