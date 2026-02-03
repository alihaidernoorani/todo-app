# TaskFlow Dashboard Quickstart

**Feature**: 004-modern-ui-ux-dashboard
**Date**: 2026-01-25 | **Revised**: 2026-02-02
**Quick Setup**: Get the professional dashboard running in <5 minutes
**Design System**: Clean Light Mode (white/slate backgrounds, blue accents)

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 20+** installed (`node --version`)
- ✅ **Backend running** at `http://localhost:8000` (see [backend README](../../../backend/README.md))
- ✅ **Better Auth configured** with shared `BETTER_AUTH_SECRET` between frontend and backend
- ✅ **Neon PostgreSQL** database populated with user and task tables
- ✅ **Test user account** created in the database (for authentication)

---

## Quick Start (5 Steps)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

**Expected output**:
```
added 284 packages, and audited 285 packages in 12s
```

---

### 2. Configure Environment Variables

Create `frontend/.env.local` with the following:

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
BETTER_AUTH_SECRET=<copy-from-backend-.env>
BETTER_AUTH_URL=http://localhost:3000

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
```

**⚠️ Important**: `BETTER_AUTH_SECRET` MUST match the value in `backend/.env` exactly.

**Where to find backend secret**:
```bash
grep BETTER_AUTH_SECRET ../backend/.env
```

---

### 3. Run Development Server

```bash
npm run dev
```

**Expected output**:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Ready in 1.2s
```

Visit **http://localhost:3000** in your browser.

---

### 4. Test Authentication

1. Navigate to **http://localhost:3000** (automatically redirects to `/login`)
2. Enter test credentials:
   - Email: `user@example.com` (or your test user)
   - Password: `password123` (or your test password)
3. Click **Sign In**
4. **On success**: Redirect to `/(dashboard)` with JWT stored in HttpOnly cookie
5. **On failure**: Check console for error messages
6. **New user?**: Click "Sign up" link to navigate to `/signup`

**Verify authentication**:
- Open DevTools → Application → Cookies → `http://localhost:3000`
- Should see `auth-token` cookie with `HttpOnly` and `Secure` flags

---

### 5. Test Dashboard Features

#### A. View Task Metrics
- Dashboard loads with 4 metric cards:
  - **Total Tasks**
  - **Completed**
  - **Pending**
  - **Overdue**
- Metrics update automatically from backend

#### B. Create a Task (Optimistic Update)
1. Click **New Task** button
2. Fill in:
   - Title: `Test optimistic update`
   - Description: `This should appear instantly`
   - Priority: `High`
3. Click **Create**
4. **Observe**: Task appears in list within <100ms (before server confirmation)
5. **Check**: Task persists after page refresh (confirmed by server)

#### C. Toggle Task Completion
1. Click checkbox next to any task
2. **Observe**: Checkbox animates with spring physics immediately
3. **Observe**: Task moves to "Completed" section (or vice versa)
4. **Check**: Page refresh shows persisted state

#### D. Edit and Delete
1. Hover over a task → Click **Edit** button (pencil icon)
2. Modify title or description → Click **Save**
3. **Observe**: Inline update without page reload
4. Click **Delete** button (trash icon) → Confirm
5. **Observe**: Task fades out with animation

---

## Architecture Overview

### File Structure

```text
frontend/
├── src/
│   ├── app/                     # Next.js 16 App Router
│   │   ├── login/               # Public login page
│   │   ├── signup/              # Public signup page
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── layout.tsx           # Root layout (fonts, providers)
│   │   └── globals.css          # Tailwind + Clean Light Mode tokens
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── auth/                # LoginForm, SignupForm, AuthGuard
│   │   ├── layout/              # Sidebar, Topbar (TaskFlow branding), MobileNav
│   │   ├── dashboard/           # MetricsGrid, TaskStream, TaskForm
│   │   └── atoms/               # ShimmerSkeleton, PrimaryButton, AnimatedCheckbox
│   │
│   └── lib/                     # Utilities and business logic
│       ├── api/                 # ApiClient, task methods, types
│       ├── auth/                # Better Auth client, Server Action (getUserId), useSession
│       ├── hooks/               # useOptimistic, useDraftRecovery
│       └── utils/               # Helper functions
│
├── public/                      # Static assets (fonts, images)
├── tests/                       # Vitest + React Testing Library
├── .env.local                   # Environment variables (gitignored)
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Clean Light Mode design tokens
└── package.json                 # Dependencies
```

### Technology Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **UI Library**: React 19 (with `useOptimistic` hook)
- **Styling**: Tailwind CSS v4 + shadcn/ui primitives
- **Animations**: Framer Motion (spring physics for checkboxes and lists)
- **Authentication**: Better Auth client SDK (JWT in HttpOnly cookies)
- **Icons**: Lucide React (lightweight, customizable)
- **Fonts**: Inter (UI/data) + Playfair Display (headers)
- **Testing**: Vitest + React Testing Library + Playwright (E2E)

### Design System: Clean Light Mode

**Color Palette**:
```typescript
// tailwind.config.ts
{
  colors: {
    // Backgrounds
    white: '#ffffff',        // Main content areas, cards
    slate: {
      50: '#f8fafc',         // Sidebar, page background
      100: '#f1f5f9',        // Hover states, input backgrounds
      200: '#e2e8f0',        // Borders
      300: '#cbd5e1',        // Input borders
      400: '#94a3b8',        // Muted text, placeholders
      600: '#475569',        // Secondary text
      900: '#0f172a',        // Primary text
    },
    blue: {
      50: '#eff6ff',         // Selected items, highlights
      500: '#3b82f6',        // Focus rings
      600: '#2563eb',        // Primary accent (CTAs, buttons)
      700: '#1d4ed8',        // Hover states
    }
  }
}
```

**Card Styling**:
```css
.card {
  background: white;
  border: 1px solid #e2e8f0;  /* slate-200 */
  border-radius: 0.5rem;      /* rounded-lg */
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);  /* shadow-sm */
}
```

**Typography**:
- **Headers**: Playfair Display (serif, elegant) - "My Tasks", page titles
- **Body/UI**: Inter (sans-serif, highly readable) - all other text

---

## Testing the Dashboard

### Manual Testing Checklist

#### Authentication Flow
- [ ] Unauthenticated access to `/(dashboard)` redirects to `/login`
- [ ] Login with valid credentials redirects to `/(dashboard)`
- [ ] Login with invalid credentials shows inline error message
- [ ] New user signup at `/signup` creates account and redirects to `/(dashboard)`
- [ ] JWT stored in HttpOnly cookie (check DevTools → Cookies)
- [ ] JWT NOT accessible via `document.cookie` in console (security check)
- [ ] Sign-out clears cookie and redirects to `/login`

#### Dashboard Loading
- [ ] Metrics cards show shimmer skeletons during load
- [ ] Metrics populate with correct counts ("Total Tasks", "Completed", etc.)
- [ ] Task list shows shimmer skeletons during load
- [ ] Task list populates with user's tasks
- [ ] Empty state shows: "No tasks yet. Create your first task to get started."
- [ ] Page title shows "My Tasks" (Playfair Display font)

#### Optimistic Updates
- [ ] Create task: Appears immediately (<100ms perceived latency)
- [ ] Toggle complete: Checkbox animates instantly
- [ ] Edit task: Updates appear immediately
- [ ] Delete task: Fades out immediately
- [ ] Network failure: Inline error shows with "Retry" button

#### Visual Design (Clean Light Mode)
- [ ] White/slate background palette applied (`bg-white`, `bg-slate-50`)
- [ ] Blue accent color on buttons and interactive elements (`blue-600`)
- [ ] Clean card styling with subtle shadows (`shadow-sm`)
- [ ] Smooth animations (staggered list, spring checkboxes)
- [ ] Responsive layout (desktop sidebar, mobile bottom nav)
- [ ] Zero layout shift during load (CLS = 0px)
- [ ] "TaskFlow" branding visible in sidebar

#### Session Expiry & Draft Recovery
- [ ] Clear cookies → Navigate to protected route → Redirect to `/login`
- [ ] Start creating task → Clear cookies → Draft saved to localStorage
- [ ] Login again → "Restore unsaved work?" modal appears
- [ ] Click "Restore" → Form pre-filled with draft
- [ ] Click "Discard" → Draft deleted, form empty

---

## Development Commands

```bash
# Start dev server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (watch mode)
npm run test

# Run tests (CI mode)
npm run test:ci

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm run start

# Clean build artifacts
npm run clean
```

---

## Troubleshooting

### Issue: "auth-token cookie not set after login"

**Symptoms**:
- Login succeeds but redirects back to login page
- No `auth-token` cookie in DevTools

**Solution**:
1. Verify `BETTER_AUTH_SECRET` matches between frontend and backend
2. Check backend logs for JWT generation errors
3. Ensure Better Auth middleware is configured in `frontend/src/app/api/auth/[...better-auth]/route.ts`

---

### Issue: "Network request failed" when creating tasks

**Symptoms**:
- Tasks don't appear after creation
- Console shows `Failed to fetch` error

**Solution**:
1. Verify backend is running at `http://localhost:8000`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Ensure CORS configured in backend to allow `http://localhost:3000`
4. Check backend logs for 500 errors

---

### Issue: "User ID mismatch" (403 Forbidden)

**Symptoms**:
- API requests return 403 errors
- Backend logs show "User ID mismatch"

**Solution**:
1. Verify JWT `user_id` claim matches path parameter in API requests
2. Check `getUserId()` Server Action returns correct user ID
3. Ensure JWT not expired (check `exp` claim)
4. Verify ApiClient is initialized before making requests

---

### Issue: Styling not applying correctly

**Symptoms**:
- Components missing expected styling (borders, shadows, colors)
- Console shows Tailwind class warnings

**Solution**:
- Verify Tailwind config includes all required color tokens (slate, blue)
- Check `globals.css` imports Tailwind layers correctly
- Clear Next.js cache: `rm -rf .next && npm run dev`

---

### Issue: Layout shift during loading

**Symptoms**:
- Page jumps as content loads
- Poor Lighthouse CLS score

**Solution**:
1. Ensure skeleton loaders match final content dimensions
2. Use fixed heights for metric cards (e.g., `h-32`)
3. Reserve space for task list with `min-h-[400px]`
4. Avoid dynamic `height: auto` during streaming

---

## Performance Benchmarks

Run Lighthouse audit to verify performance goals:

```bash
npm run lighthouse
```

**Expected Scores**:
- **Performance**: 90+ (First Contentful Paint < 1.5s)
- **Accessibility**: 95+ (ARIA labels, semantic HTML)
- **Best Practices**: 100 (HTTPS, no console errors)
- **SEO**: 90+ (meta tags, structured data)

**Custom Metrics**:
- **CLS (Cumulative Layout Shift)**: 0px (zero tolerance for layout shifts)
- **Optimistic Update Latency**: <100ms (measured with Chrome DevTools Performance tab)
- **Sign-in to Dashboard**: <5s (measured from credential submit to dashboard render)

---

## Next Steps

After verifying the dashboard works:

1. **Customize Design Tokens**: Edit `tailwind.config.ts` to adjust colors, fonts, spacing
2. **Add More Features**: Implement task filtering, sorting, search
3. **Write Tests**: Add component tests for TaskStream, MetricsGrid
4. **Deploy to Production**: Configure environment variables for production API URL
5. **Enable Analytics**: Track user interactions with Vercel Analytics or similar

---

## Additional Resources

- **Next.js 16 Docs**: https://nextjs.org/docs
- **React 19 useOptimistic**: https://react.dev/reference/react/useOptimistic
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Better Auth Docs**: https://better-auth.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion

---

## Support

**Issues?** Check:
1. Backend logs (`cd backend && tail -f logs/app.log`)
2. Frontend console (DevTools → Console)
3. Network tab (DevTools → Network → Filter by "Fetch/XHR")

**Still stuck?** Review:
- [plan.md](./plan.md) - Implementation architecture
- [data-model.md](./data-model.md) - Component hierarchy and state management
- [contracts/better-auth-flow.md](./contracts/better-auth-flow.md) - Authentication details
