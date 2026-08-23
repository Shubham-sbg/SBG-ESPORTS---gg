# Admin Panel Documentation

The admin panel lives at `/admin` on the frontend (`artifacts/sbg-army/src/pages/AdminPage.tsx`)
and is composed of one component per feature area under
`artifacts/sbg-army/src/components/admin/`. All of it reads/writes through
the JSON-file store described in [../api/README.md](../api/README.md) —
nothing here changed as part of production readiness work; this section
simply documents what's already there.

| Feature | Component | Collection(s) |
|---|---|---|
| CMS feature toggles | `AdminFeatures.tsx` | `features` |
| Games | `AdminGames.tsx` | `games` |
| Roster / Players | `AdminRoster.tsx` | `players` |
| Player user accounts | `AdminPlayerUsers.tsx` | `playerUsers` |
| Staff accounts | `AdminStaffManager.tsx` | `staffAccounts` |
| Matches | (within roster/dashboard flows) | `matches` |
| Tournaments | `AdminTournaments.tsx` | `tournaments`, `registrations` |
| Achievements | `AdminAchievements.tsx` | `achievements` |
| Hall of Fame timeline | `AdminHOFTimeline.tsx` | `hofMilestones` |
| Trophies / Team Records / Seasons | (dashboard) | `trophies`, `teamRecords`, `teamSeasons` |
| Partners / Sponsors | `AdminSponsors.tsx` | `sponsors` |
| Ads | `AdminAds.tsx` | `ads` |
| Analytics | `AdminAnalytics.tsx` | `analytics` |
| Feedback | `AdminFeedback.tsx` | `feedback` |
| Fan messages | `AdminFanMessages.tsx` | `fan_messages` |
| Collaboration requests | `AdminCollabs.tsx` | `collab_requests` |
| Contact messages | `AdminContactMessages.tsx` | `contact_messages` |
| Giveaways | `AdminGiveaways.tsx` | `giveaways` |
| Videos | `AdminVideos.tsx` | `videos` |
| Founders | `AdminFounders.tsx` | `founders` |
| Creators | `AdminCreators.tsx` | `creators` |
| Facility | `AdminFacility.tsx` | `facility`, `facilityStats` |
| Shop / Orders | `AdminShop.tsx`, `AdminOrders.tsx` | `shop`, `orders` |
| Gallery | `AdminGallery.tsx` | `gallery` |
| Navigation | `AdminNavigation.tsx` | `navigation` |
| Legal pages | `AdminLegalPages.tsx` | `settings` |
| Site settings, branding, SEO | `AdminSettings.tsx` | `settings` |
| Backup / restore / source export | (Settings page) | full DB via `/api/backup`, `/api/restore`, `/api/source-export` |
| System health | `AdminSystemHealth.tsx` | live status (WS connection, uptime) |

## Access

Admin login is at the site's `/admin` route (or `/staff-login` for staff
accounts — see `StaffLoginPage.tsx`). Credentials are bcrypt-hashed
server-side; sessions are JWTs signed with `SESSION_SECRET` (see
[../deployment/02-environment-variables.md](../deployment/02-environment-variables.md)).
If `SESSION_SECRET` is not configured, admin login is disabled entirely as
a fail-closed safety measure (this is intentional, not a bug).

## Real-time sync across admin sessions

Every admin write broadcasts over WebSocket to all connected browser tabs
(including other admins' sessions), so two people editing the site at once
see each other's changes without refreshing. If a tab is closed/backgrounded
for a long time and its WebSocket silently drops, it automatically resyncs
its local cache from the server the moment it reconnects or the tab
regains focus — this prevents a stale tab from overwriting newer changes
made elsewhere.
