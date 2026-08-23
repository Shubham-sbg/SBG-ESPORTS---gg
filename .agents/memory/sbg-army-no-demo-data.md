---
name: SBG ARMY demo data removal
description: Why DEFAULT_DB and store.ts DEFAULTS must have empty arrays for content collections, and what was fixed.
---

## Rule
All content collections in `DEFAULT_DB` (database.ts) and `DEFAULTS` (store.ts) MUST default to `[]`, not demo entries.

## Why
Demo entries (AR_BEAST, RAHU_FF, fake tournaments, etc.) were defined as defaults in both the client-side `DEFAULT_DB` and the server-side `DEFAULTS`. 

- On the client: shown whenever the server is unreachable AND IndexedDB has no saved state (cold start or cleared cache).
- On the server: seeded into JSON files by `initStore()` whenever a collection file doesn't exist yet. Collections that didn't have JSON files (achievements, hofMilestones, trophies, teamRecords, teamSeasons, weeklyEvents, etc.) would get demo data written on the next server restart.

This was the root cause of "old/demo data appearing" reports.

## What was cleared
Collections changed from demo entries to `[]` in both files:
- players, matches, schedule, posts, sponsors, games, creators, founders, shop, facility, facilityStats
- achievements, weeklyEvents, hofMilestones, trophies, teamRecords, teamSeasons
- about.stats, about.timeline, about.values (sub-arrays)

## What was kept as structural defaults (NOT cleared)
- `settings` — org name, colors, text labels (all non-user-data)
- `faq` — 3 generic FAQ items (safe, clearly placeholder)
- `analytics` — zero-value counters
- `features` — section/page visibility flags
- `navigation` — standard nav items

## Also fixed in this pass
- `recruitment` added to `ALL_COLLECTIONS` in database.ts — it was missing, causing bulk `saveDB()` to silently skip it
- Hardcoded Google Analytics `G-XXXXXXXXXX` placeholder removed from index.html (GA is already injected dynamically via SiteEffects.tsx from `settings.analyticsId`)

## How to apply
Never add demo entries to DEFAULT_DB or DEFAULTS. If new content collections are added, default them to `[]` and add them to ALL_COLLECTIONS in database.ts AND COLLECTIONS in store.ts.
