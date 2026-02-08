# UI/UX Dashboard Fix Plan

**Branch**: `fix/auth-session-redirect-loop` | **Date**: 2026-02-08
**Spec**: [spec.md](./spec.md) | **Original Plan**: [plan.md](./plan.md)
**Context**: User-requested UI fixes addressing spacing, task management, and mobile responsiveness

---

## Executive Summary

This plan addresses three critical areas to improve the TaskFlow dashboard:

1. **UI Improvements**: Fix spacing, padding, typography, and color consistency per "Clean Light Mode" design system
2. **Task Manager Functionality**: Implement proper controlled inputs, state management, and API integration
3. **Mobile Responsiveness**: Fix sign-out visibility, responsive layouts, and touch-friendly inputs

All changes align with the clarified spec (Session 2026-02-08) requiring generous spacing (p-8 to p-10 for layout, p-5 to p-6 for cards), mobile account menu with bottom sheet, floating labels, and responsive typography.

---

## Phase 1: UI Improvements (Spacing, Styling, Typography)

### Step 1.1: Dashboard Layout Spacing
**Agent**: Use **ui-structure-architect** for layout restructuring decisions

**Objective**: Apply generous spacing throughout main dashboard layout per FR-008a

**Changes**:
- Dashboard page (`frontend/app/dashboard/page.tsx`):
  - Increase outer container padding from `space-y-8` to `p-8 md:p-10` for premium feel
  - Update section spacing to `space-y-6 md:space-y-8`

**Files**:
- `frontend/app/dashboard/page.tsx`

**Success Criteria**:
- Main layout has 32-40px padding (p-8 to p-10)
- Sections have 24-32px vertical spacing
- Visual breathing room matches spec requirements

---

### Step 1.2: Metrics Grid Spacing
**Agent**: Use **ui-interaction-designer** for card layout and spacing

**Objective**: Apply generous grid gaps per FR-008a

**Changes**:
- MetricsGrid component (`frontend/components/dashboard/MetricsGrid.tsx`):
  - Update grid gap from `gap-4` to `gap-5 md:gap-6` (20-24px)
  - Update MetricCard padding to `p-5 md:p-6` (20-24px)

**Files**:
- `frontend/components/dashboard/MetricsGrid.tsx`
- `frontend/components/dashboard/MetricCard.tsx`

**Success Criteria**:
- Grid gap is 20-24px between cards
- Card internal padding is 20-24px
- Premium, spacious feel maintained

---

### Step 1.3: Task List Spacing
**Agent**: Use **ui-interaction-designer** for list layout

**Objective**: Apply vertical spacing to task list per FR-008a

**Changes**:
- TaskStream component (`frontend/components/dashboard/TaskStream.tsx`):
  - Update task list vertical spacing to `space-y-4 md:space-y-5` (16-20px)
- TaskItem component (`frontend/components/dashboard/TaskItem.tsx`):
  - Ensure card padding is `p-5 md:p-6`

**Files**:
- `frontend/components/dashboard/TaskStream.tsx`
- `frontend/components/dashboard/TaskItem.tsx`

**Success Criteria**:
- Task items have 16-20px vertical spacing
- Task cards have 20-24px internal padding
- Consistent spacing throughout list

---

### Step 1.4: Color Palette Consistency
**Agent**: Use **ui-ux-futuristic-designer** for color system validation

**Objective**: Ensure Clean Light Mode palette is applied consistently per FR-007

**Changes**:
- Audit all components for color usage:
  - Backgrounds: `bg-white` (primary), `bg-slate-50` (secondary), `bg-slate-100` (tertiary)
  - Text: `text-slate-900` (primary), `text-slate-600` (secondary), `text-slate-400` (muted)
  - Accents: `bg-blue-600` (primary), `bg-blue-700` (hover), `bg-blue-50` (light)
- Update any deviations (e.g., inconsistent slate shades)

**Files**:
- All component files in `frontend/components/`
- Global styles `frontend/app/globals.css`

**Success Criteria**:
- All backgrounds use specified Clean Light Mode colors
- Text hierarchy follows palette (#0f172a, #475569, #94a3b8)
- Blue accents (#2563eb) applied consistently

---

### Step 1.5: Responsive Typography
**Agent**: Use **ui-interaction-designer** for typography system

**Objective**: Implement responsive font sizes per FR-009b

**Changes**:
- Create responsive typography classes in Tailwind config:
  - Headings: `text-2xl md:text-3xl` (page titles)
  - Section headers: `text-lg md:text-xl`
  - Body text: `text-sm md:text-base`
  - Small text: `text-xs md:text-sm`
- Update all components to use responsive classes

**Files**:
- `frontend/tailwind.config.ts` (add responsive font utilities)
- `frontend/app/dashboard/page.tsx`
- All component files with text content

**Success Criteria**:
- Font sizes adapt between mobile and desktop
- Smaller sizes on mobile (text-sm to text-base)
- Larger sizes on desktop (text-base to text-lg)
- Optimal readability on all devices

---

## Phase 2: Task Manager Functionality

### Step 2.1: Controlled Input Fields
**Agent**: Use **ui-interaction-designer** for form UX patterns

**Objective**: Implement floating labels with focus states per FR-005b

**Changes**:
- TaskModal component (`frontend/components/dashboard/TaskModal.tsx`):
  - Implement floating label pattern for title and description fields
  - Add focus state styling (blue ring, label moves up on focus)
  - Add auto-focus to title field on modal open

**Files**:
- `frontend/components/dashboard/TaskModal.tsx`
- `frontend/components/dashboard/TaskForm.tsx`

**Success Criteria**:
- Labels float above fields on focus
- Blue focus rings (ring-blue-500)
- Title field auto-focuses on modal open
- Clean, modern input experience

---

### Step 2.2: Touch-Friendly Buttons
**Agent**: Use **ui-interaction-designer** for mobile UX

**Objective**: Ensure minimum 48px height for mobile tap targets per FR-005b

**Changes**:
- PrimaryButton component (`frontend/components/atoms/PrimaryButton.tsx`):
  - Update to `min-h-[48px]` for touch-friendly sizing
  - Ensure padding maintains comfortable hit area
- Apply to all form buttons (Submit, Cancel, Add Task, etc.)

**Files**:
- `frontend/components/atoms/PrimaryButton.tsx`
- `frontend/components/dashboard/TaskModal.tsx`
- `frontend/components/dashboard/TaskForm.tsx`

**Success Criteria**:
- All buttons have minimum 48px height
- Easy to tap on mobile devices
- Consistent sizing across all actions

---

### Step 2.3: Inline Validation
**Agent**: Use **ui-interaction-designer** for error state UX

**Objective**: Display error messages below invalid fields per FR-005b, FR-016

**Changes**:
- TaskForm component:
  - Add inline validation for required title field
  - Display error message directly below field with red text
  - Show user-friendly messages (not technical errors)
- InlineError component:
  - Update to support field-level errors (not just task-level)

**Files**:
- `frontend/components/dashboard/TaskForm.tsx`
- `frontend/components/dashboard/InlineError.tsx`

**Success Criteria**:
- Validation errors appear below fields
- Clear, friendly error messages
- Red text (`text-red-600`) for visibility
- No generic technical errors shown to users

---

### Step 2.4: State Management for CRUD Operations
**Agent**: Use **general-purpose** agent for state logic implementation

**Objective**: Fix task create/update/delete operations with proper state management

**Changes**:
- Review `useOptimisticTask` hook implementation:
  - Ensure optimistic create adds task immediately
  - Ensure optimistic update reflects changes instantly
  - Ensure optimistic delete removes task from UI
  - Proper rollback on API errors with friendly messages
- TaskStream component:
  - Wire up create handler to TaskModal
  - Wire up update handler to inline edit
  - Wire up delete handler with confirmation

**Files**:
- `frontend/lib/hooks/use-optimistic-task.ts`
- `frontend/components/dashboard/TaskStream.tsx`
- `frontend/components/dashboard/TaskItem.tsx`

**Success Criteria**:
- Tasks appear instantly on create (<100ms)
- Updates reflect immediately in UI
- Deletes remove from UI instantly
- Errors roll back with friendly messages
- No blocking on server confirmations

---

### Step 2.5: API Integration
**Agent**: Use **general-purpose** agent for API client verification

**Objective**: Ensure API calls use correct paths and handle errors per FR-002, FR-003

**Changes**:
- Verify ApiClient implementation:
  - Constructs paths as `{BACKEND_URL}/{user_id}{path}`
  - BACKEND_URL includes `/api` prefix
  - Proper error handling (401 → redirect, 500 → friendly message)
  - Credentials included (`credentials: 'include'`)
- Verify task API methods:
  - createTask, updateTask, deleteTask, toggleComplete all use ApiClient
  - Proper TypeScript types from backend schemas

**Files**:
- `frontend/lib/api/client.ts`
- `frontend/lib/api/tasks.ts`
- `frontend/lib/api/types.ts`

**Success Criteria**:
- API paths constructed correctly (`http://localhost:8000/api/{user_id}/tasks`)
- BACKEND_URL not duplicating `/api` prefix
- Friendly error messages shown to users
- 401 errors trigger session recovery
- All requests include HttpOnly cookies

---

## Phase 3: Mobile Responsiveness

### Step 3.1: Account Menu Bottom Sheet
**Agent**: Use **ui-interaction-designer** for mobile navigation pattern

**Objective**: Add Account menu item to mobile bottom nav with bottom sheet per FR-012a

**Changes**:
- MobileNav component (`frontend/components/layout/MobileNav.tsx`):
  - Add "Account" navigation item to bottom nav
  - Implement bottom sheet (drawer sliding from bottom) with shadcn/ui Sheet component
  - Sheet contains: Profile, Settings (hidden), Sign Out
  - Sign Out triggers auth.api.signOut() and redirects to /login

**Files**:
- `frontend/components/layout/MobileNav.tsx`

**Success Criteria**:
- Account menu item visible in mobile bottom nav
- Tapping opens bottom sheet from bottom
- Sign Out button functional in mobile view
- Settings option hidden (FR-013a compliance)
- Native mobile pattern (drawer, not dropdown)

---

### Step 3.2: Mobile Layout Padding
**Agent**: Use **ui-structure-architect** for responsive layout

**Objective**: Add bottom padding to clear mobile nav per FR-012b

**Changes**:
- Dashboard layout (`frontend/app/dashboard/layout.tsx`):
  - Add `pb-28 md:pb-0` to main content wrapper (112px on mobile)
  - Add CSS custom property for safe-area-inset-bottom:
    ```css
    padding-bottom: max(7rem, env(safe-area-inset-bottom));
    ```
  - Ensure content scrolls without being obscured by bottom nav

**Files**:
- `frontend/app/dashboard/layout.tsx`
- `frontend/app/globals.css` (for safe-area CSS)

**Success Criteria**:
- Content clears bottom navigation on all mobile devices
- Safe area support for notched devices (iPhone X+)
- No content hidden behind bottom nav
- Smooth scrolling experience

---

### Step 3.3: Responsive Input Fields
**Agent**: Use **ui-interaction-designer** for form responsiveness

**Objective**: Full-width inputs on mobile, appropriate sizing on desktop

**Changes**:
- TaskForm and TaskModal components:
  - Input fields: `w-full` on all breakpoints
  - Form layout: `flex flex-col space-y-4` for vertical stacking
  - Buttons: Full-width on mobile (`w-full md:w-auto`)
  - Proper touch targets (48px minimum height)

**Files**:
- `frontend/components/dashboard/TaskForm.tsx`
- `frontend/components/dashboard/TaskModal.tsx`

**Success Criteria**:
- Inputs span full width on mobile
- Buttons full-width on mobile, auto-width on desktop
- Easy to interact with on small screens
- Consistent spacing between fields

---

### Step 3.4: Sidebar Toggle Fix (Desktop)
**Agent**: Use **ui-interaction-designer** for sidebar interaction

**Objective**: Fix sidebar toggle to be bidirectional per FR-013 clarification

**Changes**:
- Sidebar component (`frontend/components/layout/Sidebar.tsx`):
  - Ensure toggle button works both ways (collapse AND expand)
  - Icon changes based on state:
    - ChevronLeft when expanded (indicates "collapse this way")
    - ChevronRight when collapsed (indicates "expand this way")
  - Single button handles both actions (not two separate buttons)

**Files**:
- `frontend/components/layout/Sidebar.tsx`

**Success Criteria**:
- Single toggle button collapses and expands sidebar
- Icon reflects current state and action
- Smooth animation between states
- Consistent behavior across sessions

---

### Step 3.5: Settings Button Visibility
**Agent**: Use **ui-structure-architect** for conditional rendering

**Objective**: Hide settings button until functionality implemented per FR-013a

**Changes**:
- Sidebar component:
  - Wrap settings button in conditional: `{isSettingsEnabled && <SettingsButton />}`
  - Set feature flag `isSettingsEnabled = false`
  - Preserve layout structure (don't collapse navigation)
- MobileNav component:
  - Similarly hide settings in mobile account sheet

**Files**:
- `frontend/components/layout/Sidebar.tsx`
- `frontend/components/layout/MobileNav.tsx`

**Success Criteria**:
- Settings button not visible in navigation
- Layout remains consistent (no gap/shift)
- Easy to unhide when functionality added (flip flag)
- Clean user experience without unimplemented features

---

## Phase 4: Quality Assurance & Validation

### Step 4.1: Visual Regression Testing
**Agent**: Manual testing / QA validation

**Objective**: Verify all spacing, colors, and typography match spec

**Validation Steps**:
1. Check dashboard layout padding (32-40px)
2. Check metrics grid gaps (20-24px)
3. Check task list spacing (16-20px)
4. Verify Clean Light Mode colors throughout
5. Test responsive typography on mobile and desktop
6. Validate all touch targets ≥48px on mobile

**Success Criteria**: All FR-008, FR-008a, FR-009b requirements met

---

### Step 4.2: Functional Testing
**Agent**: Manual testing / QA validation

**Objective**: Verify all task manager operations work correctly

**Validation Steps**:
1. Create task → appears instantly in list
2. Update task → changes reflect immediately
3. Mark complete → checkbox animates, UI updates
4. Delete task → removed from UI instantly
5. API error → friendly message with retry button
6. Test all operations on mobile and desktop

**Success Criteria**: All FR-005, FR-005a, FR-005b, FR-016 requirements met

---

### Step 4.3: Mobile Responsiveness Testing
**Agent**: Manual testing on physical devices

**Objective**: Verify mobile experience on real devices (320px-428px)

**Validation Steps**:
1. Test on iPhone SE (320px width) and iPhone 15 Pro (428px width)
2. Verify Account menu in bottom nav opens bottom sheet
3. Verify Sign Out button works from mobile nav
4. Check bottom padding clears navigation
5. Test safe area support on notched devices
6. Verify full-width inputs and buttons on mobile
7. Check responsive typography readability

**Success Criteria**: All FR-012, FR-012a, FR-012b requirements met

---

## Implementation Order

### Critical Path (Do First)
1. **Phase 1.4** - Color palette consistency (foundation for all styling)
2. **Phase 1.1** - Dashboard layout spacing (sets structure)
3. **Phase 1.2** - Metrics grid spacing
4. **Phase 1.3** - Task list spacing
5. **Phase 2.4** - State management fixes (enables functionality)
6. **Phase 2.5** - API integration verification

### High Priority (Do Next)
7. **Phase 3.1** - Mobile account menu (critical mobile UX)
8. **Phase 3.2** - Mobile layout padding
9. **Phase 2.1** - Controlled inputs with floating labels
10. **Phase 2.2** - Touch-friendly buttons

### Medium Priority (Do After)
11. **Phase 1.5** - Responsive typography
12. **Phase 2.3** - Inline validation
13. **Phase 3.3** - Responsive input fields
14. **Phase 3.4** - Sidebar toggle fix
15. **Phase 3.5** - Settings button visibility

### Final (Validate)
16. **Phase 4.1** - Visual regression testing
17. **Phase 4.2** - Functional testing
18. **Phase 4.3** - Mobile responsiveness testing

---

## UI/UX Agents & Skills Mapping

| Phase | Agent/Skill | Purpose |
|-------|-------------|---------|
| 1.1 | ui-structure-architect | Layout restructuring decisions |
| 1.2, 1.3 | ui-interaction-designer | Card and list layout, spacing |
| 1.4 | ui-ux-futuristic-designer | Color system validation |
| 1.5, 2.1, 2.2, 2.3, 3.1, 3.3, 3.4 | ui-interaction-designer | Form UX, mobile patterns, interactions |
| 2.4, 2.5 | general-purpose | State logic, API integration |
| 3.2, 3.5 | ui-structure-architect | Responsive layout, conditional rendering |
| 4.1, 4.2, 4.3 | Manual QA | Visual and functional validation |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | HIGH | Test all CRUD operations after state changes |
| Mobile safe area inconsistencies | MEDIUM | Use CSS environment variables for dynamic insets |
| Color palette deviations | LOW | Audit all components systematically |
| Typography size clashes | MEDIUM | Use consistent responsive classes (text-sm md:text-base) |
| Touch target too small | HIGH | Enforce min-h-[48px] for all interactive elements |

---

## Success Metrics

**UI Improvements**:
- ✅ All spacing values match FR-008a requirements
- ✅ Clean Light Mode palette applied consistently (FR-007)
- ✅ Responsive typography implemented (FR-009b)

**Task Manager Functionality**:
- ✅ Optimistic updates <100ms (SC-002)
- ✅ Floating labels with focus states (FR-005b)
- ✅ Touch-friendly buttons ≥48px (FR-005b)
- ✅ Inline validation with friendly errors (FR-016)

**Mobile Responsiveness**:
- ✅ Account menu accessible in mobile nav (FR-012a)
- ✅ Sign Out visible and functional on mobile
- ✅ Content clears bottom nav with safe area support (FR-012b)
- ✅ Full-width inputs and buttons on mobile
- ✅ Sidebar toggle bidirectional on desktop (FR-013)

---

## Next Steps

1. **Review this plan** with user for approval
2. **Execute phases in order** using specified agents/skills
3. **Create PHR** for plan session
4. **Test after each phase** to validate changes
5. **Final QA** with Phase 4 validation steps

**Note**: This is a fix plan, not a full feature implementation. Focus is on correcting existing issues per spec clarifications, not adding new features.
