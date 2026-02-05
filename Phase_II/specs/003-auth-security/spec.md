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

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stateless JWT Authentication (Priority: P1)

A client application (web/mobile) authenticates a user and receives a JWT token from Better Auth. The client includes this JWT in the `Authorization: Bearer <token>` header when making API requests to the FastAPI backend. The backend validates the token using a shared secret and grants access to protected resources.

**Why this priority**: This is the foundational authentication mechanism. Without it, no other user-specific functionality can work. It's the core security layer that protects all API endpoints.

**Independent Test**: Can be fully tested by obtaining a JWT from Better Auth, making an API request with the token in the Authorization header, and verifying successful access to a protected endpoint. Delivers immediate value by enabling secure API access.

**Acceptance Scenarios**:

1. **Given** a valid JWT token issued by Better Auth, **When** the client sends a request with `Authorization: Bearer <valid_token>` header to a protected endpoint, **Then** the backend validates the token signature using BETTER_AUTH_SECRET and grants access with HTTP 200
2. **Given** an expired JWT token, **When** the client sends a request with the expired token, **Then** the backend returns HTTP 401 Unauthorized with error message "Token expired"
3. **Given** a JWT token with invalid signature, **When** the client sends a request with the tampered token, **Then** the backend returns HTTP 401 Unauthorized with error message "Invalid token signature"
4. **Given** no Authorization header, **When** the client sends a request to a protected endpoint, **Then** the backend returns HTTP 401 Unauthorized with error message "Missing authentication token"
5. **Given** a malformed Authorization header (not "Bearer <token>" format), **When** the client sends the request, **Then** the backend returns HTTP 401 Unauthorized with error message "Invalid authorization header format"

---

### User Story 2 - User Identity Scoping (Priority: P1)

Users can only access their own resources. When a user makes a request to an endpoint like `/users/{user_id}/tasks`, the backend verifies that the `sub` claim in their JWT matches the `{user_id}` path parameter, preventing unauthorized access to other users' data.

**Why this priority**: This is a critical security requirement that prevents horizontal privilege escalation. Without it, authenticated users could access or modify other users' data, which is a severe security vulnerability.

**Independent Test**: Can be fully tested by creating two different users with valid JWTs, attempting to access each other's resources via path parameters, and verifying that cross-user access is blocked with HTTP 403. Delivers immediate security value by enforcing data isolation.

**Acceptance Scenarios**:

1. **Given** a user with `sub=user123` in their JWT, **When** they request `/users/user123/tasks`, **Then** the backend grants access and returns the user's tasks with HTTP 200
2. **Given** a user with `sub=user123` in their JWT, **When** they request `/users/user456/tasks`, **Then** the backend returns HTTP 403 Forbidden with error message "Access denied: cannot access another user's resources"
3. **Given** a user with `sub=user123` in their JWT, **When** they attempt to modify data at `/users/user456/tasks/789`, **Then** the backend returns HTTP 403 Forbidden before executing any database operations
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

- What happens when the Better Auth JWKS endpoint URL is missing, empty, or unreachable?
  - Application should fail to start with a clear error message indicating the missing or unreachable JWKS configuration
- What happens when a JWT contains extra claims beyond the standard `uid`, `exp`, `iat`?
  - Token should be accepted as long as required claims (`uid`, signature, expiration) are valid; extra claims are ignored
- What happens when a user's JWT is valid but the user has been deleted or deactivated?
  - The backend relies solely on JWT validity (signature and expiration) without checking user status in the database. This maintains 100% stateless architecture and maximum performance. Deleted or deactivated users can continue accessing the system until their JWT expires, requiring short JWT expiration times (15-30 minutes recommended) to minimize exposure window
- What happens when concurrent requests arrive with the same JWT?
  - All concurrent requests should be processed independently; stateless JWTs allow unlimited concurrent usage
- What happens when the JWT `sub` claim is missing or malformed?
  - Backend returns HTTP 401 Unauthorized with error message "Invalid token: missing or malformed user ID claim"
- What happens when a path parameter `{user_id}` contains URL encoding or special characters?
  - Path parameter should be URL-decoded before comparison with JWT `sub`; mismatches return HTTP 403

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Better Auth MUST have the JWT plugin explicitly enabled in its configuration to issue JWT tokens
- **FR-002**: System MUST validate JWT tokens using RS256 algorithm with public keys retrieved from Better Auth JWKS endpoint
- **FR-003**: System MUST extract JWT tokens from the `Authorization` HTTP header in the format `Bearer <token>`
- **FR-004**: System MUST verify JWT signature, expiration time (`exp` claim), and issued-at time (`iat` claim)
- **FR-005**: System MUST extract the user ID from the `sub` claim in the validated JWT payload
- **FR-006**: System MUST compare the JWT `sub` claim against `{user_id}` path parameters when present in the route
- **FR-007**: System MUST return HTTP 401 Unauthorized for any token validation failure (missing, expired, invalid signature, malformed)
- **FR-008**: System MUST return HTTP 403 Forbidden when an authenticated user attempts to access resources belonging to a different user (sub claim mismatch)
- **FR-009**: System MUST provide a reusable FastAPI dependency for token validation that can be applied to any protected route
- **FR-010**: System MUST provide a reusable FastAPI dependency for user-scoped authorization that validates both token and user ID matching
- **FR-011**: System MUST read the Better Auth JWKS endpoint URL from environment variables, never hardcoded in source code
- **FR-012**: System MUST operate in a completely stateless manner without storing session data, cookies, or server-side state
- **FR-013**: System MUST return standardized error responses with consistent JSON structure for all authentication and authorization failures
- **FR-014**: System MUST handle missing Authorization headers by returning HTTP 401 with a descriptive error message
- **FR-015**: System MUST validate that the Authorization header follows the exact format "Bearer <token>" (case-sensitive "Bearer" prefix)
- **FR-016**: System MUST gracefully handle JWT parsing errors and return HTTP 401 for malformed tokens

### Key Entities

- **JWT Token**: A cryptographically signed JSON Web Token containing user identity claims (`sub`, `exp`, `iat`) and issued by Better Auth. The token is stateless and self-contained, requiring no server-side storage.

- **User ID (`sub`)**: A unique identifier for a user, embedded as a claim in the JWT token using the OIDC-standard `sub` (subject) claim. This ID is used to enforce resource ownership and prevent cross-user access. The `sub` must match the `{user_id}` path parameter in user-scoped endpoints.

- **Authentication Dependency**: A reusable FastAPI dependency that validates JWT tokens and extracts user identity. It handles all token validation logic (signature verification, expiration checking) and returns standardized error responses for failures.

- **Authorization Dependency**: An extension of the authentication dependency that additionally enforces user ID scoping by comparing the JWT `sub` claim with the `{user_id}` path parameter. It prevents horizontal privilege escalation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every protected API endpoint validates authentication within 50ms of receiving a request (token validation overhead)
- **SC-002**: System successfully rejects 100% of requests with invalid tokens (expired, tampered, or malformed) with appropriate HTTP status codes
- **SC-003**: System successfully prevents 100% of cross-user access attempts (user A accessing user B's resources) with HTTP 403 responses
- **SC-004**: Developers can protect a new API endpoint by adding a single-line dependency annotation without writing custom authentication logic
- **SC-005**: Zero authentication state is stored on the server (fully stateless validation using only JWT and shared secret)
- **SC-006**: All authentication and authorization errors return consistent JSON response format with clear error messages for debugging
- **SC-007**: Application fails to start if Better Auth JWKS endpoint URL is missing or unreachable, preventing insecure deployment

### Scope and Constraints

**In Scope**:
- JWT token validation using RS256 and JWKS public key retrieval
- Authorization header extraction and parsing
- User ID claim extraction and path parameter comparison
- HTTP 401 and 403 error response handling
- Reusable FastAPI dependencies for authentication and authorization
- Environment variable configuration for Better Auth JWKS endpoint URL
- Stateless backend architecture (no cookies, sessions, or server-side state)

**Out of Scope**:
- User login/signup UI or API endpoints (handled by Better Auth frontend integration)
- JWT token issuance (handled by Better Auth)
- Password validation, hashing, or reset flows (handled by Better Auth)
- Multi-factor authentication (MFA) implementation
- OAuth provider integration (Google, GitHub, etc.)
- User registration and account creation flows
- Email verification or password reset mechanisms
- Session management or refresh token handling
- User profile management endpoints

**Constraints**:
- Backend must remain 100% stateless (no session storage, cookies, or server-side state)
- Technology stack limited to FastAPI for backend and Better Auth for frontend authentication
- JWT verification must use RS256 algorithm with JWKS public key retrieval from Better Auth
- All configuration (including JWKS endpoint URL) must be provided via environment variables
- No deviation from standard HTTP status codes (401 for authentication, 403 for authorization)

### Assumptions

- Better Auth JWT plugin is explicitly enabled in Better Auth configuration (required for JWT token issuance)
- Better Auth is already configured on the frontend/client to issue JWT tokens with `sub`, `exp`, and `iat` claims
- Better Auth JWT tokens use RS256 signing algorithm (asymmetric cryptography with public/private key pairs)
- Better Auth exposes a JWKS endpoint containing public keys for JWT signature verification
- The FastAPI backend can reach the Better Auth JWKS endpoint to retrieve public keys for token validation
- Client applications correctly include the JWT in the `Authorization: Bearer <token>` header format
- Path parameters use `{user_id}` naming convention for user-scoped endpoints
- The `sub` claim in JWT tokens matches the user ID format used in API path parameters (same data type and format)
- Network communication between client and backend uses HTTPS in production to prevent token interception
- JWT tokens have reasonable expiration times (not indefinite) to limit exposure if compromised
- Database or data access layer is responsible for filtering data by user ID; authentication/authorization layer only validates identity and access rights

### Dependencies

- Better Auth framework must be configured and operational on the frontend/client side with JWT plugin enabled
- Better Auth must expose a JWKS endpoint (typically at `/.well-known/jwks.json`) containing public keys for token verification
- Better Auth JWKS endpoint URL must be configured in FastAPI backend via environment variable
- **Required Python libraries for backend**:
  - `PyJWT>=2.8.0` with `cryptography>=41.0.0` for RS256 and JWKS support, OR
  - `python-jose[cryptography]>=3.3.0` for RS256 and JWKS support
  - Note: Installing `PyJWT` or `python-jose` without the `cryptography` extra will NOT provide RS256 algorithm support
- FastAPI framework and its dependency injection system must be available

### Environment Configuration

**Frontend (Better Auth) Required Variables**:
- `BETTER_AUTH_URL`: The base URL where Better Auth is hosted (e.g., `https://app.example.com` or `http://localhost:3000` for development)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth operations (session encryption, CSRF protection). Must be a cryptographically secure random string (minimum 32 characters recommended)
- JWT Plugin must be explicitly enabled in Better Auth configuration with RS256 algorithm

**Backend (FastAPI) Required Variables**:
- `BETTER_AUTH_URL`: The base URL of the Better Auth instance (must match frontend value). Used to construct JWKS endpoint URL
- `BETTER_AUTH_JWKS_URL`: Full URL to Better Auth JWKS endpoint (typically `${BETTER_AUTH_URL}/.well-known/jwks.json`). Backend retrieves public keys from this endpoint for JWT signature verification

**Alignment Requirements**:
- Both frontend and backend MUST use the same `BETTER_AUTH_URL` value to ensure JWKS endpoint discovery works correctly
- The JWKS endpoint must be publicly accessible from the backend service (no authentication required for JWKS retrieval)
- In development environments, ensure CORS is properly configured if frontend and backend run on different ports/domains
- In production, both services should use HTTPS to prevent token interception during transmission
