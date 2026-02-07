"""
Better Auth Session Validator

This module handles session validation by delegating to Better Auth's `/api/auth/session` endpoint.
No custom JWT parsing or verification is performed - all authentication is delegated to Better Auth.
"""

import httpx
from typing import Optional, Dict, Any
from .models import BetterAuthSessionResponse, AuthenticatedUser


class SessionValidationError(Exception):
    """Base exception for session validation errors"""
    pass


class ServiceUnavailableError(SessionValidationError):
    """Raised when Better Auth service is unreachable or returns server errors"""
    pass


class InvalidSessionError(SessionValidationError):
    """Raised when session is invalid, expired, or malformed"""
    pass


async def validate_session(
    cookies: Dict[str, str],
    better_auth_url: str,
    timeout: float = 5.0
) -> Optional[AuthenticatedUser]:
    """
    Validate a user session by calling Better Auth's session endpoint.

    This function forwards cookies to Better Auth and delegates all session validation logic.
    No local JWT parsing or verification is performed.

    Args:
        cookies: Dictionary of cookies from the incoming request
        better_auth_url: Full URL to Better Auth's session endpoint
        timeout: HTTP timeout in seconds (default: 5.0)

    Returns:
        AuthenticatedUser object if session is valid
        None if session is invalid (401 from Better Auth)

    Raises:
        ServiceUnavailableError: If Better Auth is unreachable or returns 5xx errors
        InvalidSessionError: If response format is unexpected or user_id is missing
    """

    try:
        # Make HTTP GET request to Better Auth session endpoint with cookies
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(
                better_auth_url,
                cookies=cookies,
                follow_redirects=False
            )

        # Handle different response status codes
        if response.status_code == 200:
            # Session is valid - parse and validate response
            try:
                data = response.json()
                session_response = BetterAuthSessionResponse(**data)

                # Validate user_id is present
                if not session_response.user.id:
                    raise InvalidSessionError("Session missing user ID")

                # Return authenticated user
                return AuthenticatedUser(
                    user_id=session_response.user.id,
                    email=session_response.user.email,
                    name=session_response.user.name
                )

            except (ValueError, KeyError) as e:
                # JSON parsing or validation failed
                raise InvalidSessionError(f"Invalid session response format: {e}")

        elif response.status_code == 401:
            # Session is invalid, expired, or missing
            return None

        elif 400 <= response.status_code < 500:
            # Other client errors - treat as invalid session
            return None

        else:
            # Server errors (5xx) - Better Auth is unavailable
            raise ServiceUnavailableError(
                f"Better Auth returned status {response.status_code}"
            )

    except httpx.TimeoutException:
        raise ServiceUnavailableError("Better Auth session endpoint timed out")

    except httpx.ConnectError:
        raise ServiceUnavailableError("Cannot connect to Better Auth session endpoint")

    except httpx.HTTPError as e:
        raise ServiceUnavailableError(f"HTTP error calling Better Auth: {e}")
