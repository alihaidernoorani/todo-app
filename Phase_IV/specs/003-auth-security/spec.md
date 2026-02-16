# Feature Specification: Authentication and Security

**Feature Branch**: `003-auth-security`
**Created**: 2026-01-25
**Status**: Draft
**Input**: User description: "Authentication and Security Specification

Target audience: Security architects and full-stack developers
Focus: Stateless JWT-based authentication using RS256 and JWKS for cross-domain deployment (Vercel frontend, HuggingFace backend)

Success criteria:
- Backend verifies JWT tokens using RS256 signature verification with JWKS public keys
- Frontend stores JWT tokens and sends them via Authorization: Bearer header
- Define a FastAPI dependency to extract and verify JWT tokens from Authorization headers
- Extract user ID from JWT `sub` claim
- Compare the user ID from the token against the '{user_id}' in the URL path
- Return 401 for invalid tokens and 403 if a user attempts to access another user's path
- 100% stateless backend with no session endpoint dependencies

Constraints:
- Backend performs local JWT verification using JWKS endpoint (no session API calls)
- No cookies or session state allowed (cross-domain deployment requirement)
- Tech stack: FastAPI + Better Auth JWT plugin with RS256
- Use environment variables for JWKS endpoint configuration

Not building:
- Login/Signup UI logic (handled by Better Auth frontend)
- MFA or password reset flows
- Session cookie management or `/api/auth/session` endpoint calls"

## Clarifications

### Session 2026-02-05

- Q: Should the spec define required environment variables and alignment between frontend and backend auth configuration? → A: Yes, define required environment variables and frontend-backend alignment (clear deployment requirements, prevents misconfiguration)

### Session 2026-02-07

- Q: Should route protection rely entirely on Better Auth sessions instead of custom JWT cookies? → A: Better Auth sessions (delegated) - This approach leverages Better Auth's built-in session management which is more reliable than custom JWT cookies, reducing complexity and potential redirect loops.
- Q: Should middleware use the `/api/auth/session` endpoint instead of reading cookies manually? → A: Use `/api/auth/session` endpoint (standard) - This follows Better Auth's established patterns and ensures consistency with the framework's session management, avoiding manual cookie parsing that might be causing the redirect loop.
- Q: Should custom `auth-token` logic be fully removed from the system? → A: Fully remove custom auth-token logic (clean) - This eliminates potential conflicts between custom and Better Auth's native session management, which is likely causing the redirect loop issue.
- Q: Should dashboard protection be handled via server-side session checks instead of middleware? → A: Server-side session checks (secure) - Handle authentication via server-side session validation in page components rather than relying on middleware that may be causing redirect loops.
- Q: What is the single source of truth for authentication state (Better Auth session vs custom token)? → A: Better Auth session as single source of truth (authoritative) - Establish Better Auth's native session management as the definitive source for authentication state, eliminating conflicts with custom implementations.
- Q: Should the backend perform custom JWT verification (RS256/JWKS) or delegate ALL session validation to Better Auth? → A: Backend delegates ALL session validation to Better Auth's `/api/auth/session` endpoint and removes ALL custom JWT parsing/verification logic
- Q: What authentication credentials does Better Auth use for session transport (session cookies, Bearer tokens, or both)? → A: Session cookies (automatic)
- Q: Is the Better Auth JWT plugin required for session-based authentication? → A: Remove JWT plugin requirement - not needed for session cookie validation
- Q: How should the backend forward cookies to Better Auth for session validation? → A: Make HTTP call to Better Auth session endpoint with cookies from original request
- Q: Should the backend return Better Auth error responses directly or map them to a standardized format? → A: Map Better Auth responses to standardized backend error format

### Session 2026-02-07 (Architectural Refactor)

- Q: Should the authentication architecture use session-cookies or stateless JWT tokens across different domains (Vercel frontend, HuggingFace backend)? → A: Complete architectural pivot - Replace ALL session-cookie logic with stateless JWT verification (RS256 + JWKS). Remove `/api/auth/session` dependency entirely.
- Q: Where should JWT tokens be stored on the frontend (memory vs localStorage)? → A: localStorage with secure flags
- Q: Which JWT claim should be used to extract user identity for authorization? → A: `sub` claim for user_id
- Q: How should the backend obtain public keys for JWT signature verification? → A: Better Auth JWKS endpoint - Backend fetches public keys from Better Auth's `/.well-known/jwks.json` endpoint. Keys are cached locally for performance.
- Q: How should the backend handle JWKS endpoint failures (unreachable, keys missing)? → A: Cached fallback with startup check - Fail startup if JWKS unavailable initially. During runtime, use cached keys if JWKS fetch fails. Log warnings and retry in background. Reject tokens only if cache expired AND fetch fails.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - JWT Token Validation (Priority: P1)

A client application (web/mobile) authenticates a user and receives a JWT token from Better Auth. The client stores the token in localStorage and includes it in the `Authorization: Bearer <token>` header when making API requests to the FastAPI backend. The backend validates the JWT signature using RS256 verification with JWKS public keys and grants access to protected resources.

**Why this priority**: This is the foundational authentication mechanism. Without it, no other user-specific functionality can work. It's the core security layer that protects all API endpoints. JWT-based authentication enables stateless cross-domain operation.

**Independent Test**: Can be fully tested by authenticating via Better Auth to obtain a JWT token, making an API request with the token in the Authorization header, and verifying successful access to a protected endpoint. Delivers immediate value by enabling secure stateless API access.

**Acceptance Scenarios**:

1. **Given** a valid JWT token in the Authorization header, **When** the client sends a request to a protected endpoint, **Then** the backend verifies the token signature using JWKS public keys and grants access with HTTP 200
2. **Given** an expired JWT token (`exp` claim in the past), **When** the client sends a request, **Then** the backend returns HTTP 401 Unauthorized with error message "Token expired"
3. **Given** a JWT token with invalid signature (tampered payload or signed with wrong key), **When** the client sends a request, **Then** the backend returns HTTP 401 Unauthorized with error message "Invalid token: signature verification failed"
4. **Given** no Authorization header, **When** the client sends a request to a protected endpoint, **Then** the backend returns HTTP 401 Unauthorized with error message "Missing authentication credentials"
5. **Given** a JWT token with wrong issuer (`iss` claim doesn't match Better Auth URL), **When** the client sends the request, **Then** the backend returns HTTP 401 Unauthorized with error message "Invalid token: untrusted issuer"

---

### User Story 2 - User Identity Scoping (Priority: P1)

Users can only access their own resources. When a user makes a request to an endpoint like `/users/{user_id}/tasks`, the backend verifies that the `user_id` from the JWT `sub` claim matches the `{user_id}` path parameter, preventing unauthorized access to other users' data.

**Why this priority**: This is a critical security requirement that prevents horizontal privilege escalation. Without it, authenticated users could access or modify other users' data, which is a severe security vulnerability.

**Independent Test**: Can be fully tested by creating two different users with valid JWT tokens, attempting to access each other's resources via path parameters, and verifying that cross-user access is blocked with HTTP 403. Delivers immediate security value by enforcing data isolation.

**Acceptance Scenarios**:

1. **Given** a JWT token with `sub=user123`, **When** the user requests `/users/user123/tasks`, **Then** the backend grants access and returns the user's tasks with HTTP 200
2. **Given** a JWT token with `sub=user123`, **When** the user requests `/users/user456/tasks`, **Then** the backend returns HTTP 403 Forbidden with error message "Access denied: cannot access another user's resources"
3. **Given** a JWT token with `sub=user123`, **When** the user attempts to modify data at `/users/user456/tasks/789`, **Then** the backend returns HTTP 403 Forbidden before executing any database operations
4. **Given** an endpoint with no `{user_id}` path parameter (e.g., `/health`), **When** any authenticated user requests it, **Then** the backend allows access without user ID validation

---

### User Story 3 - Centralized Authentication Dependency (Priority: P2)

Developers can protect any FastAPI endpoint by adding a standardized authentication dependency. The dependency handles all JWT extraction, signature verification using JWKS, claim validation, and user ID scoping logic, ensuring consistent security across all routes.

**Why this priority**: This enables rapid, consistent, and error-free implementation of authentication across the entire API surface. It reduces code duplication and ensures security policies are uniformly applied.

**Independent Test**: Can be fully tested by creating new protected endpoints using the authentication dependency, verifying that all endpoints consistently enforce authentication and authorization rules without custom security code. Delivers developer productivity value by providing a reusable security component.

**Acceptance Scenarios**:

1. **Given** a new API endpoint decorated with the authentication dependency, **When** a request arrives without valid JWT token, **Then** the dependency automatically returns HTTP 401 before the endpoint handler executes
2. **Given** a new API endpoint decorated with the user-scoped authentication dependency, **When** a request arrives with valid JWT but mismatched user ID, **Then** the dependency automatically returns HTTP 403 before the endpoint handler executes
3. **Given** multiple endpoints protected by the same dependency, **When** authentication fails for any reason, **Then** all endpoints return consistent error response format and status codes
4. **Given** an endpoint that needs only authentication (not user ID scoping), **When** developers apply the base authentication dependency, **Then** only JWT validation is performed without user ID checks

---

### Edge Cases

- What happens when the Better Auth JWKS endpoint is unreachable during application startup?
  - Application MUST fail to start with clear error message indicating JWKS endpoint is unavailable, preventing insecure deployment
- What happens when the JWKS endpoint becomes unreachable during runtime (after successful startup)?
  - Backend uses cached JWKS keys to continue verifying tokens. Log warning and retry JWKS fetch in background. Only reject tokens if both cache expired AND fetch fails (return HTTP 503)
- What happens when JWT contains extra claims beyond the standard fields (`sub`, `exp`, `iss`)?
  - Token should be accepted as long as required claims are present and valid; extra claims are safely ignored
- What happens when a user's JWT is valid but the user has been deleted or deactivated in Better Auth?
  - JWT remains valid until expiration. Better Auth is responsible for issuing short-lived tokens (e.g., 15-60 minutes) to limit exposure. Consider implementing token revocation list if real-time invalidation is required
- What happens when concurrent requests arrive with the same JWT token?
  - All concurrent requests should be processed independently; each request validates the token signature using cached JWKS keys (no shared state)
- What happens when the JWT `sub` claim is missing or empty?
  - Backend returns HTTP 401 Unauthorized with error message "Invalid token: missing subject claim"
- What happens when a path parameter `{user_id}` contains URL encoding or special characters?
  - Path parameter should be URL-decoded before comparison with JWT `sub` claim; mismatches return HTTP 403
- What happens when JWT signature verification fails (invalid signature, wrong algorithm, tampered token)?
  - Backend returns HTTP 401 Unauthorized with error message "Invalid token: signature verification failed"
- What happens when JWT issuer (`iss` claim) does not match expected Better Auth URL?
  - Backend returns HTTP 401 Unauthorized with error message "Invalid token: untrusted issuer"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Better Auth MUST be configured with JWT plugin enabled and accessible via JWKS endpoint for public key retrieval
- **FR-002**: System MUST extract JWT tokens from the `Authorization: Bearer <token>` header of incoming requests
- **FR-003**: System MUST verify JWT signature using RS256 algorithm with public keys obtained from Better Auth's JWKS endpoint
- **FR-004**: System MUST cache JWKS public keys locally with reasonable TTL (e.g., 1 hour) to minimize network calls and improve performance
- **FR-005**: System MUST extract the user ID from the `sub` claim in the verified JWT token payload
- **FR-006**: System MUST compare the session `user_id` against `{user_id}` path parameters when present in the route
- **FR-007**: System MUST return HTTP 401 Unauthorized for any session validation failure (missing, expired, invalid, or malformed credentials)
- **FR-008**: System MUST return HTTP 403 Forbidden when an authenticated user attempts to access resources belonging to a different user (user ID mismatch)
- **FR-009**: System MUST provide a reusable FastAPI dependency for JWT token validation that can be applied to any protected route
- **FR-010**: System MUST provide a reusable FastAPI dependency for user-scoped authorization that validates both JWT authenticity and user ID matching
- **FR-011**: System MUST read the Better Auth JWKS endpoint URL from environment variables, never hardcoded in source code
- **FR-012**: System MUST validate JWT tokens locally using cryptographic signature verification (RS256 with JWKS public keys)
- **FR-013**: System MUST return standardized error responses with consistent JSON structure for all authentication and authorization failures
- **FR-014**: System MUST handle missing Authorization headers by returning HTTP 401 with a descriptive error message
- **FR-015**: System MUST validate JWT expiration (`exp` claim) and reject expired tokens with HTTP 401
- **FR-016**: System MUST validate JWT issuer (`iss` claim) matches the expected Better Auth URL to prevent token substitution attacks
- **FR-017**: System MUST NOT expose JWT verification implementation details or internal error messages directly to API clients; all errors should be translated to a consistent backend error format

### Key Entities

- **JWT Token**: A cryptographically signed JSON Web Token issued by Better Auth containing user identity claims. Signed using RS256 algorithm with Better Auth's private key. Contains standard claims: `sub` (user ID), `iss` (issuer URL), `exp` (expiration timestamp), and optionally `email`, `name`, etc.

- **JWKS (JSON Web Key Set)**: A set of public keys exposed by Better Auth at `/.well-known/jwks.json` endpoint. Used by the backend to verify JWT signatures. Keys are cached locally with TTL to minimize network calls.

- **User ID (`user_id`)**: A unique identifier for a user, extracted from the JWT `sub` claim after signature verification. This ID is used to enforce resource ownership and prevent cross-user access. The `user_id` must match the `{user_id}` path parameter in user-scoped endpoints.

- **Authentication Dependency**: A reusable FastAPI dependency that extracts JWT from Authorization header, verifies signature using JWKS public keys, validates claims (`exp`, `iss`), and extracts user identity from `sub` claim. Returns standardized error responses for failures.

- **Authorization Dependency**: An extension of the authentication dependency that additionally enforces user ID scoping by comparing the JWT `sub` claim with the `{user_id}` path parameter. It prevents horizontal privilege escalation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every protected API endpoint validates authentication within 10ms of receiving a request (local JWT verification using cached JWKS keys)
- **SC-002**: System successfully rejects 100% of requests with invalid JWT tokens (expired, tampered, wrong issuer) with appropriate HTTP status codes
- **SC-003**: System successfully prevents 100% of cross-user access attempts (user A accessing user B's resources) with HTTP 403 responses
- **SC-004**: Developers can protect a new API endpoint by adding a single-line dependency annotation without writing custom authentication logic
- **SC-005**: Backend operates 100% statelessly (no session storage, no cookies, no server-side state)
- **SC-006**: All authentication and authorization errors return consistent JSON response format with clear error messages for debugging
- **SC-007**: Application fails to start if Better Auth JWKS endpoint URL is missing or unreachable during initial startup, preventing insecure deployment
- **SC-008**: Backend continues operating with cached JWKS keys during temporary JWKS endpoint outages (graceful degradation)

### Scope and Constraints

**In Scope**:
- JWT token extraction from Authorization headers
- JWT signature verification using RS256 with JWKS public keys
- JWKS public key fetching from Better Auth endpoint with local caching
- User ID extraction from JWT `sub` claim and path parameter comparison
- HTTP 401 and 403 error response handling
- Reusable FastAPI dependencies for authentication and authorization
- Environment variable configuration for Better Auth JWKS endpoint URL
- Stateless backend operation (no cookies, no session state)

**Out of Scope**:
- User login/signup UI or API endpoints (handled by Better Auth frontend integration)
- JWT token generation and signing (handled by Better Auth JWT plugin)
- Session cookie generation and management (replaced by JWT tokens in Authorization headers)
- `/api/auth/session` endpoint calls (removed entirely)
- Password validation, hashing, or reset flows (handled by Better Auth)
- Multi-factor authentication (MFA) implementation
- OAuth provider integration (Google, GitHub, etc.)
- User registration and account creation flows
- Email verification or password reset mechanisms
- Token refresh logic (handled by Better Auth frontend)
- User profile management endpoints

**Constraints**:
- Backend MUST perform local JWT verification using RS256 signature verification with JWKS public keys (no session API calls)
- Backend MUST NOT use cookies or session state (cross-domain deployment requirement)
- Backend MUST NOT call Better Auth's `/api/auth/session` endpoint (stateless architecture)
- Technology stack limited to FastAPI for backend and Better Auth JWT plugin for frontend authentication
- All configuration (including JWKS endpoint URL) must be provided via environment variables
- No deviation from standard HTTP status codes (401 for authentication, 403 for authorization)

### Assumptions

- Better Auth JWT plugin is enabled and configured on the frontend with RS256 signing
- Better Auth is already configured on the frontend/client to issue JWT tokens upon authentication
- Better Auth exposes a JWKS endpoint for public key retrieval (e.g., `/.well-known/jwks.json`)
- Frontend stores JWT tokens in localStorage and includes them in all API requests via `Authorization: Bearer <token>` header
- Client applications implement proper XSS protection (CSP headers, input sanitization) to secure localStorage
- Path parameters use `{user_id}` naming convention for user-scoped endpoints
- The `sub` claim in JWT tokens contains the user ID and matches the user ID format used in API path parameters (same data type and format)
- Network communication between client and backend uses HTTPS in production to prevent token interception
- JWT tokens have reasonable expiration times (e.g., 15-60 minutes) to limit exposure if compromised
- Database or data access layer is responsible for filtering data by user ID; authentication/authorization layer only validates identity and access rights

### Dependencies

- Better Auth framework must be configured and operational with JWT plugin enabled (RS256 signing)
- Better Auth must expose a JWKS endpoint at `/.well-known/jwks.json` for public key retrieval
- Better Auth JWKS endpoint URL must be configured in FastAPI backend via environment variable
- **Required Python libraries for backend**:
  - `PyJWT>=2.8.0` for JWT token parsing and signature verification
  - `cryptography>=41.0.0` for RS256 cryptographic operations
  - `pyjwks-client>=0.7.0` or similar for JWKS fetching and caching
  - `httpx>=0.24.0` for fetching JWKS from Better Auth endpoint (async support)
  - `pydantic>=2.0.0` for validating JWT claims structure
- FastAPI framework and its dependency injection system must be available

### Environment Configuration

**Frontend (Better Auth) Required Variables**:
- `BETTER_AUTH_URL`: The base URL where Better Auth is hosted (e.g., `https://app.example.com` or `http://localhost:3000` for development)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth operations (JWT signing with RS256). Must be a cryptographically secure random string (minimum 32 characters recommended)
- JWT plugin must be enabled in Better Auth configuration with RS256 algorithm

**Backend (FastAPI) Required Variables**:
- `BETTER_AUTH_URL`: The base URL of the Better Auth instance (must match frontend value). Used to construct JWKS endpoint URL and validate JWT issuer claim
- `BETTER_AUTH_JWKS_URL`: Full URL to Better Auth JWKS endpoint (typically `${BETTER_AUTH_URL}/.well-known/jwks.json`). Backend fetches public keys from this endpoint for JWT verification
- `JWKS_CACHE_TTL`: Optional cache duration for JWKS keys in seconds (default: 3600 = 1 hour)

**Alignment Requirements**:
- Both frontend and backend MUST use the same `BETTER_AUTH_URL` value to ensure JWT issuer validation works correctly
- The JWKS endpoint must be publicly accessible from the backend service (no authentication required for public key retrieval)
- In development environments, ensure CORS is properly configured if frontend and backend run on different ports/domains
- In production, both services should use HTTPS to prevent token interception during transmission
