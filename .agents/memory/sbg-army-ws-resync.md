---
name: SBG ARMY WS reconnect resync
description: Fixes the "admin changes revert after ~1-2 hours" bug caused by stale WebSocket clients bulk-overwriting server data.
---

## The bug
Every admin component shares an in-memory `dbCache`. Many admin pages call
`saveDB(db)` with no collection argument, which bulk-pushes the *entire*
cached snapshot to the server, overwriting every collection. If a tab's
WebSocket had silently dropped (browsers throttle/suspend WS on
backgrounded/idle tabs), that tab's cache goes stale; the next unrelated
edit in that tab then bulk-pushes stale data and reverts anything changed
elsewhere in the meantime.

## The fix (already applied)
The WS client now resyncs the full DB from the server whenever it: (a)
reconnects after having been connected before, (b) the tab regains
visibility, or (c) a 3-minute safety interval fires. `saveDB()` awaits any
in-progress resync before pushing, to avoid racing an incoming resync
against an outgoing bulk save.

**Why this matters for future work:** any new bulk-write pathway added to
the admin UI must go through `saveDB()` (not bypass it) to inherit this
protection. Cold-start default seeding (`mergeWithDefaults` in `initDB()`)
intentionally still falls back to hardcoded defaults — resync must not.

**Residual risk (accepted, not fixed):** bulk writes are still
last-write-wins with no versioning — two tabs could still race a
simultaneous bulk save. Would need optimistic concurrency (ETag) or
collection-scoped/patch APIs to close fully.
