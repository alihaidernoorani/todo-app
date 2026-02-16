"""Authentication module for session-based authentication and authorization.

This module provides FastAPI dependencies for:
1. Session authentication via Better Auth (get_current_user)
2. User-scoped authorization (get_current_user_with_path_validation)

All authentication is delegated to Better Auth - no custom JWT parsing.
"""

from .dependencies import get_current_user, get_current_user_with_path_validation

__all__ = ["get_current_user", "get_current_user_with_path_validation"]
