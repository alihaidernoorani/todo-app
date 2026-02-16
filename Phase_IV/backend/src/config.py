"""Environment configuration for the Todo Backend API."""

from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator, model_validator
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
    port: int = Field(default=7860, alias="PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    # Authentication Configuration
    # Base URL of Better Auth instance
    better_auth_url: str = Field(
        ...,
        alias="BETTER_AUTH_URL",
        description="Base URL of Better Auth instance (e.g., https://app.example.com)",
    )

    # Better Auth JWT secret for HS256 verification (development fallback)
    better_auth_secret: Optional[str] = Field(
        default=None,
        alias="BETTER_AUTH_SECRET",
        description="Shared secret for HS256 JWT verification (development only)",
    )
    # CORS Configuration
    # Change the type hint to Union[str, list[str]] to bypass strict JSON parsing
    allowed_origins: str | list[str] = Field(
        default=["http://localhost:3000"],
        alias="ALLOWED_ORIGINS",
        description="Comma-separated list of allowed CORS origins",
    )

    # OpenAI Agents SDK Configuration (OpenRouter)
    openrouter_api_key: Optional[str] = Field(
        default=None,
        alias="OPENROUTER_API_KEY",
        description="OpenRouter API key for AI agent",
    )
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1",
        alias="OPENROUTER_BASE_URL",
        description="OpenRouter API base URL",
    )
    agent_model: str = Field(
        default="openai/gpt-4o",
        alias="AGENT_MODEL",
        description="Model to use for AI agent (OpenRouter format)",
    )
    agent_max_tokens: int = Field(
        default=2000,
        alias="AGENT_MAX_TOKENS",
        description="Maximum tokens for agent responses (default: 2000)",
    )

    # Internal backend URL for agent self-calls (MCP tools → REST API)
    # Auto-derived from PORT if not explicitly set (e.g. localhost:7860 on HF Spaces,
    # localhost:8000 in local dev). Override with BACKEND_BASE_URL env var if needed.
    backend_base_url: Optional[str] = Field(
        default=None,
        alias="BACKEND_BASE_URL",
        description="Base URL for internal backend API self-calls",
    )

    @model_validator(mode="after")
    def set_backend_base_url(self) -> "Settings":
        """Derive backend_base_url from port when not explicitly configured.

        Uses 127.0.0.1 instead of localhost to force IPv4 and prevent
        httpcore 'All connection attempts failed' errors caused by dual-stack
        DNS resolution (localhost → [::1, 127.0.0.1]) when uvicorn only
        binds to 0.0.0.0 (IPv4).
        """
        if self.backend_base_url is None:
            self.backend_base_url = f"http://127.0.0.1:{self.port}"
        else:
            # Normalize any localhost URL to 127.0.0.1 to avoid IPv6 resolution
            self.backend_base_url = self.backend_base_url.replace(
                "http://localhost:", "http://127.0.0.1:"
            )
        return self

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
            # Remove potential JSON brackets/quotes if they exist
            v = v.strip("[]'\" ")
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def better_auth_jwks_url(self) -> str:
        """Get Better Auth JWKS endpoint URL for JWT signature verification.

        Constructs JWKS URL from BETTER_AUTH_URL using Better Auth's default API path.
        JWKS endpoint provides public keys for RS256 signature verification.

        Returns:
            str: Full URL to JWKS endpoint (e.g., https://app.example.com/api/auth/jwks)
        """
        return f"{self.better_auth_url}/api/auth/jwks"

    @property
    def agent_model_name(self) -> str:
        """Get the agent model name with OpenRouter prefix stripped.

        Since we configure a custom OpenAI client with OpenRouter's base URL,
        we need to strip the 'openrouter/' prefix from the model name to avoid
        the OpenAI Agents SDK trying to resolve 'openrouter' as a provider.

        Returns:
            str: Model name without 'openrouter/' prefix
                 (e.g., 'anthropic/claude-3.5-sonnet' instead of 'openrouter/anthropic/claude-3.5-sonnet')
        """
        return self.agent_model.removeprefix("openrouter/")


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings.

    Settings are validated once at startup and cached for reuse.
    Application will fail to start if required environment variables
    are missing or invalid.
    """
    return Settings()
