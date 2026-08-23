---
name: SBG Tournament Platform architecture
description: Architecture and conventions for the sbg-tournament artifact — standalone tournament management website.
---

## Stack
- React 19 + Vite + Tailwind 4 + TypeScript + Wouter — `artifacts/sbg-tournament/`
- Port **3001** in dev
- Proxies `/api` → api-server at port 8080

## Collections (api-server store)
All prefixed `tnmt_` to avoid collision with sbg-army's existing `tournaments` collection:
- `tnmt_tournaments` — Tournament[]
- `tnmt_teams`       — TournamentTeam[] (registrations)
- `tnmt_matches`     — TournamentMatch[] (not currently used directly, embedded in brackets)
- `tnmt_brackets`    — TournamentBracket[] (serialized bracket per tournament)
- `tnmt_settings`    — TnmtSettings (single element array, index 0)

Must be present in `COLLECTIONS` in `artifacts/api-server/src/lib/store.ts` — they were added.

## Auth
Reuses the same `requireAdmin` JWT pattern as the sbg-army API.
Admin login at `/api/admin/login` — stores token in `sessionStorage` under key `tnmt_admin_token`.

## Public registration endpoint
`POST /api/tnmt/register` — no auth required; implemented in `artifacts/api-server/src/routes/tournament_public.ts`.
Uses `readCol` / `writeCol` from store (NOT `readCollection`/`writeCollection` which don't exist).

## Bracket generation
`artifacts/sbg-tournament/src/lib/bracket.ts`
- `generateSingleElimination(teams, tournamentId)` — KO format, handles byes for non-power-of-2 counts
- `generateRoundRobin(teams, tournamentId)` — round robin schedule
- `advanceWinner(rounds, completedMatch, winnerId)` — mutates next round's match slot

**Why bracket is stored in tnmt_brackets (not embedded in tournament):** Brackets are large nested objects; keeping them separate avoids loading the full bracket on the tournament list page.

## Design tokens
- Primary: `#e8192c` (crimson red)
- Accent: `#d4af37` (gold)
- Background: `#030303`

## Score update flow
`updateMatchScore()` in `api.ts` → calls `advanceWinner()` → saves updated brackets via `saveBrackets()`.
Winner slot placement: odd matchNumber → team1 slot of next match; even → team2 slot.

## Workflow
`artifacts/sbg-tournament: web` — `pnpm --filter @workspace/sbg-tournament run dev`
