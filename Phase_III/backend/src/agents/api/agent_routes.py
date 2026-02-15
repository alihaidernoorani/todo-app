"""FastAPI routes for agent chat endpoint.

Exposes POST /api/v1/agent/{user_id}/chat with JWT auth and DB session injection.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from src.agents.api.agent_handler import AgentRequestHandler
from src.agents.api.schemas import AgentChatRequest, AgentChatResponse
from src.agents.api.serializers import format_error_response
from src.auth.dependencies import get_current_user_with_path_validation
from src.auth.models import AuthenticatedUser
from src.api.deps import get_session

logger = logging.getLogger(__name__)

router = APIRouter(tags=["agent"])


@router.post("/{user_id}/chat", response_model=AgentChatResponse, status_code=status.HTTP_200_OK)
async def agent_chat(
    user_id: str,
    request: AgentChatRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)],
    db: Annotated[AsyncSession, Depends(get_session)],
) -> AgentChatResponse:
    """Process a natural language task management request via the AI agent.

    **Auth**: Bearer JWT required. JWT sub must equal path {user_id}.

    **Flow**:
    1. JWT validated + path user_id matched by get_current_user_with_path_validation
    2. Request body validated (message non-empty)
    3. Conversation created/fetched from DB
    4. History loaded, user message persisted
    5. Agent run with MCP tools
    6. Assistant response persisted
    7. Full response returned

    Raises:
        HTTPException(400): Empty or whitespace-only message
        HTTPException(401): Missing or invalid JWT
        HTTPException(403): JWT sub != path user_id, or conversation ownership mismatch
        HTTPException(404): conversation_id not found
        HTTPException(500): Agent execution failure
    """
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="message cannot be empty",
        )

    try:
        handler = AgentRequestHandler()
        return await handler.process_chat_request(user_id, request, db)

    except HTTPException:
        raise  # Re-raise 403/404 from conversation_service

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    except Exception as e:
        logger.error(f"Agent chat failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                "Agent is currently unavailable. Please try again later.",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            ),
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint for agent service."""
    return {"status": "healthy", "service": "agent-chat"}
