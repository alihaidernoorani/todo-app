# API Contract: Social Login Endpoints

**Feature**: 003-auth-security (social login extension)
**Branch**: `012-oauth-social-login`
**Date**: 2026-04-26
**Related spec**: `spec.md` § FR-018 – FR-028

---

## Overview

Social login endpoints are handled by Better Auth via the existing catch-all route
`/api/auth/[...all]`. No new route files are required. The contracts below document
the implicit HTTP interface that Better Auth exposes once social providers are configured.

---

## Endpoint 1: Initiate Google OAuth

Better Auth registers this internally when `socialProviders.google` is configured.

```
GET /api/auth/signin/google
```

**Triggered by**: `authClient.signIn.social({ provider: "google", callbackURL })` — the client
SDK calls this URL internally, not the application code.

**Response**: HTTP 302 redirect to Google's OAuth authorization URL with:
- `response_type=code`
- `client_id=${GOOGLE_CLIENT_ID}`
- `redirect_uri=${BETTER_AUTH_URL}/api/auth/callback/google`
- `scope=openid email profile`
- `state=${csrf_state}` (CSRF protection, managed by Better Auth)

---

## Endpoint 2: Google OAuth Callback

```
GET /api/auth/callback/google?code={code}&state={state}
```

**Called by**: Google's authorization server after user consent.

**Success flow**:
1. Better Auth validates `state` against stored CSRF token (FR-025)
2. Exchanges `code` for Google access token
3. Fetches user profile (`email`, `name`, `picture`) from Google API
4. Creates or links user account (FR-023, FR-024)
5. Sets Better Auth session cookie
6. Redirects to `callbackURL` passed in step 1

**Success response**: HTTP 302 to `callbackURL` (e.g., `/dashboard`)

**Error scenarios**:

| Condition | Better Auth Response |
|-----------|---------------------|
| `error=access_denied` in query (user denied consent) | HTTP 302 to `errorCallbackURL` |
| `state` mismatch (CSRF) | HTTP 400 Bad Request |
| Google token exchange failure | HTTP 302 to `errorCallbackURL` |
| Google does not return email | HTTP 302 to `errorCallbackURL` |
| Database failure creating user | HTTP 302 to `errorCallbackURL` |

---

## Endpoint 3: Initiate Facebook OAuth

```
GET /api/auth/signin/facebook
```

**Triggered by**: `authClient.signIn.social({ provider: "facebook", callbackURL })`

**Response**: HTTP 302 redirect to Facebook's dialog URL with:
- `response_type=code`
- `client_id=${FACEBOOK_CLIENT_ID}`
- `redirect_uri=${BETTER_AUTH_URL}/api/auth/callback/facebook`
- `scope=email,public_profile`
- `state=${csrf_state}`

---

## Endpoint 4: Facebook OAuth Callback

```
GET /api/auth/callback/facebook?code={code}&state={state}
```

**Called by**: Facebook's authorization server after user consent.

**Success flow**: Same as Google callback (steps 1–5 above).

**Error scenarios**:

| Condition | Better Auth Response |
|-----------|---------------------|
| `error=access_denied` (user cancelled) | HTTP 302 to `errorCallbackURL` |
| `state` mismatch | HTTP 400 Bad Request |
| Facebook does not return email | HTTP 302 to `errorCallbackURL` |
| Facebook token exchange failure | HTTP 302 to `errorCallbackURL` |
| Database failure creating user | HTTP 302 to `errorCallbackURL` |

---

## Client-Side Call Contract

The social login is initiated from the browser via the Better Auth client SDK.
This is the only application-code API surface for social login.

### Trigger Social Login

```typescript
// In SocialLoginButtons.tsx
import { authClient } from '@/lib/auth/better-auth-client'

async function handleSocialLogin(provider: 'google' | 'facebook') {
  await authClient.signIn.social({
    provider,
    callbackURL: '/dashboard',
    errorCallbackURL: `/login?error=${provider}_failed`,
  })
  // Note: this call redirects the browser — code after this line does not execute
}
```

### Error Query Parameters on Callback

When `errorCallbackURL` is used, Better Auth may append error details:

| Query Param | Values | Description |
|-------------|--------|-------------|
| `error` | `access_denied`, `server_error`, `no_email` | OAuth error code |

Application code should parse these in `SignInForm` via `useSearchParams`.

---

## Database Contract: `account` Table

Better Auth manages this table. Listed here for reference only — application code
does NOT read/write this table directly.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `varchar` | Primary key |
| `userId` | `varchar` | FK → `user.id` |
| `accountId` | `varchar` | Provider's user ID (e.g., Google sub) |
| `providerId` | `varchar` | `"google"` or `"facebook"` or `"credential"` |
| `accessToken` | `varchar?` | Provider access token (encrypted) |
| `refreshToken` | `varchar?` | Provider refresh token (encrypted) |
| `idToken` | `text?` | OIDC ID token from provider |
| `expiresAt` | `timestamp?` | Provider token expiry |
| `createdAt` | `timestamp` | Record creation time |
| `updatedAt` | `timestamp` | Last updated |

**Migration**: Run `npx @better-auth/cli migrate` to create/update this table.

---

## Environment Variables Contract

Variables that MUST be set before social login works:

| Variable | Description | Required For |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → APIs & Services → Credentials | Google login |
| `GOOGLE_CLIENT_SECRET` | Same source as above | Google login |
| `FACEBOOK_CLIENT_ID` | From Facebook Developer Portal → App Settings → Basic | Facebook login |
| `FACEBOOK_CLIENT_SECRET` | Same source as above | Facebook login |
| `BETTER_AUTH_URL` | Must match callback URI registered with providers | Both |

**Callback URIs to register with providers**:
- Google Cloud Console: `${BETTER_AUTH_URL}/api/auth/callback/google`
- Facebook Developer Portal: `${BETTER_AUTH_URL}/api/auth/callback/facebook`
- Local dev (Google): `http://localhost:3000/api/auth/callback/google`
- Local dev (Facebook): Requires HTTPS — use ngrok or test users
