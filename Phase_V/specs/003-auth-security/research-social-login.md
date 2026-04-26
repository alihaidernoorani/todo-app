# Research: Social Login (Google & Facebook) via Better Auth v1

**Feature**: 003-auth-security (social login extension)
**Branch**: `012-oauth-social-login`
**Date**: 2026-04-26

---

## Decision 1: Better Auth Social Provider Configuration (Server)

**Decision**: Use `socialProviders` top-level key inside `betterAuth()` — no separate plugin required.

**Rationale**: Better Auth v1 (≥1.1) includes built-in `socialProviders` support. Social providers are NOT plugins; they are part of the core `betterAuth()` config object alongside `emailAndPassword`. Avoids adding unnecessary packages.

**Exact API**:
```typescript
import { betterAuth } from "better-auth"

const auth = betterAuth({
  // ... existing config
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    },
  },
})
```

**Alternatives considered**:
- NextAuth.js with Google/Facebook providers: Rejected — project is locked to Better Auth per constitution
- Separate OAuth library (passport-google-oauth2): Rejected — would duplicate session management that Better Auth already owns

---

## Decision 2: Better Auth Social Provider Client Configuration

**Decision**: `signIn.social()` is available on `createAuthClient` by default in Better Auth v1 — no extra client plugin needed. The existing `jwtClient()` plugin is preserved.

**Exact API**:
```typescript
import { createAuthClient } from "better-auth/react"

const authClient = createAuthClient({ baseURL: "..." })

// Trigger social login — redirects to provider, then to callbackURL
await authClient.signIn.social({
  provider: "google",        // or "facebook"
  callbackURL: "/dashboard", // where to land after successful OAuth
  errorCallbackURL: "/login?error=social_login_failed", // optional
})
```

**Alternatives considered**:
- Adding `socialProviderClient()` plugin: Not needed in v1.4+, built in
- Manual redirect to `/api/auth/signin/google`: Fragile, bypasses CSRF state protection

---

## Decision 3: OAuth Callback Route Handling

**Decision**: The existing `/api/auth/[...all]` catch-all route already handles OAuth callbacks. No new route file is needed.

**How it works**:
- Better Auth registers `/api/auth/callback/google` and `/api/auth/callback/facebook` as handlers internally
- The `toNextJsHandler(auth)` call in the catch-all route delegates to these handlers
- After the provider redirects back, Better Auth: (1) exchanges code for token, (2) fetches user profile, (3) creates or links account, (4) sets session cookies, (5) redirects to `callbackURL`

**Callback URL registered in providers must be**: `${BETTER_AUTH_URL}/api/auth/callback/google` and `${BETTER_AUTH_URL}/api/auth/callback/facebook`

---

## Decision 4: JWT Token Acquisition After Social Login

**Decision**: No special handling needed. The existing `useSession` hook already handles JWT acquisition for any authenticated session (email/password or social).

**Flow**:
1. OAuth completes → user lands on `/dashboard` with a Better Auth session cookie
2. `useSession` hook fires on mount → calls `authClient.getSession()`
3. Session found → calls `authClient.token()` → gets RS256 JWT from Better Auth JWT plugin
4. JWT stored in localStorage via `TokenStorage.setAccessToken()`
5. All API calls proceed using the JWT as Bearer token

**Why this works**: The JWT plugin is provider-agnostic — it issues tokens for any authenticated user regardless of how they signed in. Social login users get the same JWT structure as email/password users.

---

## Decision 5: Account Linking Strategy

**Decision**: Better Auth v1 uses email-based automatic account linking — if a social login email matches an existing account, the social provider is linked to that account. No custom code required.

**Behavior**:
- New email via social login → new user account created
- Existing email via social login → social provider linked to existing account, user signed in
- Same email from two different social providers → both linked to same account

**Configuration**: Default behavior, enabled out of the box. The `account` table stores provider links.

---

## Decision 6: Database Migration for Social Providers

**Decision**: Run `npx @better-auth/cli migrate` after adding social providers to create/update the `account` table that stores provider links.

**What changes**:
- Better Auth creates an `account` table with columns: `id`, `userId`, `accountId` (provider user ID), `providerId` (e.g., "google"), `accessToken`, `refreshToken`, `idToken`, `expiresAt`, `password`, `createdAt`, `updatedAt`
- This table may already exist (Better Auth creates it during initial migration for OAuth capabilities)
- Running migrate is idempotent — safe to re-run

**Command**: `cd frontend && npx @better-auth/cli migrate`

---

## Decision 7: Error Handling for OAuth Failures

**Decision**: Use `errorCallbackURL` in `signIn.social()` to redirect failed OAuth attempts back to login with a query parameter. Parse the error in `SignInForm` and display a user-friendly message.

**Error flow**:
```typescript
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
  errorCallbackURL: "/login?error=google_cancelled",
})
```

**In SignInForm**: Check `searchParams.get('error')` and display provider-specific messages:
- `google_cancelled` → "Google sign-in was cancelled."
- `facebook_cancelled` → "Facebook sign-in was cancelled."
- `social_login_failed` → "Social sign-in failed. Please try again or use email/password."

---

## Decision 8: Google OAuth App Registration Requirements

**Decision**: Register OAuth app in Google Cloud Console with these settings:
- Authorized redirect URI: `${BETTER_AUTH_URL}/api/auth/callback/google`
- Scopes required: `email`, `profile` (openid)
- For local dev: also add `http://localhost:3000/api/auth/callback/google`

---

## Decision 9: Facebook OAuth App Registration Requirements

**Decision**: Register OAuth app in Facebook Developer Portal with these settings:
- Valid OAuth Redirect URI: `${BETTER_AUTH_URL}/api/auth/callback/facebook`
- Required permissions: `email`, `public_profile`
- For local dev: Facebook requires HTTPS for callbacks — use `ngrok` or similar, OR use test users in Facebook app settings
- Facebook app must be in "Live" mode (not Development) for external users

**Local dev workaround**: Create test users in the Facebook Developer Portal and test with those accounts while the app is in Development mode.

---

## Decision 10: SocialLoginButtons Component Design

**Decision**: Create a shared `SocialLoginButtons` component used in both `SignInForm` and `SignupForm`. Renders two provider-branded buttons with loading/error states.

**Design**:
- Google button: white background, Google logo SVG, "Continue with Google" text, Google brand colors on border
- Facebook button: Facebook blue (`#1877F2`) background, Facebook logo SVG, "Continue with Facebook" text
- Divider: horizontal line with "or" text between email form and social buttons
- Loading state: spinner replaces logo while OAuth redirect is pending
- Error display: inline error message below social buttons

---

## Resolved Clarifications

All NEEDS CLARIFICATION items from the spec are resolved:
- Social provider config: `socialProviders` key in `betterAuth()` ✅
- Client-side trigger: `authClient.signIn.social()` built-in ✅
- Callback route: handled by existing `[...all]` catch-all ✅
- JWT after social login: existing `useSession` hook handles this automatically ✅
- Account linking: automatic by email in Better Auth v1 ✅
- Database: `npx @better-auth/cli migrate` needed ✅
