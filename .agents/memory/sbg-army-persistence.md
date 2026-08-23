---
name: SBG ARMY persistence pattern
description: Rules for adding new collections and required component props that cause silent failures when missed.
---

## Rule: new collections must be registered, not just typed
Adding a key to the `Database` interface and `DEFAULT_DB` in
`artifacts/sbg-army/src/lib/database.ts` is not enough — it must also be
added to the collection-list constant that drives bulk `saveDB()` syncing,
or admin CRUD will appear to work locally (IndexedDB) but silently never
reach the server.

**Why:** bulk `saveDB(db)` (no second arg) iterates that list to build the
sync payload; anything omitted is invisibly skipped, not errored.

## Rule: Footer requires a navigation prop
`Footer` requires both `settings` and `navigation` — omitting `navigation`
is a compile error, not a runtime surprise, but easy to miss when adding a
new page that renders Footer directly.
