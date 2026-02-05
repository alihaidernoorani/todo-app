"""FastAPI application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from src.api.v1.router import router as v1_router
from src.config import get_settings
from src.database import create_db_and_tables
from src.exceptions import DatabaseError, NotFoundError, ValidationError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application lifespan handler."""
    # Startup: Create tables if they don't exist
    await create_db_and_tables()
    yield
    # Shutdown: Cleanup if needed


app = FastAPI(
    title="Task API",
    description="CRUD API for Task items with path-based user context and data isolation",
    version="2.0.0",
    lifespan=lifespan,
)

# Load settings for environment-driven configuration
settings = get_settings()

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
