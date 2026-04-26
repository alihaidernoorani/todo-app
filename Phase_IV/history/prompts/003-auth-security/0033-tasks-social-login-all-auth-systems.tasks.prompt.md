---
id: "0033"
title: Tasks Social Login All Auth Systems
stage: tasks
date: 2026-04-26
surface: agent
model: claude-sonnet-4-6
feature: 003-auth-security
branch: 012-oauth-social-login
user: Ali Haider Noorani
command: /sp.tasks
labels: ["tasks","social-login","google","facebook","testing","oauth","better-auth"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/tasks-social-login.md
tests:
  - frontend/tests/components/SocialLoginButtons.test.tsx
  - frontend/tests/token-storage.test.ts
  - frontend/tests/integration/auth-all-methods.test.ts
---

## Prompt

Add tasks for the addition of the Google and Facebook buttons. Note that the authentication system using normal email id and password already exist. Make sure that all tasks are added to make proper execution of the system. Use the findings found in the plan. Add tasks to test the authentication system using all systems

## Response snapshot

Generated `specs/003-auth-security/tasks-social-login.md` with 47 tasks across 6 phases:

**Phase 1 (T001–T003)**: Setup — env var placeholders in `.env.example`, Google Cloud Console registration, Facebook Developer Portal registration

**Phase 2 (T004–T006)**: Foundational — add `socialProviders` + `account.accountLinking` + `onAPIError` to `better-auth.ts` and `auth.config.ts`, run `npx @better-auth/cli migrate` to create `account` table

**Phase 3 (T007–T016)**: User Story 4 — Google Social Login (P1): 5 unit tests (must fail before implementation), then create `SocialLoginButtons.tsx` with Google button + inline SVG + spinner, update `SignInForm.tsx` with `SOCIAL_ERROR_MESSAGES` map covering 8 error codes

**Phase 4 (T017–T024)**: User Story 5 — Facebook Social Login (P1): 5 unit tests, add Facebook button + inline Facebook SVG to `SocialLoginButtons.tsx`, update `SignupForm.tsx` with social buttons

**Phase 5 (T025–T042)**: Testing all auth systems:
- Unit: error query param rendering tests (T025–T028), auth methods integration test (T029)
- Manual E2E: Google happy path (T030), Facebook happy path (T031), email/password regression (T032–T033), account linking for both providers (T034–T035), cancellation flows (T036–T037), JWT validity with FastAPI backend (T038), auth guard regression (T039)
- Security: CSRF state tampering test (T040), no credentials in source (T041), .gitignore check (T042)

**Phase 6 (T043–T047)**: Polish — env example review, TypeScript type check, ESLint, full Vitest suite, README docs

Key design points captured in tasks:
- `SocialLoginButtons` is `'use client'` — required since Better Auth v1.3.23
- Facebook `trustedProviders` config to handle missing `email_verified`
- `onAPIError.errorURL` fallback for pre-state-validation errors
- MVP scope defined as T001–T016 + T030 + T032 (Google + email regression)

## Outcome

- ✅ Impact: 47 tasks ready for /sp.implement; covers full social login implementation + comprehensive auth system testing
- 🧪 Tests: 15 unit/integration test tasks; 15 manual E2E test tasks; 3 security verification tasks
- 📁 Files: specs/003-auth-security/tasks-social-login.md
- 🔁 Next prompts: /sp.implement to execute T001–T047 in order; start with MVP scope T001–T016
- 🧠 Reflection: The 47 tasks cover all three auth paths (email, Google, Facebook) with regression testing ensuring the existing email/password flow is not broken. The phased structure allows the Google MVP to be validated before Facebook is added.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Run /sp.implement with explicit "start with T001" to begin execution
