"""FastAPI application entry point."""

import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jwt import PyJWKClient
from sqlalchemy.exc import OperationalError

from src.api.v1.router import router as v1_router
from src.config import get_settings
from src.database import create_db_and_tables
from src.exceptions import DatabaseError, NotFoundError, ValidationError

logger = logging.getLogger(__name__)

# Configure OpenAI SDK environment variables from OpenRouter config
# The OpenAI SDK expects OPENAI_API_KEY, OPENAI_BASE_URL, and OPENAI_MODEL
settings = get_settings()
if settings.openrouter_api_key:
    os.environ["OPENAI_API_KEY"] = settings.openrouter_api_key
    os.environ["OPENAI_BASE_URL"] = settings.openrouter_base_url
    os.environ["OPENAI_MODEL"] = settings.agent_model
    logger.info(f"✅ OpenAI SDK configured to use OpenRouter API with model: {settings.agent_model}")
else:
    logger.warning("⚠️  OPENROUTER_API_KEY not set - AI agent will not be available")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application lifespan handler with optional JWKS validation.

    Attempts to validate JWKS endpoint on startup for RS256 support.
    If JWKS is unavailable, falls back to HS256 with shared secret.
    This allows development environments to work without JWKS.

    JWKS client is cached in app.state for reuse if available.
    """
    # Use already loaded settings (cached)

    # Startup: Validate JWKS endpoint and cache client (optional)
    logger.info("Validating JWKS endpoint: %s", settings.better_auth_jwks_url)
    try:
        jwks_client = PyJWKClient(settings.better_auth_jwks_url)
        # Test JWKS endpoint by fetching keys
        keys = jwks_client.get_jwk_set()
        if not keys or not keys.get("keys"):
            logger.warning(
                "JWKS endpoint returned no keys: %s. Will fall back to HS256 with shared secret.",
                settings.better_auth_jwks_url,
            )
        else:
            logger.info("✅ JWKS validation successful. Found %d keys. Using RS256.", len(keys.get("keys", [])))
            # Cache JWKS client in app state for reuse
            app.state.jwks_client = jwks_client

    except Exception as e:
        logger.warning(
            "⚠️  JWKS endpoint unavailable: %s. Error: %s. "
            "Falling back to HS256 with BETTER_AUTH_SECRET for JWT verification. "
            "This is acceptable for development but RS256 is recommended for production.",
            settings.better_auth_jwks_url,
            str(e),
        )
        # Check if HS256 fallback is available
        if not settings.better_auth_secret:
            logger.error(
                "❌ Neither JWKS (RS256) nor BETTER_AUTH_SECRET (HS256) is available. "
                "Set BETTER_AUTH_SECRET environment variable or ensure JWKS endpoint is accessible."
            )
            raise RuntimeError(
                "Cannot start: No JWT verification method available. "
                "Either configure JWKS endpoint or set BETTER_AUTH_SECRET environment variable."
            ) from e
        logger.info("✅ Using HS256 fallback with BETTER_AUTH_SECRET for JWT verification.")

    # Create database tables if they don't exist
    await create_db_and_tables()

    yield

    # Shutdown: Cleanup if needed
    pass


app = FastAPI(
    title="Task API",
    description="CRUD API for Task items with path-based user context and data isolation",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS for production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # From ALLOWED_ORIGINS environment variable
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel preview deployments (*.vercel.app)
    allow_credentials=True,  # Allow HttpOnly cookies and Authorization headers
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "If-Match",
        "If-None-Match",
        "ETag",
    ],
    expose_headers=["ETag", "Last-Modified"],  # Expose ETag for concurrent update detection
    max_age=600,  # Cache preflight requests for 10 minutes
)


@app.exception_handler(NotFoundError)
async def not_found_exception_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """Handle NotFoundError with 404 response."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": exc.message,
            "error_code": "NOT_FOUND",
        },
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle ValidationError with 422 response."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.message,
            "error_code": "VALIDATION_ERROR",
        },
    )


@app.exception_handler(DatabaseError)
async def database_exception_handler(request: Request, exc: DatabaseError) -> JSONResponse:
    """Handle DatabaseError with 503 response."""
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": exc.message,
            "error_code": "DATABASE_ERROR",
        },
    )


@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    """Handle database connection failures with 503 response."""
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database connection failed",
            "error_code": "DATABASE_UNAVAILABLE",
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors gracefully."""
    # Log the error in production
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "error_code": "SERVER_ERROR",
        },
    )


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


# Include API router (path-based user context)
app.include_router(v1_router)
