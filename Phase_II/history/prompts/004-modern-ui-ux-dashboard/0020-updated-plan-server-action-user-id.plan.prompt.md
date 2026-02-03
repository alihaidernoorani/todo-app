---
id: "0020"
title: Updated Plan Server Action User ID
stage: plan
date: 2026-02-02
surface: agent
model: claude-opus-4-5-20251101
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: architect
command: /sp.plan
labels: ["architecture", "server-action", "user-id", "api-client", "security"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-modern-ui-ux-dashboard/plan.md
  - specs/004-modern-ui-ux-dashboard/data-model.md
  - specs/004-modern-ui-ux-dashboard/quickstart.md
  - specs/004-modern-ui-ux-dashboard/contracts/better-auth-flow.md
tests:
  - null
---

## Prompt

Generate an updated implementation plan strictly aligned with the clarified specification and backend API constraints.

Constraints:
- Public auth routes: /login and /signup with soft-deprecated legacy redirects.
- Backend API paths require /api/{user_id}/tasks.
- JWT stored in HttpOnly cookies and never accessed client-side.
- user_id extracted server-side in Next.js and passed to client components.
- Centralized ApiClient required for API calls.
- Design system name is 'Clean Light Mode'.
- Use 'PrimaryButton' consistently.

Include:
- Frontend architecture using Next.js App Router
- Server-side user_id extraction strategy
- Client component data flow for user_id
- ApiClient responsibilities and boundaries
- Backend FastAPI user-scoped data isolation

Do not generate tasks yet.

## Response snapshot

Updated implementation plan with Server Action architecture for user_id extraction:

**Key Architecture Decisions Documented:**
1. **Server Action Pattern**: `getUserId()` Server Action reads HttpOnly cookie server-side, decodes JWT, returns user_id string to client
2. **ApiClient Flow**: Initializes by calling Server Action, caches user_id, constructs `/api/{user_id}/tasks` paths
3. **Security Model**: Client never accesses JWT payload; only receives user_id string; backend validates JWT matches path user_id

**Files Updated:**
- `plan.md`: Added "Server-Side User ID Extraction Architecture" section with data flow diagram, Server Action implementation, ApiClient responsibilities table
- `data-model.md`: Updated "Frontend Enforcement" section to reflect Server Action pattern
- `better-auth-flow.md`: Replaced jwt-utils.ts with actions.ts; updated implementation examples
- `quickstart.md`: Updated troubleshooting and file structure references

**Research Task #4 Marked Resolved**: JWT user_id extraction risk mitigated via Server Action pattern.

## Outcome

- ✅ Impact: Plan now fully aligned with spec constraints (no client-side JWT decode, path-based API, Server Action pattern)
- 🧪 Tests: N/A (planning phase)
- 📁 Files: 4 files updated (plan.md, data-model.md, quickstart.md, better-auth-flow.md)
- 🔁 Next prompts: /sp.tasks to generate implementation tasks
- 🧠 Reflection: Server Action pattern cleanly separates server-side JWT handling from client-side API calls while maintaining security properties

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
