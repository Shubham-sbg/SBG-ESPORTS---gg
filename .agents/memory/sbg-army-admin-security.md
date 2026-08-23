---
name: SBG ARMY Admin Security Architecture
description: How the admin control center is secured — embedded login, RBAC via Firestore, no public routes
---

## Rule
Admin login is self-contained inside AdminGuard at /admin. No separate /login route exists for admin.

## Why
User requirement: public website must not reveal admin panel existence. Removing /login and embedding login in AdminGuard means /admin shows a login form, and unauthenticated users never see a "Login" page in navigation or footer.

## How to apply
- AdminGuard has states: checking → login → verifying_role → granted | denied
- After Firebase auth, Firestore `admin_roles/{uid}` doc is read for `role` field
- WRITE_ROLES, TOURNAMENT_ROLES, MEDIA_ROLES, CONTENT_ROLES, MODERATION_ROLES exported from AdminGuard for module-level gating
- All `/login` redirects in admin components → `/admin`
- robots.txt blocks /admin indexing
- /admin-setup and /secure-sbg-control routes removed from App.tsx

## Firebase env vars needed
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
