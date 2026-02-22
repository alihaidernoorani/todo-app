"""API router aggregator with path-based user context."""

from fastapi import APIRouter

from src.api.v1.auth import router as auth_router
from src.api.v1.notifications import router as notifications_router
from src.api.v1.recurring import router as recurring_router
from src.api.v1.reminders import router as reminders_router
from src.api.v1.tags import router as tags_router
from src.api.v1.tasks import router as tasks_router
from src.agents.api.agent_routes import router as agent_router

router = APIRouter(prefix="/api")

# Include auth test endpoints
router.include_router(auth_router, tags=["Authentication"])

# Include tasks router with user_id path parameter
# Routes will be: /api/{user_id}/tasks, /api/{user_id}/tasks/{id}, etc.
router.include_router(tasks_router, prefix="/{user_id}/tasks", tags=["Tasks"])

# Include recurring tasks router
# Routes will be: /api/{user_id}/recurring
router.include_router(recurring_router, prefix="/{user_id}/recurring", tags=["Recurring Tasks"])

# Include reminders router
# Routes will be: /api/{user_id}/reminders
router.include_router(reminders_router, prefix="/{user_id}/reminders", tags=["Reminders"])

# Include tags router
# Routes will be: /api/{user_id}/tags
router.include_router(tags_router, prefix="/{user_id}/tags", tags=["Tags"])

# Include notifications proxy router
# Routes will be: /api/{user_id}/notifications
router.include_router(notifications_router, prefix="/{user_id}/notifications", tags=["Notifications"])

# Include agent chat router
# Routes will be: /api/{user_id}/chat, /api/agent/health
router.include_router(agent_router, tags=["Agent"])
