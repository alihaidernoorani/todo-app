"""API router aggregator with path-based user context."""

from fastapi import APIRouter

from src.api.v1.auth import router as auth_router
from src.api.v1.tasks import router as tasks_router
from src.agents.api.agent_routes import router as agent_router

router = APIRouter(prefix="/api")

# Include auth test endpoints
router.include_router(auth_router, tags=["Authentication"])

# Include tasks router with user_id path parameter
# Routes will be: /api/{user_id}/tasks, /api/{user_id}/tasks/{id}, etc.
router.include_router(tasks_router, prefix="/{user_id}/tasks", tags=["Tasks"])

# Include agent chat router
# Route will be: /api/{user_id}/chat
router.include_router(agent_router, tags=["Agent"])
