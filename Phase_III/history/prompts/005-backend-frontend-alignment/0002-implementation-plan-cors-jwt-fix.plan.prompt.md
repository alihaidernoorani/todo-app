---
id: 0002
title: Implementation Plan CORS JWT Fix
stage: plan
date: 2026-02-05
surface: agent
model: claude-sonnet-4-5-20250929
feature: 005-backend-frontend-alignment
branch: 005-backend-frontend-alignment
user: alihaidernoorani
command: /sp.plan
labels: ["planning", "cors", "jwt", "authentication", "environment-config"]
links:
  spec: specs/005-backend-frontend-alignment/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-backend-frontend-alignment/plan.md
  - specs/005-backend-frontend-alignment/quickstart.md
tests:
  - Manual testing checklist defined in plan
  - Integration test suite outlined (9 test cases)
---

## Prompt

Create a technical plan to resolve the 422 and 401 errors.

Update src/main.py to include CORSMiddleware with allow_credentials=True and a list of allowed origins from an environment variable.

Ensure Pydantic schemas in src/api match the frontend payload structure.

Verify that the session dependency correctly reads the Better Auth tokens from cookies/headers.

Use python-dotenv to manage BETTER_AUTH_URL and ALLOWED_ORIGINS.

## Response snapshot

Created comprehensive implementation plan with following structure:

**Phase 0 - Research & Resolution** (4 research topics):
1. **RT-001**: CORS wildcard support → FastAPI doesn't support `*.vercel.app`, use `allow_origin_regex`
2. **RT-002**: python-dotenv needed? → NO, pydantic-settings handles .env natively
3. **RT-003**: Better Auth token transmission → Uses both cookies AND JWT headers (confirmed Authorization header approach correct)
4. **RT-004**: Multiple origins format → Comma-separated string with Pydantic validator

**Phase 1 - Design & Contracts**:
- No data model changes (existing schemas already align)
- API contract unchanged (REST endpoints correct)
- Configuration schema updated: Add `allowed_origins` field with comma-separated parsing validator
- CORS design: Use both `allow_origins` (exact matches) and `allow_origin_regex` (Vercel preview pattern)

**Phase 2 - Implementation Strategy** (4 components):
1. `backend/src/config.py`: Add `allowed_origins` field with validator
2. `backend/src/main.py`: Replace hardcoded origins with env-driven config, add regex pattern
3. `backend/.env.example`: Document ALLOWED_ORIGINS and BETTER_AUTH_URL
4. `quickstart.md`: Developer setup guide (environment config, testing steps, troubleshooting)

**Phase 3 - Validation & Testing**:
- Integration test suite: 9 test cases for CORS preflight, JWT validation, schema validation
- Manual testing checklist: CORS, JWT, schema validation flows
- Browser testing: DevTools network tab verification

**Phase 4 - Deployment Strategy**:
- Environment configs per environment (local, staging, production)
- Deployment checklists for backend and Vercel frontend
- Rollback plan for CORS and JWT issues

**Current State Analysis** (findings from codebase inspection):
- ✅ CORS already configured with `allow_credentials=True` and correct headers
- ⚠️ Origins hardcoded (needs env variable)
- ✅ Pydantic schemas already match frontend (TaskCreate, TaskUpdate, TaskRead)
- ✅ JWT validation already correct (RS256 with JWKS, extracts `sub` claim)
- ✅ Session dependency already correct (UserIdDep validates JWT + user_id)
- ⚠️ Missing: `ALLOWED_ORIGINS` environment variable

**Root Cause Hypothesis**:
- 422 errors: Likely already resolved (schemas align)
- 401 errors: CORS preflight failing OR Better Auth URL misconfigured OR JWKS unreachable

**Constitution Check**: ✅ COMPLIANT (all MUST requirements satisfied)

## Outcome

- ✅ Impact: Comprehensive technical plan created to resolve authentication and validation errors through environment-driven CORS configuration
- 🧪 Tests: 9 integration test cases defined + manual testing checklist + browser verification steps
- 📁 Files: Created plan.md (research, design, implementation, testing, deployment) and quickstart.md (developer setup guide)
- 🔁 Next prompts: `/sp.tasks` to generate actionable tasks from plan, then `/sp.implement` to execute
- 🧠 Reflection: Plan revealed that most backend code is already correct - main issue is hardcoded CORS origins. Research phase clarified that python-dotenv is NOT needed (pydantic-settings handles .env), and FastAPI requires regex for wildcard patterns.

## Evaluation notes (flywheel)

- Failure modes observed: Initial user prompt suggested python-dotenv, but research revealed pydantic-settings already handles .env loading (avoided unnecessary dependency). User assumed schemas misaligned, but inspection showed they already match frontend types.
- Graders run and results (PASS/FAIL): Constitution Check - PASS (6/6 principles compliant)
- Prompt variant (if applicable): Standard planning workflow with research phase
- Next experiment (smallest change to try): For future plans, add "Current State Inspection" phase BEFORE research to avoid researching already-implemented solutions. Would have saved RT-002 and RT-003 research (both confirmed existing implementation correct).
