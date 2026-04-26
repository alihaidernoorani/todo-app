---
id: "0034"
title: Analyze Spec Plan Tasks Social Login
stage: misc
date: 2026-04-26
surface: agent
model: claude-sonnet-4-6
feature: 003-auth-security
branch: 012-oauth-social-login
user: Ali Haider Noorani
command: /sp.analyze
labels: ["analysis","qa","spec","plan","tasks","social-login","constitution","consistency"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/spec.md
  - specs/003-auth-security/plan-social-login.md
  - specs/003-auth-security/tasks-social-login.md
tests:
  - null
---

## Prompt

Analyze the spec, plan and tasks. Make sure that there are no contradictions and nothing that violates the constitution. Write a comprehensive report and if there are any critical problems found, suggest solutions

## Response snapshot

Produced a comprehensive /sp.analyze report cross-referencing spec.md (FR-018–FR-028, US4–US5), plan-social-login.md, tasks-social-login.md (T001–T047), and constitution.md v2.3.0.

**15 findings total**: 2 CRITICAL, 3 HIGH, 6 MEDIUM, 4 LOW

**CRITICAL issues**:
1. C1: T015/T016 ordering bug — T015 says "import SOCIAL_ERROR_MESSAGES" but T016 defines it in the same file; cannot import from self; will cause implementing agent to produce broken code
2. C2: FR-027 coverage gap — no error code for Facebook no-email case in SOCIAL_ERROR_MESSAGES map; no test task to verify US5 Acceptance Scenario 5

**HIGH issues**:
3. H1: Cancellation message mismatch — spec says "sign-in was cancelled", but errorCallbackURL produces "sign-in failed" via `${provider}_failed` code; acceptance criteria not met
4. H2: T038 references `/api/protected-route` which doesn't exist; test will always return 404
5. H3: T007–T011 marked [P] but dependency note says "write sequentially to same file" — direct contradiction

**MEDIUM issues**:
6. M1: T025–T027 test SignInForm but are placed in SocialLoginButtons.test.tsx
7. M2: No task covers US4/US5 AS6 (profile display on dashboard after social login)
8. M3: T012 mentions "both buttons disabled" before Facebook button exists (T022)
9. M4: T007 mocks useRouter which SocialLoginButtons doesn't use
10. M5: No task for Vercel/K8s production env var setup for social credentials
11. M6: SOCIAL_ERROR_MESSAGES missing server_error/provider_unavailable code

**Constitution alignment**: 0 new violations; 1 partial gap (M5 — Secrets Management §XXII for production). Pre-existing hardcoded secret fallback in better-auth.ts noted (not introduced by this PR).

**Coverage**: 9/11 FRs fully covered (82%); FR-026 partial; FR-027 gap. 47 tasks; 0 unmapped.

Offered concrete remediation edits for top 5 findings pending user approval.

## Outcome

- ✅ Impact: 15 issues identified; 2 critical blockers for /sp.implement; actionable fix recommendations provided for all
- 🧪 Tests: Analysis is read-only; no tests modified
- 📁 Files: No files modified (read-only analysis)
- 🔁 Next prompts: Apply remediation for C1, C2, H1, H2, H3, then run /sp.implement
- 🧠 Reflection: The two critical issues (T015/T016 ordering and FR-027 no-email coverage) are implementation-blocking. H1 (cancellation message mismatch) would cause spec acceptance scenario failures that could only be discovered in E2E testing.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Apply C1+C2+H1+H2+H3 fixes to tasks-social-login.md, then run /sp.implement
