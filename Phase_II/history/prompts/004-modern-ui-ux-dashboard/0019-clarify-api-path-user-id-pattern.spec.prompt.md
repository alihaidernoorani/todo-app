---
id: "0019"
title: Clarify API Path User ID Pattern
stage: spec
date: 2026-02-02
surface: agent
model: claude-opus-4-5-20251101
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: architect
command: /sp.clarify
labels: ["api-design", "authentication", "architecture", "clarification"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-modern-ui-ux-dashboard/spec.md
tests:
  - null
---

## Prompt

Backend task endpoints require path-based user context: /api/{user_id}/tasks, so update all the specs accordingly

## Response snapshot

Resolved critical architectural conflict between spec (client must not construct user_id paths) and backend requirement (path-based user context). Updated spec to use Server Action pattern: client obtains user_id via Next.js Server Action that reads HttpOnly cookie server-side, then constructs `/api/{user_id}/tasks` paths. Client-side JavaScript never directly decodes JWT payload.

**Clarification recorded:**
- Q: How should the frontend obtain user_id for path-based API endpoints when client-side JavaScript cannot access JWT?
- A: Frontend obtains user_id via Server Action (server reads cookie, decodes JWT, returns user_id) and constructs `/api/{user_id}/tasks` paths

**Sections updated:**
- Clarifications (Session 2026-02-02)
- FR-002, FR-003 (Functional Requirements)
- User Story 6 Acceptance Scenario 3
- Dependencies
- Assumptions

## Outcome

- ✅ Impact: Resolved spec/backend architectural conflict; aligned API path pattern
- 🧪 Tests: N/A (spec clarification only)
- 📁 Files: 1 file updated (spec.md)
- 🔁 Next prompts: /sp.plan to update implementation plan with Server Action pattern
- 🧠 Reflection: Server Action pattern preserves security (no client-side JWT decode) while enabling required path-based API calls

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
