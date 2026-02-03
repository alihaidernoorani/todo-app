---
id: "0014"
title: "Fix Ecmascript Build Error in tasks.ts"
stage: green
date: 2026-02-01
surface: agent
model: claude-opus-4-5-20251101
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: alihaidernoorani
command: /sp.implement
labels: ["build-fix", "typescript", "server-actions", "refactor"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/api/errors.ts (created)
  - frontend/lib/api/tasks.ts (modified)
  - frontend/components/dashboard/MetricsGrid.tsx (modified)
  - frontend/components/dashboard/TaskStream.tsx (modified)
  - frontend/components/AppInitializer.tsx (modified)
  - frontend/components/WebVitalsReporter.tsx (modified)
  - frontend/lib/utils/accessibility.ts (modified)
  - frontend/lib/utils/env.ts (modified)
tests:
  - npm run build (PASS)
---

## Prompt

Action: Fix the 'Ecmascript' build error in `lib/api/tasks.ts`.

Instructions:
- ui-structure-architect: Move the `AuthenticationError` class to a new file `lib/api/errors.ts` (without 'use server').
- Ensure `lib/api/tasks.ts` only exports `async` functions to comply with Next.js 16/Turbopack rules.
- Maintain all futuristic-luxury styling and path-based logic during the refactor.

## Response snapshot

Fixed the Ecmascript build error by:

1. **Created `lib/api/errors.ts`** - New file containing `AuthenticationError` class without 'use server' directive, allowing it to be imported into both server and client contexts.

2. **Updated `lib/api/tasks.ts`** - Now imports `AuthenticationError` from the errors module instead of defining it inline. Only exports async server action functions.

3. **Updated component imports** - `MetricsGrid.tsx` and `TaskStream.tsx` now import `AuthenticationError` from the new errors module.

4. **Fixed additional TypeScript errors**:
   - Removed unused `validateTodoDashboardEnv` import from `AppInitializer.tsx`
   - Prefixed unused parameter with `_` in `WebVitalsReporter.tsx`
   - Commented out unused `createSkipLink` function in `accessibility.ts`
   - Fixed `ValidatedEnv` interface type conflict in `env.ts`

Build completed successfully with Next.js 16.1.4 (Turbopack).

## Outcome

- ✅ Impact: Build error resolved, application compiles successfully
- 🧪 Tests: npm run build PASS
- 📁 Files: 8 files modified/created
- 🔁 Next prompts: Continue with remaining implementation tasks
- 🧠 Reflection: Next.js 16/Turbopack has strict rules about 'use server' files only exporting async functions; class definitions must be in separate files

## Evaluation notes (flywheel)

- Failure modes observed: TypeScript noUnusedParameters false positive with JSX parameters
- Graders run and results (PASS/FAIL): Build PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A - issue resolved
