---
id: 0009
title: auth-spec-alignment-with-better-auth
stage: spec
date: 2026-02-05
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-auth-security
branch: 004-modern-ui-ux-dashboard
user: alihaidernoorani
command: /sp.clarify
labels: ["authentication", "better-auth", "jwt", "specification", "clarification", "oidc", "rs256", "jwks"]
links:
  spec: /mnt/c/Users/DELL/Desktop/The_Evolution_of_todo/Phase_II/specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - /mnt/c/Users/DELL/Desktop/The_Evolution_of_todo/Phase_II/specs/003-auth-security/spec.md
tests:
  - null
---

## Prompt

auth-spec-alignment-with-better-auth

Feature: 003-auth-security

Context:
Implementation revealed mismatches between the specification and Better Auth's actual behavior.
Spec currently assumes:
- Custom `uid` JWT claim
- HS256 algorithm
- Implicit JWT plugin enablement

Better Auth actually:
- Uses OIDC-standard `sub` claim
- Defaults to RS256 with JWKS
- Requires explicit JWT plugin configuration

Clarification Questions:

1) JWT Claim Source
Should the backend use the OIDC-standard `sub` claim as `user_id`, or should we enforce a custom `uid` claim?

2) JWT Algorithm Strategy
Should the system:
A) Use HS256 with a shared secret (simpler, fewer moving parts), or
B) Use RS256 with JWKS (Better Auth default, more secure and scalable)?

3) JWT Plugin Requirement
Should the specification explicitly require the Better Auth JWT plugin to be enabled for token issuance?

4) Environment Configuration
Should the spec define required environment variables and alignment between frontend and backend auth configuration?

5) Dependency Alignment
Should the spec mandate specific libraries for configuration and token verification to match the actual implementation?

Goal:
Resolve these ambiguities so the specification accurately reflects Better Auth defaults and the intended architecture.

## Response snapshot

Executed 5-question clarification session with user acceptance of all recommendations:

1. **JWT Claim**: Use OIDC-standard `sub` claim (not custom `uid`)
2. **Algorithm**: RS256 with JWKS (not HS256 with shared secret)
3. **JWT Plugin**: Explicitly require Better Auth JWT plugin to be enabled
4. **Environment Config**: Define required variables (BETTER_AUTH_URL, JWKS endpoint) and frontend-backend alignment
5. **Dependencies**: Mandate specific libraries (PyJWT>=2.8.0 with cryptography or python-jose[cryptography])

**Spec Updates Applied**:
- Added Clarifications section with Session 2026-02-05 containing all 5 Q&A pairs
- Updated all `uid` references to `sub` throughout spec (acceptance scenarios, requirements, entities, assumptions)
- Updated all HS256/shared secret references to RS256/JWKS model
- Added explicit JWT plugin requirement to Success Criteria and FR-001
- Created new Environment Configuration section defining frontend/backend variables and alignment
- Updated Dependencies section with specific library versions and cryptographic requirements
- Renumbered functional requirements (FR-001 through FR-016)

**Coverage Resolution**:
All critical categories resolved - specification now accurately reflects Better Auth defaults and provides explicit implementation requirements.

## Outcome

- ✅ Impact: Resolved all spec-implementation mismatches; specification now aligned with Better Auth defaults (RS256, JWKS, `sub` claim)
- 🧪 Tests: No tests run (specification clarification phase)
- 📁 Files: 1 file modified (specs/003-auth-security/spec.md)
- 🔁 Next prompts: /sp.plan (ready for architectural planning with clarified spec)
- 🧠 Reflection: Interactive clarification workflow successfully identified and resolved 5 critical architectural mismatches that would have caused implementation failures. All recommendations accepted, ensuring Better Auth compatibility.

## Evaluation notes (flywheel)

- Failure modes observed: None - all clarifications successfully integrated incrementally after each user acceptance
- Graders run and results (PASS/FAIL): N/A (specification phase, no code to test)
- Prompt variant (if applicable): Standard /sp.clarify workflow with context-aware question prioritization
- Next experiment (smallest change to try): Proceed to /sp.plan to validate that clarified spec generates correct architectural decisions for RS256/JWKS implementation
