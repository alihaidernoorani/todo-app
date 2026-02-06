# Feature Specification: Authentication and Security

**Feature Branch**: `003-auth-security`
**Created**: 2026-01-25
**Status**: Draft
**Input**: User description: "Authentication and Security Specification

Target audience: Security architects and full-stack developers
Focus: Stateless JWT verification using Better Auth with RS256 and JWKS

Success criteria:
- Explicitly require Better Auth JWT plugin to be enabled in Better Auth configuration for JWT token issuance.
- Detail the integration of the Better Auth JWT plugin for stateless sessions.
- Define a FastAPI dependency/middleware to extract the JWT from 'Authorization: Bearer' headers.
- Implement RS256 verification logic using JWKS (JSON Web Key Set) from Better Auth.
- Compare the 'sub' in the verified JWT against the '{user_id}' in the URL path.
- Return 401 for invalid tokens and 403 if a user attempts to access another user's path.

Constraints:
- 100% stateless backend (no cookies).
- Tech stack: FastAPI + Better Auth (RS256 with JWKS).
- Use environment variables for configuration.

Not building:
- Login/Signup UI logic.
- MFA or password reset flows."

## Clarifications

### Session 2026-02-05

- Q: Should the backend use the OIDC-standard `sub` claim as `user_id`, or should we enforce a custom `uid` claim? → A: Use OIDC-standard `sub` claim (Better Auth default, standards-compliant, no custom configuration needed)
- Q: Should the system use HS256 with a shared secret or RS256 with JWKS? → A: RS256 with JWKS (Better Auth default, asymmetric cryptography, supports key rotation, no shared secrets, industry standard for distributed systems)
- Q: Should the specification explicitly require the Better Auth JWT plugin to be enabled for token issuance? → A: Yes, explicitly require JWT plugin to be enabled in Better Auth configuration (prevents implementation failures, ensures tokens are issued)
- Q: Should the spec define required environment variables and alignment between frontend and backend auth configuration? → A: Yes, define required environment variables and frontend-backend alignment (clear deployment requirements, prevents misconfiguration)
- Q: Should the spec mandate specific libraries for configuration and token verification to match the actual implementation? → A: Yes, mandate specific libraries with cryptographic support (ensures RS256/JWKS capability, clear dependency requirements)

### Session 2026-02-07

- Q: Should route protection rely entirely on Better Auth sessions instead of custom JWT cookies? → A: Better Auth sessions (delegated) - This approach leverages Better Auth's built-in session management which is more reliable than custom JWT cookies, reducing complexity and potential redirect loops.
- Q: Should middleware use the `/api/auth/session` endpoint instead of reading cookies manually? → A: Use `/api/auth/session` endpoint (standard) - This follows Better Auth's established patterns and ensures consistency with the framework's session management, avoiding manual cookie parsing that might be causing the redirect loop.
- Q: Should custom `auth-token` logic be fully removed from the system? → A: Fully remove custom auth-token logic (clean) - This eliminates potential conflicts between custom and Better Auth's native session management, which is likely causing the redirect loop issue.
- Q: Should dashboard protection be handled via server-side session checks instead of middleware? → A: Server-side session checks (secure) - Handle authentication via server-side session validation in page components rather than relying on middleware that may be causing redirect loops.
- Q: What is the single source of truth for authentication state (Better Auth session vs custom token)? → A: Better Auth session as single source of truth (authoritative) - Establish Better Auth's native session management as the definitive source for authentication state, eliminating conflicts with custom implementations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Better Auth Session Validation (Priority: P1)

A client application (web/mobile) authenticates a user and receives session tokens from Better Auth. The client includes authentication credentials (either in `Authorization: Bearer <token>` header or cookies) when making API requests to the FastAPI backend. The backend validates the session by calling Better Auth's `/api/auth/session` endpoint and grants access to protected resources.

**Why this priority**: This is the foundational authentication mechanism. Without it, no other user-specific functionality can work. It's the core security layer that protects all API endpoints.

**Independent Test**: Can be fully tested by obtaining a JWT from Better Auth, making an API request with the token in the Authorization header, and verifying successful access to a protected endpoint. Delivers immediate value by enabling secure API access.

**Acceptance Scenarios**:

1. **Given** a valid Better Auth session, **When** the client sends a request with `Authorization: Bearer <valid_token>` header to a protected endpoint, **Then** the backend validates the session by calling Better Auth's session endpoint and grants access with HTTP 200
2. **Given** an expired Better Auth session, **When** the client sends a request with the expired session, **Then** the backend returns HTTP 401 Unauthorized with error message "Session expired"
3. **Given** an invalid Better Auth session, **When** the client sends a request with the invalid session, **Then** the backend returns HTTP 401 Unauthorized with error message "Invalid session"
4. **Given** no Authorization header or session cookies, **When** the client sends a request to a protected endpoint, **Then** the backend returns HTTP 401 Unauthorized with error message "Missing authentication credentials"
5. **Given** a malformed Authorization header (not "Bearer <token>" format), **When** the client sends the request, **Then** the backend returns HTTP 401 Unauthorized with error message "Invalid authorization header format"

---

### User Story 2 - User Identity Scoping (Priority: P1)

Users can only access their own resources. When a user makes a request to an endpoint like `/users/{user_id}/tasks`, the backend verifies that the `user_id` in their Better Auth session matches the `{user_id}` path parameter, preventing unauthorized access to other users' data.

**Why this priority**: This is a critical security requirement that prevents horizontal privilege escalation. Without it, authenticated users could access or modify other users' data, which is a severe security vulnerability.

**Independent Test**: Can be fully tested by creating two different users with valid JWTs, attempting to access each other's resources via path parameters, and verifying that cross-user access is blocked with HTTP 403. Delivers immediate security value by enforcing data isolation.

**Acceptance Scenarios**:

1. **Given** a user with `user_id=user123` in their Better Auth session, **When** they request `/users/user123/tasks`, **Then** the backend grants access and returns the user's tasks with HTTP 200
2. **Given** a user with `user_id=user123` in their Better Auth session, **When** they request `/users/user456/tasks`, **Then** the backend returns HTTP 403 Forbidden with error message "Access denied: cannot access another user's resources"
3. **Given** a user with `user_id=user123` in their Better Auth session, **When** they attempt to modify data at `/users/user456/tasks/789`, **Then** the backend returns HTTP 403 Forbidden before executing any database operations
4. **Given** an endpoint with no `{user_id}` path parameter (e.g., `/health`), **When** any authenticated user requests it, **Then** the backend allows access without user ID validation

---

### User Story 3 - Centralized Authentication Dependency (Priority: P2)

Developers can protect any FastAPI endpoint by adding a standardized authentication dependency. The dependency handles all token extraction, validation, and user ID scoping logic, ensuring consistent security across all routes.

**Why this priority**: This enables rapid, consistent, and error-free implementation of authentication across the entire API surface. It reduces code duplication and ensures security policies are uniformly applied.

**Independent Test**: Can be fully tested by creating new protected endpoints using the authentication dependency, verifying that all endpoints consistently enforce authentication and authorization rules without custom security code. Delivers developer productivity value by providing a reusable security component.

**Acceptance Scenarios**:

1. **Given** a new API endpoint decorated with the authentication dependency, **When** a request arrives without a valid token, **Then** the dependency automatically returns HTTP 401 before the endpoint handler executes
2. **Given** a new API endpoint decorated with the user-scoped authentication dependency, **When** a request arrives with valid token but mismatched user ID, **Then** the dependency automatically returns HTTP 403 before the endpoint handler executes
3. **Given** multiple endpoints protected by the same dependency, **When** authentication fails for any reason, **Then** all endpoints return consistent error response format and status codes
4. **Given** an endpoint that needs only authentication (not user ID scoping), **When** developers apply the base authentication dependency, **Then** only token validation is performed without user ID checks

---

### Edge Cases

- What happens when the Better Auth session endpoint is unreachable or returns an error?
  - Application should return HTTP 503 Service Unavailable with error message indicating Better Auth is unavailable, and log the error for debugging
- What happens when Better Auth session response contains extra fields beyond the standard user data?
  - Session should be accepted as long as required fields (`user_id`) are present; extra fields are safely ignored
- What happens when a user's session is valid but the user has been deleted or deactivated in Better Auth?
  - Better Auth is responsible for invalidating sessions for deleted/deactivated users. The backend trusts Better Auth's session validation response
- What happens when concurrent requests arrive with the same session token?
  - All concurrent requests should be processed independently; each request validates the session separately via Better Auth API
- What happens when the session data is missing the `user_id` field?
  - Backend returns HTTP 401 Unauthorized with error message "Invalid session: missing user ID"
- What happens when a path parameter `{user_id}` contains URL encoding or special characters?
  - Path parameter should be URL-decoded before comparison with session `user_id`; mismatches return HTTP 403

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Better Auth MUST be configured and accessible via API endpoints for session validation
- **FR-002**: System MUST validate sessions by calling Better Auth's `/api/auth/session` endpoint with authentication credentials (Bearer token or cookies)
- **FR-003**: System MUST extract session tokens from the `Authorization` HTTP header in the format `Bearer <token>` or from session cookies
- **FR-004**: System MUST handle session validation responses from Better Auth, checking for valid user data in the response
- **FR-005**: System MUST extract the user ID from the session data returned by Better Auth's session endpoint
- **FR-006**: System MUST compare the session `user_id` against `{user_id}` path parameters when present in the route
- **FR-007**: System MUST return HTTP 401 Unauthorized for any token validation failure (missing, expired, invalid signature, malformed)
- **FR-008**: System MUST return HTTP 403 Forbidden when an authenticated user attempts to access resources belonging to a different user (sub claim mismatch)
- **FR-009**: System MUST provide a reusable FastAPI dependency for token validation that can be applied to any protected route
- **FR-010**: System MUST provide a reusable FastAPI dependency for user-scoped authorization that validates both token and user ID matching
- **FR-011**: System MUST read the Better Auth session endpoint URL from environment variables, never hardcoded in source code
- **FR-012**: System MUST validate sessions by calling Better Auth's `/api/auth/session` endpoint rather than manual JWT validation
- **FR-013**: System MUST return standardized error responses with consistent JSON structure for all authentication and authorization failures
- **FR-014**: System MUST handle missing Authorization headers by returning HTTP 401 with a descriptive error message
- **FR-015**: System MUST validate that the Authorization header follows the exact format "Bearer <token>" (case-sensitive "Bearer" prefix)
- **FR-016**: System MUST gracefully handle JWT parsing errors and return HTTP 401 for malformed tokens

### Key Entities

- **Better Auth Session**: A validated user session obtained by calling Better Auth's `/api/auth/session` endpoint. Contains user identity information including user ID, email, and other profile data. The session is managed by Better Auth and validated via API calls.

- **User ID (`user_id`)**: A unique identifier for a user, extracted from the Better Auth session data. This ID is used to enforce resource ownership and prevent cross-user access. The `user_id` must match the `{user_id}` path parameter in user-scoped endpoints.

- **Authentication Dependency**: A reusable FastAPI dependency that validates user sessions by calling Better Auth's session endpoint and extracts user identity. It handles all session validation logic and returns standardized error responses for failures.

- **Authorization Dependency**: An extension of the authentication dependency that additionally enforces user ID scoping by comparing the session `user_id` with the `{user_id}` path parameter. It prevents horizontal privilege escalation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every protected API endpoint validates authentication within 50ms of receiving a request (token validation overhead)
- **SC-002**: System successfully rejects 100% of requests with invalid tokens (expired, tampered, or malformed) with appropriate HTTP status codes
- **SC-003**: System successfully prevents 100% of cross-user access attempts (user A accessing user B's resources) with HTTP 403 responses
- **SC-004**: Developers can protect a new API endpoint by adding a single-line dependency annotation without writing custom authentication logic
- **SC-005**: Authentication state is delegated to Better Auth (backend validates sessions via API calls without local session storage)
- **SC-006**: All authentication and authorization errors return consistent JSON response format with clear error messages for debugging
- **SC-007**: Application fails to start if Better Auth session endpoint URL is missing or unreachable, preventing insecure deployment

### Scope and Constraints

**In Scope**:
- Better Auth session validation via API endpoint calls
- Session token extraction from Authorization header or cookies
- User ID extraction from session data and path parameter comparison
- HTTP 401 and 403 error response handling
- Reusable FastAPI dependencies for authentication and authorization
- Environment variable configuration for Better Auth endpoint URLs
- Delegated session management to Better Auth (not fully stateless)

**Out of Scope**:
- User login/signup UI or API endpoints (handled by Better Auth frontend integration)
- JWT token issuance (handled by Better Auth)
- Password validation, hashing, or reset flows (handled by Better Auth)
- Multi-factor authentication (MFA) implementation
- OAuth provider integration (Google, GitHub, etc.)
- User registration and account creation flows
- Email verification or password reset mechanisms
- Custom session management or refresh token handling (delegated to Better Auth)
- User profile management endpoints

**Constraints**:
- Backend must use Better Auth session validation via API endpoint calls (not 100% stateless, but delegates session management to Better Auth)
- Technology stack limited to FastAPI for backend and Better Auth for frontend authentication
- Session validation must use Better Auth's `/api/auth/session` endpoint
- All configuration (including session endpoint URL) must be provided via environment variables
- No deviation from standard HTTP status codes (401 for authentication, 403 for authorization)

### Assumptions

- Better Auth session management is enabled and configured on the frontend
- Better Auth is already configured on the frontend/client to manage user sessions and authentication
- Better Auth exposes a session validation endpoint at `/api/auth/session`
- The FastAPI backend can reach the Better Auth session endpoint to validate user sessions
- Client applications correctly include session tokens in the `Authorization: Bearer <token>` header or session cookies
- Path parameters use `{user_id}` naming convention for user-scoped endpoints
- The `user_id` in Better Auth session data matches the user ID format used in API path parameters (same data type and format)
- Network communication between client and backend uses HTTPS in production to prevent token/cookie interception
- Better Auth sessions have reasonable expiration times to limit exposure if compromised
- Database or data access layer is responsible for filtering data by user ID; authentication/authorization layer only validates identity and access rights

### Dependencies

- Better Auth framework must be configured and operational with session management enabled
- Better Auth must expose a session validation endpoint (typically at `/api/auth/session`)
- Better Auth session endpoint URL must be configured in FastAPI backend via environment variable
- **Required Python libraries for backend**:
  - `httpx>=0.24.0` or `requests>=2.31.0` for making HTTP calls to Better Auth session endpoint
  - `pydantic>=2.0.0` for validating session response data
- FastAPI framework and its dependency injection system must be available

### Environment Configuration

**Frontend (Better Auth) Required Variables**:
- `BETTER_AUTH_URL`: The base URL where Better Auth is hosted (e.g., `https://app.example.com` or `http://localhost:3000` for development)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth operations (session encryption, CSRF protection). Must be a cryptographically secure random string (minimum 32 characters recommended)
- Session management must be enabled in Better Auth configuration

**Backend (FastAPI) Required Variables**:
- `BETTER_AUTH_URL`: The base URL of the Better Auth instance (must match frontend value). Used to construct session endpoint URL
- `BETTER_AUTH_SESSION_URL`: Full URL to Better Auth session endpoint (typically `${BETTER_AUTH_URL}/api/auth/session`). Backend calls this endpoint for session validation

**Alignment Requirements**:
- Both frontend and backend MUST use the same `BETTER_AUTH_URL` value to ensure session endpoint discovery works correctly
- The session endpoint must be accessible from the backend service
- In development environments, ensure CORS is properly configured if frontend and backend run on different ports/domains
- In production, both services should use HTTPS to prevent token/cookie interception during transmission
