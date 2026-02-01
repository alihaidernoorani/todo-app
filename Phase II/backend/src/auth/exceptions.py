"""Custom exception classes for authentication and authorization."""


class AuthenticationError(Exception):
    """Exception raised when JWT authentication fails.

    This includes scenarios like:
    - Missing Authorization header
    - Invalid header format
    - Invalid token signature
    - Expired token
    - Malformed token
    - Missing uid claim
    """

    pass


class AuthorizationError(Exception):
    """Exception raised when user authorization fails.

    This includes scenarios like:
    - User attempting to access another user's resources (uid mismatch)
    """

    pass
