"""Custom exception classes for authentication and authorization."""


class AuthenticationError(Exception):
    """Exception raised when JWT authentication fails.

    This includes scenarios like:
    - Missing Authorization header
    - Invalid header format
    - Invalid token signature
    - Expired token
    - Malformed token
    - Missing sub claim
    """

    pass


class AuthorizationError(Exception):
    """Exception raised when user authorization fails.

    This includes scenarios like:
    - User attempting to access another user's resources (sub claim mismatch)
    """

    pass


class JWTExpiredError(AuthenticationError):
    """Exception raised when JWT token has expired (exp claim in the past)."""

    pass


class JWTInvalidSignatureError(AuthenticationError):
    """Exception raised when JWT signature verification fails (tampered or wrong key)."""

    pass


class JWTMissingClaimError(AuthenticationError):
    """Exception raised when required JWT claims are missing (sub, exp, iat, iss)."""

    pass


class JWKSUnavailableError(AuthenticationError):
    """Exception raised when JWKS endpoint is unreachable or returns invalid data."""

    pass
