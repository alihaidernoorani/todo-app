# Tasks: Social Login — Google & Facebook

**Branch**: `012-oauth-social-login` | **Date**: 2026-04-26
**Input**: Design documents from `specs/003-auth-security/`
**Plan**: [plan-social-login.md](./plan-social-login.md)
**Spec**: [spec.md](./spec.md) — User Stories 4 (Google) & 5 (Facebook), FR-018–FR-028
**Contracts**: [contracts/social-login-api.md](./contracts/social-login-api.md)

**Context**: Email/password authentication already works end-to-end (SignInForm, SignupForm,
JWT/JWKS, useSession, TokenStorage). This task set ONLY adds social login on top of that
foundation — no existing auth code is removed or replaced.

**Format**: `- [ ] [ID] [P?] [US?] Description — file path`

---

## Phase 1: Setup — Environment & Provider Registration

**Purpose**: Prepare credentials and document required external configuration.
These tasks have no code dependencies and can be completed before any implementation.

- [x] T001 Add Google and Facebook OAuth credential placeholders to `frontend/.env.example` — append after the existing Better Auth section with comments for both Google Cloud Console and Facebook Developer Portal callback URI requirements
- [ ] T002 [P] Register Google OAuth 2.0 Client in Google Cloud Console: create Web application credential, add `http://localhost:3000/api/auth/callback/google` and `https://<production-domain>/api/auth/callback/google` to Authorized Redirect URIs, copy Client ID and Secret into `frontend/.env.local`
- [ ] T003 [P] Register Facebook OAuth App in Facebook Developer Portal: create Consumer app, add Facebook Login product, add callback URI to Valid OAuth Redirect URIs (production only — use Facebook Test Users for localhost), copy App ID and Secret into `frontend/.env.local`

**Checkpoint**: `.env.example` updated; `.env.local` has GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET set

---

## Phase 2: Foundational — Server Configuration & Database

**Purpose**: Server-side changes that enable social OAuth callbacks and account persistence.
MUST complete before any UI tasks or end-to-end testing.

⚠️ CRITICAL: T004–T006 must complete before any social login UI task can be tested end-to-end.

- [x] T004 Add `socialProviders` and `account.accountLinking` config to `frontend/auth.config.ts` — add `socialProviders: { google: { clientId, clientSecret }, facebook: { clientId, clientSecret, scope: ["email","public_profile"] } }` and `account: { accountLinking: { enabled: true, trustedProviders: ["google","facebook"] } }` inside the existing `betterAuth({})` call in `frontend/auth.config.ts`
- [x] T005 Add `socialProviders`, `account.accountLinking`, and `onAPIError` config to `frontend/lib/auth/better-auth.ts` — inside the `betterAuth({})` call in `createAuth()`, add the same `socialProviders` and `account` blocks as T004, plus `onAPIError: { errorURL: "/login" }` for pre-state-validation error fallback
- [ ] T006 Run Better Auth database migration to create/update the `account` table — execute `cd frontend && npx @better-auth/cli migrate` and verify the `account` table exists in the Neon PostgreSQL database with columns: id, userId, accountId, providerId, accessToken, refreshToken, idToken, expiresAt, createdAt, updatedAt

**Checkpoint**: `better-auth.ts` and `auth.config.ts` both have socialProviders configured; DB has `account` table; the existing catch-all route at `frontend/app/api/auth/[...all]/route.ts` now handles `/api/auth/callback/google` and `/api/auth/callback/facebook` automatically

---

## Phase 3: User Story 4 — Google Social Login (Priority: P1) 🎯

**Goal**: User clicks "Continue with Google", completes Google consent, and lands on `/dashboard` with a valid session and JWT token — indistinguishable from an email/password session.

**Independent Test**: Open `/login`, click "Continue with Google", complete Google OAuth, verify `/dashboard` loads with user data visible and no console errors.

### Tests for User Story 4 (unit)

- [x] T007 [US4] Create unit test file `frontend/tests/components/SocialLoginButtons.test.tsx` with test setup: mock `authClient.signIn.social`, mock `useRouter`, import `SocialLoginButtons`; use the same `mockLocalStorage` pattern as `frontend/tests/token-storage.test.ts`
- [x] T008 [US4] Write test: "renders Continue with Google button" — render `<SocialLoginButtons mode="login" />`, assert button with text "Continue with Google" is present in the DOM
- [x] T009 [US4] Write test: "renders divider between social and email form" — assert a divider element with "or" text is present when `SocialLoginButtons` renders
- [x] T010 [US4] Write test: "Google button shows spinner when loading" — click Google button, assert `authClient.signIn.social` was called with `{ provider: "google" }`, assert spinner is visible and button is disabled
- [x] T011 [US4] Write test: "Google button displays error on catch" — mock `authClient.signIn.social` to throw, click Google button, assert error message containing "Google" is displayed

**Verify tests FAIL before implementation (T007–T011 should fail because SocialLoginButtons does not exist yet)**

### Implementation for User Story 4

- [x] T012 [US4] Create `frontend/components/auth/SocialLoginButtons.tsx` as a `'use client'` component with: (a) props `{ mode?: 'login' | 'signup' }`, (b) state `loadingProvider: 'google' | 'facebook' | null` and `error: string | null`, (c) `handleSocialLogin(provider)` calling `authClient.signIn.social({ provider, callbackURL: '/dashboard', errorCallbackURL: '/login' })` — use bare `/login` so Better Auth appends `?error=<actual_error_code>` (e.g. `access_denied` for cancellation), (d) inline Google SVG icon, (e) "Continue with Google" / "Sign up with Google" button styled with white background, slate border, Google brand colors, (f) spinner replacing icon while loading, (g) both buttons disabled when `loadingProvider` is non-null, (h) error display below buttons
- [x] T013 [US4] Add inline `GoogleIcon` SVG sub-component inside `SocialLoginButtons.tsx` — use the official Google "G" logo SVG with correct brand colors (#4285F4, #34A853, #FBBC05, #EA4335)
- [x] T014 [US4] Add inline `Spinner` sub-component inside `SocialLoginButtons.tsx` — animate-spin SVG circle, accepts `className` prop for color overrides (white on Facebook, slate on Google)
- [x] T015 [US4] Add `SOCIAL_ERROR_MESSAGES` constant at the top of `frontend/components/auth/SignInForm.tsx` with all 9 error codes: `google_failed` → "Google sign-in failed. Please try again or use email/password.", `facebook_failed` → "Facebook sign-in failed. Please try again or use email/password.", `access_denied` → "Sign-in was cancelled.", `state_not_found` → "Sign-in session expired. Please try again.", `state_mismatch` → "Sign-in failed: security check failed. Please try again.", `account_not_linked` → "This account is not linked. Please sign in with email/password first.", `unable_to_link_account` → "Could not link social account. Please try again.", `oauth_provider_not_found` → "Social login is not configured. Please use email/password.", `email_required` → "Facebook sign-in requires an email address. Please ensure your Facebook account has an email and try again." (covers FR-027 — Facebook accounts without email)
- [x] T016 [US4] Update `frontend/components/auth/SignInForm.tsx` to: (a) import `SocialLoginButtons` from `@/components/auth/SocialLoginButtons`, (b) use the `SOCIAL_ERROR_MESSAGES` map defined in T015 to parse `searchParams.get('error')` — fall back to a generic "Sign-in failed. Please try again." if the code is not in the map, (c) display resolved error message in the existing `auth-error` div when present, (d) render `<SocialLoginButtons mode="login" />` after the submit button and before the footer text

**Checkpoint**: Run `npx vitest run tests/components/SocialLoginButtons.test.tsx` — T007–T011 should now pass. Open `/login` in browser — Google button visible, clicking it redirects to Google OAuth consent screen.

---

## Phase 4: User Story 5 — Facebook Social Login (Priority: P1)

**Goal**: User clicks "Continue with Facebook", completes Facebook dialog, and lands on `/dashboard` with a valid session and JWT token.

**Independent Test**: Open `/login`, click "Continue with Facebook", complete Facebook OAuth (or use Facebook test user), verify `/dashboard` loads with user data visible.

### Tests for User Story 5 (unit)

- [x] T017 [P] [US5] Add test to `frontend/tests/components/SocialLoginButtons.test.tsx`: "renders Continue with Facebook button" — assert button with text "Continue with Facebook" is present
- [x] T018 [P] [US5] Add test: "Facebook button shows spinner when loading" — click Facebook button, assert `authClient.signIn.social` called with `{ provider: "facebook" }`, assert spinner visible
- [x] T019 [P] [US5] Add test: "Facebook button displays error on catch" — mock `authClient.signIn.social` to throw, click Facebook button, assert error containing "Facebook" is displayed
- [x] T020 [P] [US5] Add test: "only one provider loads at a time" — click Google button before it resolves, verify Facebook button is disabled (`disabled` attribute present)
- [x] T021 [P] [US5] Add test: "signup mode shows Sign up with labels" — render `<SocialLoginButtons mode="signup" />`, assert "Sign up with Google" and "Sign up with Facebook" text

### Implementation for User Story 5

- [x] T022 [US5] Add inline `FacebookIcon` SVG sub-component inside `frontend/components/auth/SocialLoginButtons.tsx` — use the official Facebook "f" logo in white SVG
- [x] T023 [US5] Add the Facebook button to `SocialLoginButtons.tsx` render output — styled with `bg-[#1877F2]` (Facebook blue), white text, `hover:bg-[#166FE5]`, `active:bg-[#1661CF]`, white spinner variant while loading
- [x] T024 [US5] Update `frontend/components/auth/SignupForm.tsx` to: (a) import `SocialLoginButtons`, (b) render `<SocialLoginButtons mode="signup" />` after the submit button and before the footer text — no error param handling needed (social errors redirect to `/login`)

**Checkpoint**: Run `npx vitest run tests/components/SocialLoginButtons.test.tsx` — all T007–T021 pass. Open `/signup` in browser — both Google and Facebook buttons visible. Open `/login` — both buttons visible.

---

## Phase 5: Testing — All Authentication Systems

**Purpose**: Verify the complete authentication matrix: email/password (existing), Google (new), and Facebook (new). Tests cover happy paths, error paths, account linking, and JWT validity across all methods.

**Goal**: Every auth method produces a valid RS256 JWT stored in localStorage, the `useSession` hook resolves to `authenticated`, and protected API calls succeed.

### Unit Tests (Vitest)

- [x] T025 [P] Add test to `frontend/tests/components/SocialLoginButtons.test.tsx`: "error query param google_failed renders user-friendly message in SignInForm" — render `<SignInForm />` with `?error=google_failed` in URL, assert error message "Google sign-in failed. Please try again or use email/password." is visible
- [x] T026 [P] Add test: "error query param access_denied renders cancelled message" — render `<SignInForm />` with `?error=access_denied`, assert "Sign-in was cancelled." message
- [x] T027 [P] Add test: "error query param state_mismatch renders security message" — render `<SignInForm />` with `?error=state_mismatch`, assert "Sign-in failed: security check failed. Please try again." message
- [x] T028 [P] Add test to `frontend/tests/token-storage.test.ts`: "stores and retrieves JWT token regardless of auth method" — verify TokenStorage.setAccessToken / getAccessToken / isExpired works with a social-login-format JWT (same RS256 structure as email JWT)
- [x] T029 [P] Add integration test file `frontend/tests/integration/auth-all-methods.test.ts`: verify `authClient.signIn.email` mock, `authClient.signIn.social` for google mock, and `authClient.signIn.social` for facebook mock all result in `authClient.token()` being callable — tests the unified session interface across all providers

### Manual End-to-End Tests (Browser)

- [ ] T030 [US4] Manual E2E — Google login happy path: open `/login`, click "Continue with Google", sign in with a real Google account, verify redirect to `/dashboard`, open browser DevTools → Application → Local Storage, confirm `better_auth_access_token` is present and is a valid 3-part JWT, open Network tab and verify a `/api/auth/token` call succeeded
- [ ] T031 [US5] Manual E2E — Facebook login happy path: open `/login`, click "Continue with Facebook", sign in using a Facebook test user (created in Facebook Developer Portal under Roles → Test Users), verify redirect to `/dashboard`, confirm JWT in localStorage
- [ ] T032 Manual E2E — Email/password login still works: open `/login`, enter valid credentials, click "Sign In", verify dashboard loads and JWT is in localStorage — confirms social login addition did not regress email auth
- [ ] T033 Manual E2E — Email/password signup still works: open `/signup`, create a new account via email form, verify redirect to `/dashboard` — confirms social login addition did not regress email signup
- [ ] T034 [US4] Manual E2E — Account linking (Google + existing email): create an account via email/password using email address `test@example.com`, sign out, click "Continue with Google" using a Google account with the same email `test@example.com`, verify user lands on `/dashboard` as the SAME user (same user ID), verify no duplicate user record is created in the database `user` table
- [ ] T035 [US5] Manual E2E — Account linking (Facebook + existing email): same as T034 but using Facebook instead of Google
- [ ] T036 Manual E2E — Google login cancellation: click "Continue with Google", on the Google consent screen click "Cancel"/"Back", verify redirect back to `/login` with an appropriate error message (should show "Sign-in was cancelled." or similar)
- [ ] T037 Manual E2E — Facebook login cancellation: click "Continue with Facebook", on the Facebook dialog click "Cancel", verify redirect back to `/login` with an error message
- [ ] T038 Manual E2E — JWT valid after Google login: after Google login, open DevTools Console, run `fetch('/api/tasks', { headers: { Authorization: 'Bearer ' + localStorage.getItem('better_auth_access_token') } })` and verify the backend returns 200 (not 401) — confirms RS256 JWT from social login is accepted by FastAPI backend
- [ ] T039 Manual E2E — Protected route redirect: open an incognito window, navigate directly to `/dashboard`, verify redirect to `/login?from=/dashboard` — confirms social login did not break the auth guard

### Security Verification

- [ ] T040 Verify CSRF protection: in DevTools → Network, find a social login initiation request, copy the `state` parameter from the Google/Facebook redirect URL, manually construct a callback URL with a different `state` value, send it to `/api/auth/callback/google?code=fake&state=tampered`, verify HTTP 400 response (not a redirect to dashboard)
- [ ] T041 Verify no credentials in source: run `grep -r "GOOGLE_CLIENT_SECRET\|FACEBOOK_CLIENT_SECRET" frontend/lib frontend/components frontend/app` and confirm zero matches — secrets must only appear in `.env` files which are gitignored
- [ ] T042 Verify `.env` files are gitignored: run `git status frontend/.env.local` and confirm it shows as untracked (not staged), verify `.gitignore` contains `.env.local`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Update `frontend/.env.example` final review: ensure all 4 new variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET) are present with placeholder values and comments pointing to provider consoles and listing the exact callback URI format to register
- [ ] T044 [P] Type-check: run `cd frontend && npx tsc --noEmit` — verify zero TypeScript errors introduced by `SocialLoginButtons.tsx`, updated `SignInForm.tsx`, and updated `SignupForm.tsx`
- [ ] T045 [P] Lint: run `cd frontend && npx eslint components/auth/SocialLoginButtons.tsx components/auth/SignInForm.tsx components/auth/SignupForm.tsx` — verify zero ESLint warnings or errors
- [ ] T046 [P] Run full Vitest suite: `cd frontend && npx vitest run` — verify all existing tests still pass (token-storage, api-client-jwt, integration, utils) in addition to new social login tests
- [ ] T047 Update `frontend/README.md` or `docs/` to add a "Social Login Setup" section listing: (a) required env vars, (b) Google Console registration steps, (c) Facebook Developer Portal registration steps, (d) local dev instructions for Facebook test users

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)       → No dependencies — start immediately
Phase 2 (Foundational) → Depends on Phase 1 (env vars must exist for migration)
Phase 3 (US4 Google)  → Depends on Phase 2 (server config + DB migration must be done)
Phase 4 (US5 Facebook) → Depends on Phase 2 (can run in parallel with Phase 3)
Phase 5 (Testing)     → Depends on Phases 3 + 4 (all buttons implemented)
Phase 6 (Polish)      → Depends on Phase 5 passing
```

### User Story Dependencies

- **US4 (Google)**: Needs T001–T006 complete; can start T007–T016 immediately after
- **US5 (Facebook)**: Needs T001–T006 complete; T017–T023 can run in parallel with US4 tasks since `SocialLoginButtons.tsx` is created in T012 (US4) and extended by T022–T023 (US5)
- **US4 and US5 share `SocialLoginButtons.tsx`**: implement Google button (T012–T014) first, then add Facebook button (T022–T023) to the same file — do not implement both at the same time in the same file

### Within Each User Story

- Tests (T007–T011, T017–T021) can all be written in parallel (they target the same file and don't depend on each other)
- Tests MUST be written BEFORE the component is created — verify they fail first
- T012 (create SocialLoginButtons) MUST precede T015 (update SignInForm) and T024 (update SignupForm)
- T006 (DB migration) MUST precede all E2E tests

### Parallel Opportunities

```
Parallel group A (Phase 1):  T002, T003 — external registrations, no file conflicts
Parallel group B (Phase 2):  T004, T005 — different files (auth.config.ts vs better-auth.ts)
Sequential group C (US4 tests): T007, T008, T009, T010, T011 — all write to same test file; write sequentially, do NOT run in parallel
Parallel group D (US5 tests): T017, T018, T019, T020, T021 — append to existing test file
Parallel group E (Phase 5 unit): T025, T026, T027, T028, T029 — all independent
Parallel group F (Phase 6):  T043, T044, T045, T046, T047 — all independent
```

---

## Implementation Strategy

### MVP First (Get Google Login Working)

1. Complete Phase 1 (T001–T003) — env + provider registration
2. Complete Phase 2 (T004–T006) — server config + DB
3. Write US4 unit tests (T007–T011) — verify they FAIL
4. Implement SocialLoginButtons + Google button + SignInForm update (T012–T016)
5. Verify T007–T011 now PASS
6. **STOP and VALIDATE**: Manual E2E T030 (Google login), T032 (email still works)
7. Demo Google login working ✅

### Full Delivery

8. Add US5 unit tests (T017–T021) — verify they FAIL
9. Add Facebook button to SocialLoginButtons + SignupForm (T022–T024)
10. Verify T017–T021 now PASS
11. Manual E2E Facebook tests (T031, T035, T037)
12. Complete all auth system tests (T030–T042)
13. Polish phase (T043–T047)

---

## Acceptance Criteria Traceability

| Task(s) | Spec Requirement | Test |
|---------|-----------------|------|
| T001–T003 | FR-021, FR-022 (credentials configured) | T041, T042 |
| T004–T005 | FR-021, FR-022 (Better Auth server config) | T030, T031 |
| T006 | FR-023, FR-024 (account table for linking) | T034, T035 |
| T012–T013 | FR-018, FR-020 (Google button + OAuth flow) | T008, T010, T030 |
| T014 | FR-018–FR-020 (spinner/loading UX) | T010, T018 |
| T015–T016 | FR-018, FR-026 (error messages on login page) | T025–T027 |
| T022–T023 | FR-019, FR-020 (Facebook button + OAuth flow) | T017, T018, T031 |
| T024 | FR-018, FR-019 (buttons on signup page) | T021 |
| T034, T035 | FR-024 (account linking), SC-011 | Manual E2E |
| T036, T037 | FR-026 (provider error → user message) | T025–T027 |
| T040 | FR-025 (CSRF state validation) | Security test |
| T041, T042 | FR-021, FR-022, Constitution §III (no hardcoded secrets) | Security test |
| T030 | SC-009 (Google E2E works) | Manual E2E |
| T031 | SC-010 (Facebook E2E works) | Manual E2E |
| T034 | SC-011 (no duplicate accounts) | Manual E2E |
| T032, T033 | Regression: email/password still works | Manual E2E |
| T038 | FR-028 (social JWT accepted by FastAPI backend) | Manual E2E |
| T039 | Regression: auth guard not broken | Manual E2E |

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | T001–T003 | Env vars + provider registration |
| Phase 2: Foundational | T004–T006 | Server config + DB migration |
| Phase 3: US4 Google | T007–T016 | Unit tests + Google button implementation |
| Phase 4: US5 Facebook | T017–T024 | Unit tests + Facebook button + signup page |
| Phase 5: Testing | T025–T042 | All auth systems: unit, E2E, security |
| Phase 6: Polish | T043–T047 | Types, lint, docs |
| **Total** | **47 tasks** | |

**Parallel opportunities**: 6 parallel groups identified
**MVP scope**: T001–T016 + T030 + T032 (Google login + email regression)
**Full delivery**: T001–T047
