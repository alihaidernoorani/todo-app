# Auth Testing Checklist

**Date**: 2026-02-03
**Purpose**: Manual testing guide for auth scoping and route protection

## Prerequisites

- [ ] Development server running (`npm run dev`)
- [ ] Backend API running (if testing full auth flow)
- [ ] Browser DevTools open (Network and Console tabs)
- [ ] Test user credentials available

---

## Test Suite 1: Logged Out User Access

### Test 1.1: Landing Page Access
- [ ] Open browser in incognito/private mode
- [ ] Navigate to `http://localhost:3000/`
- [ ] **Expected**: Landing page displays with hero section
- [ ] **Expected**: See "Get Started" and "Log In" CTA buttons
- [ ] **Expected**: See feature cards section
- [ ] **Expected**: No redirect occurs
- [ ] **Expected**: No console errors

**Pass Criteria**: Landing page displays without redirect or errors

---

### Test 1.2: Login Page Access
- [ ] While logged out, navigate to `http://localhost:3000/login`
- [ ] **Expected**: Login form displays
- [ ] **Expected**: See email and password input fields
- [ ] **Expected**: See "Sign In" button
- [ ] **Expected**: See "Sign up" link to /signup
- [ ] **Expected**: No redirect occurs
- [ ] **Expected**: No console errors

**Pass Criteria**: Login page displays without redirect

---

### Test 1.3: Signup Page Access
- [ ] While logged out, navigate to `http://localhost:3000/signup`
- [ ] **Expected**: Signup form displays
- [ ] **Expected**: See name, email, password, confirm password fields
- [ ] **Expected**: See "Sign Up" button
- [ ] **Expected**: See "Sign in" link to /login
- [ ] **Expected**: No redirect occurs
- [ ] **Expected**: No console errors

**Pass Criteria**: Signup page displays without redirect

---

### Test 1.4: Dashboard Access (Protected)
- [ ] While logged out, navigate to `http://localhost:3000/dashboard`
- [ ] **Expected**: DashboardSkeleton displays briefly
- [ ] **Expected**: Automatic redirect to `/login`
- [ ] **Expected**: URL changes to `http://localhost:3000/login`
- [ ] **Expected**: Login form displays after redirect
- [ ] **Expected**: No console errors

**Pass Criteria**: Redirects to /login when accessing protected route

---

## Test Suite 2: Logged In User Access

### Test 2.1: Login Flow
- [ ] Navigate to `/login`
- [ ] Enter valid test credentials
- [ ] Click "Sign In" button
- [ ] **Expected**: Button shows loading state (spinner)
- [ ] **Expected**: Redirect to `/dashboard` after successful login
- [ ] **Expected**: Dashboard displays with "My Tasks" header
- [ ] **Expected**: See Sidebar, Topbar, and metrics
- [ ] **Expected**: Session cookie set (check DevTools → Application → Cookies)

**Pass Criteria**: Successful login redirects to dashboard

---

### Test 2.2: Landing Page Access While Logged In
- [ ] While logged in, navigate to `http://localhost:3000/`
- [ ] **Expected**: Landing page still displays
- [ ] **Expected**: No automatic redirect to dashboard
- [ ] **Expected**: User can freely browse landing page
- [ ] **Expected**: Optional: "Go to Dashboard" CTA may appear (future enhancement)

**Pass Criteria**: Logged in users can access landing page

---

### Test 2.3: Dashboard Access While Logged In
- [ ] While logged in, navigate to `http://localhost:3000/dashboard`
- [ ] **Expected**: Dashboard displays immediately
- [ ] **Expected**: No redirect or loading delay
- [ ] **Expected**: See user-specific data (tasks, metrics)
- [ ] **Expected**: Sidebar, Topbar, and MobileNav visible
- [ ] **Expected**: No console errors

**Pass Criteria**: Dashboard accessible without redirect

---

### Test 2.4: Login Page Access While Logged In
- [ ] While logged in, navigate to `http://localhost:3000/login`
- [ ] **Expected**: Login form may display (or redirect to dashboard)
- [ ] **Expected**: Form logic should detect session and redirect
- [ ] **Note**: This behavior is handled by form component, not AuthGuard

**Pass Criteria**: Behavior is graceful (no errors)

---

## Test Suite 3: Session Expiry and Edge Cases

### Test 3.1: Session Expiry During Dashboard Use
- [ ] Log in and navigate to dashboard
- [ ] Open DevTools → Application → Cookies
- [ ] Delete session cookie manually
- [ ] Try to perform an action (e.g., create task)
- [ ] **Expected**: API returns 401 Unauthorized
- [ ] **Expected**: ApiClient intercepts 401 and redirects to /login
- [ ] **Expected**: Draft saved to localStorage (if applicable)

**Pass Criteria**: Expired session redirects to login with draft saved

---

### Test 3.2: Refresh Page on Protected Route
- [ ] Log in and navigate to `/dashboard`
- [ ] Press F5 or Cmd+R to refresh page
- [ ] **Expected**: DashboardSkeleton shows briefly
- [ ] **Expected**: Session is restored from cookie
- [ ] **Expected**: Dashboard displays without redirect
- [ ] **Expected**: No loss of session

**Pass Criteria**: Page refresh maintains session

---

### Test 3.3: Direct URL Navigation to Dashboard
- [ ] Log in
- [ ] Copy dashboard URL from address bar
- [ ] Open new tab (same browser, same session)
- [ ] Paste URL and navigate
- [ ] **Expected**: Dashboard displays immediately
- [ ] **Expected**: Session carries over to new tab

**Pass Criteria**: Session persists across tabs

---

### Test 3.4: Logout Flow
- [ ] While on dashboard, click user menu → "Sign Out"
- [ ] **Expected**: Session cookie cleared
- [ ] **Expected**: Redirect to `/login`
- [ ] **Expected**: Attempting to access `/dashboard` now redirects to login

**Pass Criteria**: Logout clears session and redirects

---

## Test Suite 4: Loading States and Skeleton

### Test 4.1: AuthGuard Loading State
- [ ] Clear browser cache and cookies
- [ ] Navigate to `/dashboard` (logged out)
- [ ] **Expected**: DashboardSkeleton displays briefly (< 1 second)
- [ ] **Expected**: Skeleton shows placeholder for sidebar, topbar, content
- [ ] **Expected**: No flash of dashboard content before redirect

**Pass Criteria**: Skeleton prevents content flash during auth check

---

### Test 4.2: Slow Network Simulation
- [ ] Open DevTools → Network tab
- [ ] Set throttling to "Slow 3G"
- [ ] Navigate to `/dashboard` while logged out
- [ ] **Expected**: DashboardSkeleton displays for longer duration
- [ ] **Expected**: Smooth transition to redirect (no janky UI)

**Pass Criteria**: Loading state handles slow networks gracefully

---

## Test Suite 5: Security Validation

### Test 5.1: HttpOnly Cookie Check
- [ ] Log in successfully
- [ ] Open DevTools → Application → Cookies
- [ ] Find session cookie (e.g., `better-auth.session_token`)
- [ ] **Expected**: Cookie has `HttpOnly` flag checked
- [ ] **Expected**: Cookie has `Secure` flag (if HTTPS)
- [ ] **Expected**: Cookie is not accessible via JavaScript (`document.cookie`)

**Pass Criteria**: Session cookie is HttpOnly and Secure

---

### Test 5.2: CSRF Protection
- [ ] Log in
- [ ] Open DevTools → Console
- [ ] Try to read session cookie: `console.log(document.cookie)`
- [ ] **Expected**: Session cookie NOT visible in output
- [ ] **Expected**: Only non-HttpOnly cookies visible

**Pass Criteria**: HttpOnly cookies protect against XSS

---

### Test 5.3: API Authorization Header
- [ ] Log in
- [ ] Open DevTools → Network tab
- [ ] Perform an action that triggers API call (e.g., fetch tasks)
- [ ] Click on the API request in Network tab
- [ ] Check "Request Headers" section
- [ ] **Expected**: See `Authorization: Bearer <token>` header
- [ ] **Expected**: Token is a valid JWT

**Pass Criteria**: API requests include Authorization header

---

## Test Suite 6: Mobile and Responsive

### Test 6.1: Mobile Landing Page
- [ ] Open DevTools → Toggle device toolbar (Cmd+Shift+M)
- [ ] Select "iPhone 12 Pro" or similar
- [ ] Navigate to `/`
- [ ] **Expected**: Landing page is responsive
- [ ] **Expected**: CTA buttons are tappable (not too small)
- [ ] **Expected**: Text is readable without zooming

**Pass Criteria**: Landing page is mobile-friendly

---

### Test 6.2: Mobile Dashboard Access
- [ ] In mobile view, log in
- [ ] Navigate to `/dashboard`
- [ ] **Expected**: MobileNav displays at bottom (sticky)
- [ ] **Expected**: Sidebar is hidden
- [ ] **Expected**: Content has bottom padding for MobileNav
- [ ] **Expected**: Topbar is hidden on mobile

**Pass Criteria**: Dashboard is mobile-friendly

---

## Bug Report Template

If any test fails, use this template:

```
### Bug: [Brief Description]

**Test Case**: [Test number, e.g., Test 1.4]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Browser**: [Chrome 120 / Firefox 121 / Safari 17]
**OS**: [Windows 11 / macOS 14 / Ubuntu 22.04]
**Console Errors**: [Paste any console errors]
**Network Tab**: [Paste any failed requests]

**Screenshots**: [Attach if applicable]
```

---

## Test Completion Sign-Off

- [ ] **All Test Suite 1 tests pass** (Logged Out User)
- [ ] **All Test Suite 2 tests pass** (Logged In User)
- [ ] **All Test Suite 3 tests pass** (Session and Edge Cases)
- [ ] **All Test Suite 4 tests pass** (Loading States)
- [ ] **All Test Suite 5 tests pass** (Security)
- [ ] **All Test Suite 6 tests pass** (Mobile)

**Tester Name**: ___________________________
**Date**: ___________________________
**Result**: ⬜ PASS | ⬜ FAIL (with bug reports)

---

## Notes

- Tests should be run in multiple browsers (Chrome, Firefox, Safari)
- Tests should be run on both desktop and mobile viewports
- Session behavior may vary based on Better Auth configuration
- Backend API must be running for full auth flow tests
