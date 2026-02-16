"""Agent request handler for processing chat messages.

This module handles incoming agent chat requests by:
1. Getting or creating a conversation (DB-backed)
2. Loading conversation history from database
3. Persisting the user message
4. Executing the agent with MCP tools
5. Persisting the assistant response
6. Returning the complete AgentChatResponse
"""

import logging
from sqlmodel.ext.asyncio.session import AsyncSession

from src.agents.core.conversation_handler import build_conversation_history
from src.agents.core.runner import run_agent, AgentRunResult
from src.agents.api.schemas import AgentChatRequest, AgentChatResponse, ToolCallInfo
from src.config import get_settings
from src.mcp.client.backend_client import BackendClient
from src.services.conversation_service import get_or_create_conversation
from src.services.message_service import load_conversation_history, persist_message

logger = logging.getLogger(__name__)


class AgentRequestHandler:
    """Handles agent chat requests by coordinating DB services and Runner.run() execution."""

    def __init__(self, backend_base_url: str = None):
        """Initialize handler with backend client configuration.

        Args:
            backend_base_url: Base URL for backend API (default: from Settings)
        """
        self.backend_base_url = backend_base_url or get_settings().backend_base_url

    async def process_chat_request(
        self,
        user_id: str,
        request: AgentChatRequest,
        db: AsyncSession,
        token: str = None,
    ) -> AgentChatResponse:
        """Process an agent chat request following the stateless request cycle.

        Args:
            user_id: Authenticated user ID from JWT (str, validated by auth dep)
            request: AgentChatRequest with message and optional conversation_id
            db: Async database session (injected by FastAPI dependency)

        Returns:
            AgentChatResponse with agent_response, tool_calls, and message IDs

        Raises:
            HTTPException(403): conversation belongs to another user
            HTTPException(404): conversation_id not found
            Exception: If agent execution fails
        """
        logger.info(
            f"Processing chat request: user_id={user_id}, "
            f"conversation_id={request.conversation_id}, "
            f"message={request.message[:50]}..."
        )

        # [3] Get or create conversation
        conversation = await get_or_create_conversation(db, user_id, request.conversation_id)

        # Cache conversation.id to avoid lazy-load after SQLAlchemy expires the object
        conversation_id = conversation.id

        # [4] Load conversation history from DB (last 20, oldest-first)
        raw_messages = await load_conversation_history(db, conversation_id)
        conversation_history = build_conversation_history(raw_messages)

        # [5] Persist user message BEFORE running agent
        user_msg_id = await persist_message(
            db, conversation_id, user_id, "user", request.message
        )

        # [6] + [7] Run agent with MCP tools
        async with BackendClient(self.backend_base_url, token=token) as mcp_client:
            context = {"mcp_client": mcp_client, "user_id": user_id}
            run_result: AgentRunResult = await run_agent(
                user_message=request.message,
                conversation_history=conversation_history,
                context=context,
            )

        # [9] Persist assistant response
        agent_msg_id = await persist_message(
            db, conversation_id, user_id, "assistant", run_result.response_text
        )

        logger.info(
            f"Chat request processed: conversation_id={conversation_id}, "
            f"tool_calls={len(run_result.tool_calls)}"
        )

        # [10] Return complete response
        return AgentChatResponse(
            conversation_id=conversation_id,
            user_message_id=user_msg_id,
            agent_message_id=agent_msg_id,
            agent_response=run_result.response_text,
            tool_calls=[
                ToolCallInfo(
                    tool_name=tc["tool_name"],
                    arguments=tc["arguments"],
                    result=tc["result"],
                )
                for tc in run_result.tool_calls
            ],
        )
