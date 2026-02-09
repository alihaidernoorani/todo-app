"""FastAPI routes for agent chat endpoint.

This module exposes the POST /api/v1/agent/chat endpoint for interacting
with the AI agent using natural language.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from backend.src.agents.api.schemas import AgentChatRequest, AgentChatResponse
from backend.src.agents.api.agent_handler import AgentRequestHandler
from backend.src.agents.api.serializers import format_error_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["agent"])


@router.post("/{user_id}/chat", response_model=AgentChatResponse, status_code=status.HTTP_200_OK)
async def agent_chat(user_id: int, request: AgentChatRequest) -> AgentChatResponse:
    """Process a chat message through the AI agent.

    This endpoint receives a user message, processes it through the OpenAI Agents SDK,
    calls appropriate MCP tools, and returns a natural language response.

    **Flow:**
    1. Load conversation history from database
    2. Execute agent with Runner.run() and MCP tools
    3. Persist user message and agent response to database
    4. Return agent response

    **Args:**
        request: AgentChatRequest containing user_id, message, and optional conversation_id

    **Returns:**
        AgentChatResponse with agent's response and message IDs

    **Raises:**
        HTTPException 400: Invalid request (missing user_id, empty message)
        HTTPException 401: Unauthorized (invalid JWT - handled by auth middleware)
        HTTPException 403: Forbidden (conversation belongs to different user)
        HTTPException 500: Internal server error (agent execution failed)

    **Example:**
        ```bash
        curl -X POST "http://localhost:8000/api/v1/agent/chat" \\
          -H "Content-Type: application/json" \\
          -H "Authorization: Bearer <JWT_TOKEN>" \\
          -d '{
            "user_id": 123,
            "message": "Create a task to buy groceries",
            "conversation_id": null
          }'
        ```

    **Response:**
        ```json
        {
          "conversation_id": 1,
          "user_message_id": 1,
          "agent_message_id": 2,
          "agent_response": "I've added 'buy groceries' to your task list.",
          "tool_calls": null
        }
        ```
    """
    logger.info(
        f"Agent chat request: user_id={user_id}, "
        f"conversation_id={request.conversation_id}"
    )

    try:
        # Validate request
        if not user_id or user_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id must be a positive integer"
            )

        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="message cannot be empty"
            )

        # Process request through agent handler
        handler = AgentRequestHandler()
        response = await handler.process_chat_request(user_id, request)

        logger.info(f"Agent chat completed: conversation_id={response.conversation_id}")
        return response

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except ValueError as e:
        # Validation errors
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        # Unexpected errors
        logger.error(f"Agent chat failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                "Agent is currently unavailable. Please try again later.",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint for agent service.

    Returns:
        Simple status message indicating service is running
    """
    return {"status": "healthy", "service": "agent-chat"}
