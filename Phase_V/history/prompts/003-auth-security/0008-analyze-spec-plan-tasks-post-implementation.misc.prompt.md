---
id: 0008
title: Analyze Spec Plan Tasks Post Implementation
stage: misc
date: 2026-02-05
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: 004-modern-ui-ux-dashboard
user: alihaidernoorani
command: /sp.analyze
labels: ["analysis", "specification", "quality-assurance", "documentation-drift", "auth-fix"]
links:
  spec: /specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - history/prompts/003-auth-security/0008-analyze-spec-plan-tasks-post-implementation.misc.prompt.md
  - /tmp/.../specification-analysis-report.md (analysis output)
tests:
  - null
---

## Prompt

Based on the recommendations in the last implementation, please highlight any upgradations needed in the specs, plan and tasks and what needs to be changed

**Context**: Phases 1-4 of UUID→string migration completed (13/30 tasks). Implementation discovered critical mismatches between documented specifications and Better Auth reality.

## Response snapshot

Generated comprehensive specification analysis report identifying **11 issues** (4 CRITICAL, 4 HIGH, 3 MEDIUM).

### Key Findings

#### CRITICAL Issues (BLOCKING):

**C1: Wrong JWT Claim Name** (spec.md, plan.md, data-model.md)
- **Problem**: All artifacts document `uid` claim, but Better Auth uses OIDC standard `sub` claim
- **Impact**: Implementation already uses `sub` (Phases 1-4), creating spec/implementation drift
- **Locations**: 10+ occurrences across spec.md (lines 15, 49, 57, 91, 103, 120), plan.md (lines 8, 210), data-model.md (lines 28, 56, 69)
- **Fix**: Global find/replace `uid` → `sub` + update FR-004

**C2: Algorithm Mismatch**
- **Problem**: Spec mandates HS256 (symmetric), Better Auth defaults to RS256 (asymmetric with JWKS)
- **Impact**: Implementation has HS256 code but should use RS256 for security/scalability
- **Decision Needed**: Force HS256 (simpler) OR switch to RS256 with JWKS (recommended)
- **Fix**: Update spec FR-001, plan Technical Context, add architectural decision

**C3: JWT Payload Structure Mismatch**
- **Problem**: data-model.md shows `uid` field, comment says "not sub as in standard JWT" (backwards)
- **Impact**: Future developers will implement wrong claim name
- **Fix**: Update JWTPayload model line 28, example line 41, validation rules line 56-69

**C4: Missing Requirement**
- **Problem**: JWT plugin must be enabled in Better Auth, but not documented anywhere
- **Impact**: Frontend has JWT plugin commented out (lines 123-129 in better-auth.ts), no tokens generated
- **Fix**: Add FR-016 to spec, add configuration note to plan Technical Context

#### HIGH Issues:

**H1**: "Shared Secret" terminology misleading (implies HS256, should use JWKS/RS256)
**H2**: No architectural decision documented for algorithm choice
**H3**: Dependencies mismatch (plan says `python-dotenv`, code uses `pydantic-settings`)
**H4**: Missing requirement for matching env vars between frontend/backend

#### Coverage Analysis:

- ✅ **15/15 requirements mapped to tasks**
- ✅ **All user stories covered**
- ✅ **No orphaned tasks**
- ❌ **FR-004 implemented incorrectly** (uses `sub` but spec says `uid`)
- ❌ **FR-001 mismatch** (HS256 documented, RS256 recommended)

#### Constitution Alignment:

✅ **PASS** - No constitutional violations detected
- All auth code in proper tier (`/backend/src/auth/`)
- Stateless design maintained
- Security enforced via dependencies
- All changes via sp.implement workflow

### Remediation Plan

**Priority 1 (CRITICAL - 90 minutes)**:
1. Replace `uid` → `sub` globally (15 min)
2. Decide algorithm: HS256 or RS256 (30-60 min)
3. Update JWT payload model (10 min)
4. Add JWT plugin requirement (5 min)

**Priority 2 (HIGH - 30 minutes)**:
5. Add architectural decision for algorithm
6. Update dependencies list
7. Add environment variable requirement

**Priority 3 (MEDIUM - 15 minutes)**:
8. Fix JWT payload example (UUID format)
9. Fix backwards comment in data-model.md
10. Add validation rule for unknown claims

### Recommendations

**Option A: Quick Fix (HS256)**
- Force HS256 in Better Auth: `jwt({ jwks: { keyPairConfig: { alg: 'HS256' } } })`
- Keep spec/plan as-is
- Match `BETTER_AUTH_SECRET` in both .env files
- Time: ~30 minutes artifact updates

**Option B: Secure Fix (RS256) - RECOMMENDED**
- Update spec/plan for RS256 + JWKS
- Add Decision 5 to plan.md
- Update backend to fetch JWKS
- Add `httpx` dependency
- Time: ~90 minutes artifact updates + implementation

### Next Steps

1. ✅ **Fix artifacts first** (C1-C4) - 90 minutes
2. ✅ **Decide algorithm approach** (A or B)
3. ✅ **Generate new tasks**: `/sp.tasks connectivity-fix`
4. ✅ **Continue implementation**: `/sp.implement`

**Alternative (NOT RECOMMENDED)**: Skip updates and proceed
- ⚠️ Risk: Documentation drift, future confusion, test failures, audit failures

## Outcome

- ✅ Impact: Identified 11 critical accuracy issues in specifications. Provided detailed remediation plan with time estimates. Confirmed no constitution violations.
- 🧪 Tests: No tests run (analysis only)
- 📁 Files: Generated comprehensive analysis report in scratchpad
- 🔁 Next prompts:
  1. Apply recommended fixes to spec.md, plan.md, data-model.md
  2. `/sp.tasks connectivity-fix` after artifacts updated
  3. Manual decision needed: HS256 (simpler) vs RS256 (more secure)
- 🧠 Reflection: Analysis successfully identified root causes of documentation drift. The spec was written before implementation revealed Better Auth uses OIDC standard `sub` claim (not custom `uid` claim). Algorithm choice (HS256 vs RS256) was assumed without verification. User's question was precisely on target - artifacts need updates before generating new tasks. Analysis tool provided actionable, line-specific remediation guidance.

## Evaluation notes (flywheel)

- Failure modes observed:
  - Initial spec assumed custom Better Auth claim naming (`uid`), but Better Auth follows OIDC standard (`sub`)
  - HS256 assumed without researching Better Auth JWT plugin defaults (RS256)
  - JWT plugin enablement not captured as explicit requirement (implicit assumption)
  - Comment in data-model.md line 69 was backwards, suggesting confusion during drafting
- Graders run and results (PASS/FAIL): N/A (analysis only, no code execution)
- Prompt variant (if applicable): spec-analysis-post-implementation-v1
- Next experiment (smallest change to try):
  1. Before writing specs, verify framework defaults via MCP/documentation lookup
  2. Add "Configuration Requirements" section to spec template for explicit framework setup
  3. Use Better Auth MCP to validate JWT claim structure before assuming custom names
  4. Add spec validation step after research phase to catch assumptions vs reality
  5. Create spec/plan review checklist: "Does this match framework defaults or are we customizing?"
