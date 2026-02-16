"""Configuration management for MCP server.

Loads environment variables and provides configuration values
for the MCP server and tools.
"""

import os
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class MCPConfig(BaseSettings):
    """MCP server configuration from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Backend API Configuration
    backend_url: str = "http://localhost:8000"
    request_timeout: float = 30.0

    # Logging Configuration
    mcp_debug: bool = False

    @property
    def log_level(self) -> str:
        """Get logging level based on debug flag."""
        return "DEBUG" if self.mcp_debug else "INFO"


def load_config() -> MCPConfig:
    """Load and validate MCP configuration.

    Returns:
        MCPConfig: Validated configuration object

    Raises:
        ValidationError: If configuration is invalid
    """
    return MCPConfig()


# Global configuration instance
_config: MCPConfig | None = None


def get_config() -> MCPConfig:
    """Get or create the global configuration instance.

    Returns:
        MCPConfig: Global configuration singleton
    """
    global _config
    if _config is None:
        _config = load_config()
    return _config
