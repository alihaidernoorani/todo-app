---
id: "0015"
title: "Fix Authentication Errors Better Auth"
stage: green
date: 2026-02-01
surface: agent
model: claude-opus-4-5-20251101
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: alihaidernoorani
command: /sp.implement
labels: ["auth", "better-auth", "bug-fix", "database"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/auth/better-auth.ts (modified)
  - frontend/lib/auth/jwt-utils.ts (modified)
  - frontend/app/api/auth/[...all]/route.ts (modified)
tests:
  - npm run build (PASS)
---

## Prompt

The console is still showing me authentication error. Please fix all errors

## Response snapshot

Fixed multiple authentication configuration issues:

1. **Database URL Mismatch** (`better-auth.ts`):
   - Environment file uses `NEON_DATABASE_URL` but code expected `DATABASE_URL`
   - Fixed: `url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL`

2. **Build-Time Database Connection** (`better-auth.ts`):
   - Better Auth was attempting DB connection during Next.js build
   - Fixed: Implemented lazy initialization with `getAuth()` pattern
   - Added build phase detection using `NEXT_PHASE` environment variable
   - Auth only initializes at runtime, not during static generation

3. **Wrong Cookie Name** (`jwt-utils.ts`):
   - Code looked for `auth-token` cookie
   - Better Auth uses `better-auth.session_token` by default
   - Fixed: Updated to correct cookie name

4. **Session Validation Approach** (`jwt-utils.ts`):
   - Was using `jwt-decode` to parse tokens
   - Better Auth stores sessions in database, not as JWTs
   - Fixed: Now uses `auth.api.getSession()` to validate sessions

5. **API Route Handler** (`route.ts`):
   - Eagerly initialized auth at module load
   - Fixed: Uses lazy `getAuth()` with null check for build time

Build now completes without `BetterAuthError: Failed to initialize database adapter`.

## Outcome

- ✅ Impact: Authentication system properly configured for Better Auth patterns
- 🧪 Tests: npm run build PASS (no BetterAuthError)
- 📁 Files: 3 files modified
- 🔁 Next prompts: Test runtime auth flow with sign-in/sign-up
- 🧠 Reflection: Better Auth differs significantly from NextAuth - uses database sessions, not JWTs. Cookie name follows `${prefix}.session_token` pattern.

## Evaluation notes (flywheel)

- Failure modes observed: Assumed JWT-based auth when Better Auth uses database sessions
- Graders run and results (PASS/FAIL): Build PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Verify runtime auth flow works correctly
