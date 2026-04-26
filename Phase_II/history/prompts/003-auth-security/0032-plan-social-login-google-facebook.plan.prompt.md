---
id: "0032"
title: Plan Social Login Google Facebook
stage: plan
date: 2026-04-26
surface: agent
model: claude-sonnet-4-6
feature: 003-auth-security
branch: 012-oauth-social-login
user: Ali Haider Noorani
command: /sp.plan
labels: ["social-login","oauth","google","facebook","better-auth","plan","architecture"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/plan-social-login.md
  - specs/003-auth-security/research-social-login.md
  - specs/003-auth-security/contracts/social-login-api.md
tests:
  - null
---

## Prompt

Make a comprehensive plan to add login buttons for both Google and Facebook. Make sure that all of the authentication works also with both the Google and Facebook buttons

## Response snapshot

Created three planning artifacts for the Google + Facebook social login feature:

### 1. research-social-login.md
10 research decisions covering:
- Better Auth v1 `socialProviders` config key (no plugin needed)
- `authClient.signIn.social()` built-in on client (no client plugin needed)
- Existing `/api/auth/[...all]` catch-all handles OAuth callbacks automatically
- `useSession` hook already handles JWT acquisition after social login
- Account linking: automatic by email, but Facebook requires `trustedProviders` config
- Database migration: `npx @better-auth/cli migrate` needed
- Facebook local dev: use test users (no HTTPS needed for test users)

### 2. contracts/social-login-api.md
Full API contract for all 4 OAuth endpoints (2 initiation + 2 callbacks), client-side call contract, database `account` table schema, and environment variable contract.

### 3. plan-social-login.md
Comprehensive implementation plan covering:
- Technical context (TypeScript-only, no backend changes)
- Constitution check (all 6 applicable gates PASS)
- Phase 0 research summary (10 decisions, all resolved)
- Phase 1 design with exact code snippets for:
  - `better-auth.ts`: `socialProviders` + `account.accountLinking` + `onAPIError` config
  - `auth.config.ts`: same changes for CLI migrations
  - New `SocialLoginButtons.tsx` component (client-side, Google + Facebook buttons)
  - `SignInForm.tsx` updates (add buttons + comprehensive error code map)
  - `SignupForm.tsx` updates (add buttons)
  - `.env.example` additions
  - Database migration command
- 11-task execution order with FR/SC references
- Risk analysis (6 risks with mitigations)
- Provider registration quickstart (Google Cloud Console + Facebook Developer Portal)
- Acceptance criteria traceability matrix (FR-018 through FR-028, SC-009 through SC-011)

**Critical findings from research agent:**
1. Facebook does not always set `email_verified` — must add `trustedProviders: ["google", "facebook"]` to force account linking
2. `onAPIError: { errorURL: "/login" }` needed as fallback for state-level errors (before state validation)
3. `SocialLoginButtons` MUST be `'use client'` — since Better Auth v1.3.23, OAuth state cookie is set browser-side only

## Outcome

- ✅ Impact: Comprehensive plan ready for /sp.tasks; all implementation decisions resolved; no unknowns remain
- 🧪 Tests: Unit test tasks defined for SocialLoginButtons; E2E manual test tasks for Google/Facebook flows
- 📁 Files: 3 new artifacts created in specs/003-auth-security/
- 🔁 Next prompts: /sp.tasks to generate the implementation task list, then /sp.implement
- 🧠 Reflection: Better Auth v1 makes social login surprisingly additive — the existing catch-all route, useSession hook, and JWT flow all work unchanged. The two non-obvious gotchas are Facebook's missing email_verified flag (requiring trustedProviders) and the client-component constraint for OAuth initiation.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Run /sp.tasks to generate T1–T11 with concrete file diffs
