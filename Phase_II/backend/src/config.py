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

    # CORS Configuration
    # List of allowed origins for cross-origin requests
    allowed_origins: list[str] = Field(
        default=["http://localhost:3000"],
        alias="ALLOWED_ORIGINS",
        description="Comma-separated list of allowed CORS origins",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse comma-separated origins from environment variable.

        Supports both comma-separated strings and lists. Strips whitespace
        from each origin and filters out empty strings.

        Args:
            v: Either a comma-separated string or a list of origin URLs

        Returns:
            List of origin URLs with whitespace stripped

        Example:
            "http://localhost:3000,https://app.vercel.app" ->
            ["http://localhost:3000", "https://app.vercel.app"]
        """
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

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
