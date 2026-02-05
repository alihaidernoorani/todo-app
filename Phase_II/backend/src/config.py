"""Environment configuration for the Todo Backend API."""

from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All settings are validated at startup to ensure proper configuration.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Database Configuration
    database_url: str = Field(..., alias="NEON_DATABASE_URL")

    # Server Configuration
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    # Authentication Configuration
    # Base URL of Better Auth instance (required for JWKS endpoint)
    better_auth_url: str = Field(
        ...,
        alias="BETTER_AUTH_URL",
        description="Base URL of Better Auth instance (e.g., https://app.example.com)",
    )

    @property
    def better_auth_jwks_url(self) -> str:
        """Construct JWKS endpoint URL from base URL."""
        return f"{self.better_auth_url}/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings.

    Settings are validated once at startup and cached for reuse.
    Application will fail to start if required environment variables
    are missing or invalid.
    """
    return Settings()
