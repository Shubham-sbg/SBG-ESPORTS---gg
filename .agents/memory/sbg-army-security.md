---
name: SBG ARMY security credential handling
description: What credentials were hardcoded and how they were fixed
---

# Security Credential Fixes

## What was fixed
- `auth.ts` `OWNER_EMAILS` array: cleared to `[]` (was exposing admin email list in browser source)
- `auth.ts` `ADMIN_PASSWORD`: cleared to `''` (was exposing plaintext password in browser source)  
- `api-server/src/routes/users.ts` `/users/me`: replaced hardcoded JSON with 401 redirect (was returning admin email + role=super_owner publicly)
- `Footer.tsx`: replaced admin email with "Contact Us" link

## How auth actually works
Admin passwords and emails are validated exclusively by Supabase on the server side. The `auth.ts` file only manages localStorage sessions AFTER Supabase validates the user.

**Why:** These variables were legacy remnants from a pre-Supabase auth system and were never needed for the current auth flow.
