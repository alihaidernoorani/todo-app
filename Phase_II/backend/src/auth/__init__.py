"""Authentication module for JWT-based authentication and authorization.

This module provides FastAPI dependencies for:
1. Basic JWT authentication (get_current_user)
2. User-scoped authorization (verify_user_access)
"""

from .dependencies import get_current_user, verify_user_access

__all__ = ["get_current_user", "verify_user_access"]
