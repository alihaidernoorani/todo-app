---
id: "0012"
title: "Revise Frontend Architecture Clean Light Mode"
stage: plan
date: 2026-02-02
surface: agent
model: claude-opus-4-5-20251101
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: alihaidernoorani
command: /sp.plan
labels: ["frontend", "architecture", "design-system", "authentication", "rebranding"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-modern-ui-ux-dashboard/plan.md
  - specs/004-modern-ui-ux-dashboard/data-model.md
  - specs/004-modern-ui-ux-dashboard/quickstart.md
tests:
  - null
---

## Prompt

Action: Revise the frontend architecture and design system. Invoke 'ui-structure-architect' and 'ui-interaction-designer'.

New Blueprint Requirements:

1.  **Authentication Flow (Priority High):**
    -   Create public `/login` and `/signup` pages using Better Auth's client-side form components.
    -   Implement client-side route protection. The `DashboardLayout` should check for a valid session. If unauthenticated, redirect the user to `/login`.

2.  **Visual Theme Revision ("Clean Light Mode"):**
    -   Replace the "Midnight Stone" dark theme with a modern light palette.
    -   **Backgrounds:** Use clean white (`bg-white`) and very light grays (`bg-slate-50`) for content areas and the sidebar.
    -   **Typography:** Use dark slate (`text-slate-900`) for primary text for high contrast. Retain 'Inter' and 'Playfair Display' fonts.
    -   **Accent Color:** Change the amber accent to a professional and friendly color, like a clear primary blue (e.g., Tailwind's `blue-600`).

3.  **Rebranding & Clarity:**
    -   Rename the application from "Command Center" to a clear, functional name related to Todo application like "TaskMaster" or "SimpleDo".
    -   Update all headers and titles. For example, change "Mission Control" to "My Tasks" or "Daily Overview".

4.  **UI Structure Refinements:**
    -   Maintain the existing sidebar-plus-content layout structure.

## Response snapshot

Revised the implementation plan for the Modern UI/UX Dashboard with the following major changes:

**1. Design System: "Clean Light Mode"**
- Replaced "Midnight Stone" dark theme with professional light palette
- Background colors: white (`#ffffff`), slate-50 (`#f8fafc`), slate-100 (`#f1f5f9`)
- Text colors: slate-900 (`#0f172a`) for primary, slate-600 (`#475569`) for secondary
- Accent colors: blue-600 (`#2563eb`) as primary, blue-700 (`#1d4ed8`) for hover
- Removed glassmorphism in favor of clean shadows and crisp borders

**2. Authentication Architecture**
- Created public routes: `/login` and `/signup` (replaced `/sign-in`)
- Implemented `AuthGuard` client component for route protection
- Dashboard layout wraps content with session check, redirects unauthenticated users to `/login`

**3. Rebranding**
- Application renamed from "Command Center" to "TaskFlow"
- Page headers updated: "Mission Control" → "My Tasks"
- Terminology updates throughout (Command Center → TaskFlow, etc.)

**4. Component Updates**
- `LuxuryButton` renamed to `PrimaryButton` with blue accent styling
- Added `LoginForm`, `SignupForm`, `AuthGuard` components
- `ShimmerSkeleton` updated for light theme (bg-slate-200)
- Sidebar and Topbar updated with "TaskFlow" branding

**Files Modified:**
- `specs/004-modern-ui-ux-dashboard/plan.md` - Complete architectural revision
- `specs/004-modern-ui-ux-dashboard/data-model.md` - Component hierarchy updated
- `specs/004-modern-ui-ux-dashboard/quickstart.md` - Updated for new routes and design system

## Outcome

- ✅ Impact: Major architectural revision - design system, auth flow, and branding updated
- 🧪 Tests: N/A (planning phase, no code changes)
- 📁 Files: 3 files modified (plan.md, data-model.md, quickstart.md)
- 🔁 Next prompts: Run `/sp.tasks` to regenerate implementation tasks with revised architecture
- 🧠 Reflection: Comprehensive plan revision covering visual design, authentication flow, and rebranding in single session

## Evaluation notes (flywheel)

- Failure modes observed: None - user clarified scope (update plan, not implement code)
- Graders run and results (PASS/FAIL): N/A (planning phase)
- Prompt variant (if applicable): Standard /sp.plan with architectural revision focus
- Next experiment (smallest change to try): Validate design tokens in Tailwind config during implementation
