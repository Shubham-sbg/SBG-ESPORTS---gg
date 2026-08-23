---
name: SBG ARMY platform architecture
description: How sbg-army frontend auth, data storage, and API server relate
---

# SBG ARMY Platform Architecture

## Auth flow
- Admin login: `LoginPage.tsx` → `supabaseAuth.ts adminLogin()` → checks Supabase `role=admin` → creates localStorage session via `auth.ts createSession()`
- Player login: `PlayerLoginPage.tsx` → `supabaseAuth.ts playerLogin()` → stores session via `playerAuth.ts`
- Staff login: separate `StaffLoginPage.tsx` with Supabase check

## Data storage
- Frontend: `lib/database.ts` uses IndexedDB (`idb-keyval`) as primary store, syncs to API server via WebSocket + REST
- API server: Drizzle ORM + PostgreSQL for structured data (rankings, events, matches, audit_logs, etc.)

## Key files
- `artifacts/sbg-army/src/lib/auth.ts` — localStorage session management (NOT password auth; passwords go through Supabase)
- `artifacts/sbg-army/src/lib/supabaseAuth.ts` — actual Supabase sign-in
- `artifacts/sbg-army/src/lib/playerAuth.ts` — player session management
- `artifacts/api-server/src/routes/` — all API routes

**Why:** Knowing this prevents future confusion about where auth actually happens vs where sessions are stored.
