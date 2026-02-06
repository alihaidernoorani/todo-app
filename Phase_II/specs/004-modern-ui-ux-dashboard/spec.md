# Feature Specification: Modern UI/UX Dashboard

**Feature Branch**: `004-modern-ui-ux-dashboard`
**Created**: 2026-01-25
**Status**: Draft
**Input**: User description: "Modern UI/UX Specification for Phase 2 Dashboard - Target audience: Senior Frontend Engineers and UI Designers - Focus: High-performance, luxury-grade Next.js 16+ Dashboard with Better Auth"

## Clarifications

### Session 2026-01-25

- Q: Where should JWT tokens be stored on the client side? → A: HttpOnly cookies
- Q: How should optimistic update failures be displayed to the user? → A: Inline error below affected item with retry action
- Q: What priority levels should tasks support? → A: High, Medium, Low
- Q: Should the system attempt to preserve unsaved work when a session expires? → A: Save draft to localStorage before redirect
- Q: How should the system handle simultaneous edits to the same task from multiple devices? → A: Last write wins with visual indicator

### Session 2026-02-02

- Q: What are the public authentication routes? → A: /login and /signup are the only public authentication routes; legacy (auth)/sign-in routes are deprecated and will redirect to /login
- Q: How should JWT user_id be accessed by client-side JavaScript? → A: Client-side JavaScript must never directly decode JWT payload; user_id is obtained via Next.js Server Action that reads the HttpOnly cookie server-side
- Q: Should client construct API paths containing user_id? → A: Yes, frontend constructs `/api/{user_id}/tasks` paths using user_id obtained from Server Action (not by client-side JWT decoding); backend requires path-based user context
- Q: What is the canonical design system name? → A: Clean Light Mode (all other names deprecated)
- Q: What is the canonical button component name? → A: PrimaryButton

### Session 2026-02-06

- Q: Should the sidebar collapse button act as a toggle (collapse/expand)? → A: Toggle button - single button that collapses and expands (icon changes state)
- Q: Should the settings button be removed completely or hidden until settings are implemented? → A: Hide until implemented - use CSS/conditional render to hide
- Q: What should the browser tab title and auth window title be instead of "Command Center"? → A: TaskFlow
- Q: Should the Add Task button open a modal form or directly create a task from an input field? → A: Modal form - clicking Add Task opens a modal with full form fields
- Q: Should user-facing errors show a friendly message instead of generic server errors? → A: User-friendly messages - translate technical errors to clear explanations

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated Dashboard Access (Priority: P1)

As a registered user, I need to securely sign in and access my personal dashboard to view and manage my tasks.

**Why this priority**: Authentication is foundational - without secure user access, no other dashboard functionality is viable. This establishes the security perimeter and enables all subsequent user interactions.

**Independent Test**: Can be fully tested by creating an account, signing in via /login, and verifying the user sees their personalized dashboard with a welcome message. Delivers immediate value by providing secure access to user-specific content.

**Acceptance Scenarios**:

1. **Given** I am a new user, **When** I navigate to the dashboard URL, **Then** I am redirected to the /login page
2. **Given** I am on the /login page with valid credentials, **When** I submit the login form, **Then** I am redirected to my personalized dashboard
3. **Given** I am authenticated, **When** I navigate to protected routes, **Then** my JWT token is automatically included in all API requests
4. **Given** my session expires, **When** I attempt to access protected content, **Then** I am securely redirected to /login without data exposure
5. **Given** I am signed in on one device, **When** I sign in on another device, **Then** both sessions remain valid independently
6. **Given** I am actively creating a task, **When** my session expires, **Then** my unsaved work is saved to localStorage as a draft, I am redirected to /login, and after re-authenticating I see a prompt to restore my draft

---

### User Story 2 - Real-Time Task Overview (Priority: P1)

As a user viewing my dashboard, I need to see key task metrics at a glance so I can quickly understand my workload and priorities.

**Why this priority**: The metrics overview is the primary value proposition of the dashboard - it provides immediate situational awareness and enables users to make informed decisions about their work.

**Independent Test**: Can be fully tested by signing in and verifying that the top dashboard cards display accurate task counts, completion rates, and priority breakdowns with visual styling intact. Delivers value by transforming raw task data into actionable insights.

**Acceptance Scenarios**:

1. **Given** I have tasks in the system, **When** I view the dashboard, **Then** I see cards displaying total tasks, completed tasks, pending tasks, and overdue tasks with large, readable numbers
2. **Given** task data is loading, **When** the dashboard renders, **Then** I see shimmer skeleton loaders maintaining the card layout structure
3. **Given** I have no tasks, **When** I view the dashboard, **Then** I see an empty state with a prompt to create my first task
4. **Given** I am viewing the dashboard on mobile, **When** the page loads, **Then** the metric cards stack vertically and remain fully readable

---

### User Story 3 - Instant Task Interaction (Priority: P1)

As a user managing tasks, I need to create, update, and complete tasks with immediate visual feedback so I can work efficiently without waiting for server confirmations.

**Why this priority**: Optimistic updates are critical for the "luxury-grade" user experience - they eliminate perceived latency and create a responsive, native-app-like feel that differentiates this dashboard from competitors.

**Independent Test**: Can be fully tested by creating a new task and verifying it appears immediately in the list before server confirmation, then toggling task completion and seeing instant UI updates. Delivers value by making the interface feel instantaneous and highly responsive.

**Acceptance Scenarios**:

1. **Given** I am viewing my task list, **When** I click the Add Task button, **Then** a modal form opens with fields for title, description, priority, and due date; submitting the form creates the task and it appears immediately in the list with a pending indicator before server confirmation
2. **Given** I toggle a task as complete, **When** I click the checkbox, **Then** the task updates visually with a smooth animation before the API call completes
3. **Given** a task creation fails on the server, **When** the error is received, **Then** the optimistically added task is rolled back and an inline error message appears below the task input with a retry button
4. **Given** I am creating multiple tasks rapidly, **When** I submit them in quick succession, **Then** each appears instantly without blocking on previous requests
5. **Given** I am editing a task on one device, **When** the same task is updated from another device, **Then** I see a visual indicator showing the task was updated elsewhere and my view refreshes with the latest data

---

### User Story 4 - Refined Visual Experience (Priority: P2)

As a user interacting with the dashboard, I expect a modern, sophisticated visual design that feels polished and premium.

**Why this priority**: The visual design creates the first impression and ongoing emotional connection with the product. While not blocking functionality, it significantly impacts user satisfaction and perceived quality.

**Independent Test**: Can be fully tested by loading the dashboard on multiple screen sizes and verifying the Clean Light Mode color palette, subtle glassmorphism effects, typography hierarchy, and smooth transitions render correctly. Delivers value by creating a distinctive, memorable user experience.

**Acceptance Scenarios**:

1. **Given** I am viewing the dashboard, **When** the page loads, **Then** I see clean white backgrounds (#ffffff) with slate secondary colors (#f8fafc) and blue accent highlights (#2563eb)
2. **Given** I hover over interactive elements, **When** my cursor enters a card or button, **Then** I see subtle glassmorphism effects with backdrop blur and translucent borders
3. **Given** I am reading content, **When** I view headings and body text, **Then** page titles use a serif font (Playfair Display) and data uses Inter for clarity
4. **Given** I interact with the task list, **When** items appear or update, **Then** I see staggered animations with spring physics providing a sense of polish
5. **Given** I am on mobile, **When** I navigate between views, **Then** view transitions are smooth and maintain visual continuity

---

### User Story 5 - Mobile-First Navigation (Priority: P2)

As a mobile user, I need intuitive navigation that is accessible and doesn't obstruct my view of content.

**Why this priority**: Mobile users represent a significant portion of task management usage. Proper mobile navigation is essential for accessibility and usability, though it builds on the foundation of working functionality.

**Independent Test**: Can be fully tested by accessing the dashboard on a mobile device and verifying the bottom navigation bar is sticky, accessible, and allows seamless switching between dashboard sections. Delivers value by making the dashboard fully functional on mobile devices.

**Acceptance Scenarios**:

1. **Given** I am on mobile, **When** I scroll the dashboard, **Then** the bottom navigation bar remains fixed and accessible
2. **Given** I am on mobile, **When** I tap a navigation item, **Then** the view transitions smoothly without page refresh
3. **Given** I am on desktop, **When** I view the dashboard, **Then** I see a collapsible glass sidebar with Clean Light Mode styling instead of bottom navigation
4. **Given** the sidebar is collapsed on desktop, **When** I click the toggle button, **Then** it expands smoothly with animation; when expanded, clicking the same toggle button collapses it again (icon updates to reflect current state)

---

### User Story 6 - User-Scoped Data Access (Priority: P1)

As a user accessing my tasks through the API, I need all requests to be automatically scoped to my user ID so I only see and modify my own data.

**Why this priority**: Data scoping is a critical security requirement - without proper user isolation, the system would leak data between users and violate fundamental security principles.

**Independent Test**: Can be fully tested by signing in as two different users and verifying that each user only sees their own tasks and cannot access another user's data through API manipulation. Delivers value by ensuring data privacy and security.

**Acceptance Scenarios**:

1. **Given** I am authenticated as User A, **When** API requests are made, **Then** all endpoints automatically scope to my user ID server-side using JWT token validation
2. **Given** I attempt to access another user's data by manipulating the URL, **When** the request reaches the server, **Then** I receive a 403 Forbidden error
3. **Given** my JWT token contains my user ID, **When** the API client makes requests, **Then** the client obtains user_id via Server Action, constructs `/api/{user_id}/tasks` path, and server validates JWT matches path user_id
4. **Given** I am signed out, **When** the API client attempts a request, **Then** the request fails gracefully at the authentication layer

---

### Edge Cases

- When a user's session expires while actively working: System saves unsaved work to localStorage, clears tokens, redirects to /login, and restores draft after re-authentication
- When the settings button is hidden: Navigation layout remains consistent with placeholder space reserved for future settings implementation
- When network failures occur during optimistic task updates: System displays user-friendly message "Unable to save your task. Check your connection and try again." with retry button, rolling back the optimistic update
- What happens when a user navigates directly to a protected route without being authenticated?
- How does the dashboard behave when task data exceeds expected volumes (e.g., 1000+ tasks)?
- What happens when Better Auth service is temporarily unavailable?
- When concurrent edits occur from multiple devices: Last write wins, and a visual indicator notifies the user that the task was updated elsewhere
- What happens when glassmorphism effects fail to render on older browsers?
- How does the shimmer skeleton loader behave when data loads instantly (cache hit)?
- What happens when a user has zero tasks on mobile with the bottom navigation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users using Better Auth client SDK with stateless JWT-based sessions
- **FR-001a**: System MUST store JWT tokens in HttpOnly cookies to prevent XSS-based token theft
- **FR-002**: System MUST provide a central ApiClient utility that handles centralized fetch logic, credentials inclusion, error handling, 401 redirects, and user_id path interpolation; ApiClient obtains user_id via Server Action (never by client-side JWT decoding)
- **FR-003**: System MUST construct API paths with user_id (e.g., `/api/{user_id}/tasks`) as required by backend; user_id is obtained exclusively via Next.js Server Action that reads HttpOnly cookie server-side; client-side JavaScript MUST NOT directly decode JWT payload
- **FR-004**: System MUST display task metrics in top-row dashboard cards showing total tasks, completed tasks, pending tasks, overdue tasks, and priority breakdowns (High, Medium, Low)
- **FR-004a**: System MUST allow users to assign priority levels (High, Medium, or Low) to tasks during creation and editing
- **FR-005**: System MUST implement optimistic UI updates for task creation, updates, and completion using React 19's useOptimistic hook
- **FR-005a**: System MUST display a modal form when the Add Task button is clicked, containing input fields for title, description, priority (High/Medium/Low), and due date
- **FR-006**: System MUST display shimmer skeleton loaders during initial data loading and streaming SSR
- **FR-007**: System MUST apply the Clean Light Mode color palette with clean white backgrounds (#ffffff) and slate secondary colors (#f8fafc) with blue accents (#2563eb)
- **FR-008**: System MUST use subtle glassmorphism styling with backdrop-blur, semi-transparent backgrounds (bg-slate-50/95), and 1px translucent borders (border-slate-200/80)
- **FR-009**: System MUST use Inter font for UI elements and data, and Playfair Display (or similar serif) for page headers
- **FR-009a**: System MUST set the browser tab title and authentication window title to "TaskFlow" across all pages
- **FR-010**: System MUST customize shadcn/ui primitives with increased border-radius (rounded-xl) and soft shadows (shadow-sm) using PrimaryButton as the canonical button component
- **FR-011**: System MUST implement staggered list animations and spring transitions using Framer Motion
- **FR-012**: System MUST provide sticky bottom navigation on mobile devices
- **FR-013**: System MUST provide a collapsible glass sidebar on desktop devices with a toggle button that collapses and expands the sidebar (icon changes state to indicate current action)
- **FR-013a**: System MUST conditionally hide the settings button in navigation until settings functionality is implemented (using CSS display or conditional rendering)
- **FR-014**: System MUST redirect unauthenticated users to the sign-in page when accessing protected routes
- **FR-015**: System MUST handle session expiration by saving any unsaved work to localStorage as a draft, clearing client-side tokens, and redirecting to sign-in
- **FR-015a**: System MUST restore draft work from localStorage after successful re-authentication and prompt the user to review or discard the draft
- **FR-016**: System MUST display user-friendly error messages when optimistic updates fail, translating technical server errors into clear explanations, rolling back UI changes, and showing inline error text below the affected item with a retry action button
- **FR-016a**: System MUST translate all technical server errors (500, 503, network failures, etc.) into user-friendly messages that explain what went wrong and suggest next steps
- **FR-017**: System MUST display an empty state with helpful messaging when a user has no tasks
- **FR-018**: System MUST prevent access to other users' data by validating JWT user ID against requested user ID in API paths
- **FR-019**: System MUST implement last-write-wins conflict resolution for concurrent edits to the same task from multiple devices
- **FR-019a**: System MUST display a visual indicator when a task has been updated by another device, informing the user that their view may be stale

### Key Entities

- **User**: Represents an authenticated individual with a unique ID, email, and display name. Users own tasks and have isolated data access.
- **Task**: Represents a user-created to-do item with title, description, completion status, priority level (High, Medium, or Low), due date, and timestamps. Each task belongs to exactly one user.
- **Task Metrics**: Represents aggregated task statistics for a user, including total count, completed count, pending count, overdue count, and counts by priority level (High, Medium, Low). Derived from Task entities.
- **Session**: Represents a stateless JWT-based authentication session containing user ID, expiration time, and authorization claims. Managed by Better Auth.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can sign in and access their dashboard in under 5 seconds from credential submission
- **SC-002**: Task creation appears in the UI within 100 milliseconds of user action (optimistic update)
- **SC-003**: Dashboard achieves 0px Cumulative Layout Shift (CLS) score during initial load and data streaming
- **SC-004**: 95% of authenticated API requests successfully include JWT authorization headers without manual intervention
- **SC-005**: Users cannot access another user's task data through URL manipulation or API calls (100% isolation)
- **SC-006**: Mobile navigation remains accessible within thumb reach on devices with screen sizes from 320px to 428px width
- **SC-007**: Dashboard supports 1000+ concurrent authenticated users without session conflicts or data leakage
- **SC-008**: Visual design renders correctly on modern browsers (Chrome, Firefox, Safari, Edge) released within the last 2 years
- **SC-009**: Task list streaming and skeleton loaders maintain visual structure consistency within 50ms of render start
- **SC-010**: 90% of users successfully complete primary task actions (create, update, complete) on first attempt without errors

## Assumptions

- Users will access the dashboard through modern browsers that support CSS backdrop-filter for glassmorphism effects and HttpOnly cookies
- Better Auth SDK will provide stable JWT token generation and validation without requiring custom cryptographic implementation
- Task data volume per user will typically remain under 5,000 tasks for optimal performance
- Users expect immediate visual feedback for actions, prioritizing perceived performance over strict server confirmation
- The application will be deployed in an environment supporting environment variables for BETTER_AUTH_SECRET
- Network latency for API requests will typically be under 500ms for the target user base
- JWT tokens stored in HttpOnly cookies will be automatically included in cross-origin requests when properly configured with CORS and SameSite attributes; client-side JavaScript obtains user_id via Server Action (server-side cookie read and JWT decode) but never directly accesses JWT payload

## Dependencies

- Better Auth client SDK and server-side integration for authentication
- Backend API endpoints supporting task CRUD operations at `/api/{user_id}/tasks` with path-based user context and JWT validation
- Tailwind CSS v4 configuration and build tooling
- Next.js 16 with App Router and React Server Components support
- shadcn/ui component library installed and configured
- Framer Motion library for animations
- Lucide icon library for metric card icons
- Backend database with user and task tables supporting relational queries
