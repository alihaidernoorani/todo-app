"""Authentication data models for JWT payload and error responses."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class JWTPayload(BaseModel):
    """JWT token payload structure expected from Better Auth.

    Note: This assumes Better Auth is configured with:
    - Algorithm: HS256 (requires customSign configuration)
    - User ID claim: 'uid' (requires definePayload configuration)
    """

    uid: str = Field(..., description="User unique identifier", min_length=1)
    exp: int = Field(..., description="Expiration timestamp (Unix epoch seconds)")
    iat: int = Field(..., description="Issued at timestamp (Unix epoch seconds)")

    # Optional claims that may be present based on Better Auth configuration
    iss: Optional[str] = Field(None, description="Token issuer (BASE_URL)")
    aud: Optional[str] = Field(None, description="Token audience (BASE_URL)")
    email: Optional[str] = Field(None, description="User email address")
    role: Optional[str] = Field(None, description="User role for RBAC")

    model_config = {
        "json_schema_extra": {
            "example": {
                "uid": "clxyz123abc456def789",
                "exp": 1706274000,
                "iat": 1706273100,
                "iss": "https://example.com",
                "aud": "https://example.com",
                "email": "user@example.com",
                "role": "user",
            }
        }
    }


class AuthErrorCode(str, Enum):
    """Machine-readable error codes for authentication failures."""

    MISSING_TOKEN = "MISSING_TOKEN"
    INVALID_HEADER_FORMAT = "INVALID_HEADER_FORMAT"
    INVALID_TOKEN_SIGNATURE = "INVALID_TOKEN_SIGNATURE"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    MALFORMED_TOKEN = "MALFORMED_TOKEN"
    MISSING_UID_CLAIM = "MISSING_UID_CLAIM"
    FORBIDDEN_USER_ACCESS = "FORBIDDEN_USER_ACCESS"


class AuthErrorResponse(BaseModel):
    """Standardized error response for authentication and authorization failures.

    This model ensures consistent error responses across all protected endpoints.
    """

    detail: str = Field(..., description="Human-readable error message")
    error_code: AuthErrorCode = Field(
        ..., description="Machine-readable error identifier"
    )
    status_code: int = Field(..., description="HTTP status code (401 or 403)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "detail": "Token expired",
                "error_code": "TOKEN_EXPIRED",
                "status_code": 401,
            }
        }
    }
