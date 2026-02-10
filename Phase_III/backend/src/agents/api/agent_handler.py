"""Agent request handler for processing chat messages.

This module handles incoming agent chat requests by:
1. Loading conversation history from database
2. Building SDK message items
3. Executing agent with Runner.run()
4. Persisting messages to database
"""

from typing import List, Dict, Any, Optional
from src.agents.core.agent import create_task_agent
from src.agents.core.conversation_handler import (
    build_conversation_history,
    create_user_message,
)
from src.agents.core.runner import run_agent
from src.agents.api.schemas import AgentChatRequest, AgentChatResponse
from src.mcp.client.backend_client import BackendClient
from src.agents.config.agent_config import OPENROUTER_BASE_URL
import logging
import os

logger = logging.getLogger(__name__)


class AgentRequestHandler:
    """Handles agent chat requests by coordinating Runner.run() execution."""

    def __init__(self, backend_base_url: str = None):
        """Initialize handler with backend client configuration.

        Args:
            backend_base_url: Base URL for backend API (default: from env or localhost)
        """
        self.backend_base_url = backend_base_url or os.getenv(
            "BACKEND_BASE_URL", "http://localhost:8000"
        )

    async def process_chat_request(
        self, user_id: int, request: AgentChatRequest
    ) -> AgentChatResponse:
        """Process an agent chat request.

        Args:
            user_id: User ID from path parameter
            request: AgentChatRequest with message and conversation_id

        Returns:
            AgentChatResponse with agent response and message IDs

        Raises:
            ValueError: If MCP client connection fails
            Exception: If agent execution fails
        """
        logger.info(
            f"Processing chat request: user_id={user_id}, "
            f"conversation_id={request.conversation_id}, "
            f"message={request.message[:50]}..."
        )

        # Initialize MCP client (connects to backend API)
        async with BackendClient(self.backend_base_url) as mcp_client:
            # Load conversation history from database
            conversation_history = await self._load_conversation_history(
                mcp_client, request.conversation_id
            )

            # Build context for agent
            context = {
                "mcp_client": mcp_client,
                "user_id": user_id,
            }

            # Execute agent with Runner.run()
            agent_response, result = await run_agent(
                user_message=request.message,
                conversation_history=conversation_history,
                context=context,
            )

            # Persist user message and agent response to database
            conversation_id, user_msg_id, agent_msg_id = await self._persist_messages(
                mcp_client,
                request.conversation_id,
                request.message,
                agent_response,
            )

            # Build response
            response = AgentChatResponse(
                conversation_id=conversation_id,
                user_message_id=user_msg_id,
                agent_message_id=agent_msg_id,
                agent_response=agent_response,
                tool_calls=None,  # Optional: extract from result if needed
            )

            logger.info(
                f"Chat request processed successfully: conversation_id={conversation_id}"
            )

            return response

    async def _load_conversation_history(
        self,
        mcp_client: BackendClient,
        conversation_id: Optional[int],
    ) -> List:
        """Load conversation history from database via MCP client.

        Args:
            mcp_client: Backend API client
            conversation_id: Conversation ID (None for new conversation)

        Returns:
            List of message dictionaries with 'role' and 'content' keys
        """
        if not conversation_id:
            logger.info("New conversation - no history to load")
            return []

        # TODO: Load messages from database via MCP client or direct API call
        # For now, return empty history (will be implemented when database service is ready)
        logger.info(f"Loading conversation history for conversation_id={conversation_id}")

        # Example structure (to be implemented):
        # messages = await mcp_client.get_conversation_messages(conversation_id, user_id)
        # return build_conversation_history(messages)

        return []

    async def _persist_messages(
        self,
        mcp_client: BackendClient,
        conversation_id: Optional[int],
        user_message: str,
        agent_response: str,
    ) -> tuple[int, int, int]:
        """Persist user message and agent response to database.

        Args:
            mcp_client: Backend API client
            conversation_id: Existing conversation ID or None
            user_message: User's message text
            agent_response: Agent's response text

        Returns:
            Tuple of (conversation_id, user_message_id, agent_message_id)
        """
        # TODO: Persist messages to database via MCP client or direct API call
        # For now, return mock IDs (will be implemented when database service is ready)
        logger.info("Persisting messages to database")

        # Example structure (to be implemented):
        # if not conversation_id:
        #     conversation_id = await mcp_client.create_conversation(user_id)
        # user_msg_id = await mcp_client.create_message(conversation_id, "user", user_message)
        # agent_msg_id = await mcp_client.create_message(conversation_id, "assistant", agent_response)

        # Mock IDs for now
        conversation_id = conversation_id or 1
        user_msg_id = 1
        agent_msg_id = 2

        return conversation_id, user_msg_id, agent_msg_id
