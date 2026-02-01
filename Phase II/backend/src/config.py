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
    better_auth_secret: str = Field(..., alias="BETTER_AUTH_SECRET", min_length=32)

    @field_validator("better_auth_secret")
    @classmethod
    def validate_secret_strength(cls, v: str) -> str:
        """Validate that the shared secret meets security requirements.

        The secret must be at least 32 characters (256 bits) for secure HS256 signing.
        """
        if len(v) < 32:
            raise ValueError(
                "BETTER_AUTH_SECRET must be at least 32 characters (256 bits) "
                "for secure HS256 signing. Current length: {}".format(len(v))
            )
        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings.

    Settings are validated once at startup and cached for reuse.
    Application will fail to start if required environment variables
    are missing or invalid.
    """
    return Settings()
