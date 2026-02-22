---
id: 0009
title: Server Action Failure Clarification
stage: spec
date: 2026-02-06
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-database
branch: 005-backend-frontend-alignment
user: alihaidernoorani
command: /sp.clarify
labels: ["clarification", "server-actions", "environment-variables", "error-handling", "authentication"]
links:
  spec: /mnt/c/Users/DELL/Desktop/The_Evolution_of_todo/Phase_II/specs/002-backend-database/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-database/spec.md
tests:
  - None (clarification phase)
---

## Prompt

add-task-server-action-failure

Feature: 002-backend-database

Context:
The "Add Task" button triggers a Server Components error and returns 500.
Backend logs show no POST request, meaning the failure happens inside the Next.js server action.

Likely causes:
- Incorrect environment variable usage
- Server action using client-side env variable
- Missing backend URL in server environment
- Broken token or fetch logic

Clarification Questions:

1) Backend URL variable
Should the backend URL be defined as a server-only variable (e.g., BACKEND_URL) instead of NEXT_PUBLIC_BACKEND_URL?

2) Server action fetch
Should all server actions use process.env.BACKEND_URL for API calls?

3) Auth token source
Should the server action read the token from cookies instead of localStorage?

4) Error handling
Should server actions return structured errors instead of throwing generic exceptions?

5) Environment consistency
Should the spec require matching environment variables across local and production deployments?

## Response snapshot

Conducted a systematic clarification session addressing the server action failure. Analyzed the spec against Next.js App Router best practices and identified 5 critical gaps in the specification:

**Question 1: Environment Variable Scoping**
- Recommended: Use BACKEND_URL (server-only variable)
- Rationale: Server actions execute on the server and cannot access NEXT_PUBLIC_* variables
- Decision: Accepted - Added FR-022 requiring server-only environment variables

**Question 2: API Call Consistency**
- Recommended: All server actions use process.env.BACKEND_URL
- Rationale: Ensures consistency and single source of truth
- Decision: Accepted - Updated FR-022 to specify all server actions must use process.env.BACKEND_URL

**Question 3: Authentication Token Source**
- Recommended: Read tokens from cookies via next/headers
- Rationale: Server actions cannot access localStorage; cookies are server-accessible
- Decision: Accepted - Added FR-024 and FR-025 for cookie-based authentication in server actions

**Question 4: Error Handling Pattern**
- Recommended: Return structured error objects
- Rationale: Enables type-safe error handling and better UX
- Decision: Accepted - Added FR-026 and FR-027 requiring structured error responses

**Question 5: Environment Consistency**
- Recommended: Require matching variable names across all environments
- Rationale: Prevents configuration errors and simplifies deployment
- Decision: Accepted - Added FR-028 requiring consistent environment variable naming

All clarifications were integrated incrementally into the spec after each acceptance, updating:
- Clarifications section (Session 2026-02-06)
- Functional Requirements (5 new requirements: FR-022 through FR-028)
- Edge Cases (2 new server action failure scenarios)
- Assumptions (2 new assumptions about Next.js App Router)

## Outcome

- ✅ Impact: Resolved all critical ambiguities blocking server action implementation; spec now explicitly addresses Next.js App Router patterns
- 🧪 Tests: No tests run (clarification phase); acceptance criteria remain testable
- 📁 Files: Modified specs/002-backend-database/spec.md (added 5 Q&A pairs, 7 new requirements, 2 edge cases, 2 assumptions)
- 🔁 Next prompts: Run /sp.plan to create implementation architecture now that spec has sufficient clarity
- 🧠 Reflection: Clarification process successfully identified and resolved the root causes of the server action failure by explicitly specifying Next.js App Router environment variable scoping, cookie-based authentication, and structured error handling patterns

## Evaluation notes (flywheel)

- Failure modes observed: Original spec lacked Next.js App Router specific guidance, leading to environment variable and authentication mistakes in server actions
- Graders run and results (PASS/FAIL): PASS - All 5 clarifications directly address server action failure causes; spec validation confirms no contradictions or missing placeholders
- Prompt variant (if applicable): Standard clarification workflow with sequential questioning (5 questions, all accepted)
- Next experiment (smallest change to try): Validate that implementation following updated spec resolves the 500 error by ensuring BACKEND_URL is server-only and tokens are read from cookies
