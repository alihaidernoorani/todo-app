"""Agent request handler for processing chat messages (hybrid mode).

This module handles incoming agent chat requests by:
1. Getting or creating a conversation (DB-backed)
2. Loading conversation history from database
3. Persisting the user message
4. Executing the agent (hybrid mode: text-parsing for add_task, function calling for others)
5. Collecting tool calls from agent execution (list/complete/update/delete)
6. Parsing agent response for add_task operations
7. Calling backend API directly for parsed add_task operations
8. Persisting the assistant response
9. Returning the complete AgentChatResponse with all tool calls
"""

import logging
from sqlmodel.ext.asyncio.session import AsyncSession

from src.agents.core.conversation_handler import build_conversation_history
from src.agents.core.runner import run_agent, AgentRunResult
from src.agents.core.response_parser import parse_agent_response, ParsedTaskOperation
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

        # [6] + [7] Run agent with MCP tools (hybrid mode)
        async with BackendClient(self.backend_base_url, token=token) as mcp_client:
            context = {"mcp_client": mcp_client, "user_id": user_id}
            run_result: AgentRunResult = await run_agent(
                user_message=request.message,
                conversation_history=conversation_history,
                context=context,
            )

        # [8] Collect tool calls from agent execution (list/complete/update/delete operations)
        all_tool_calls = list(run_result.tool_calls)  # Copy tool calls from function calling

        # [9] Parse agent response for add_task operation (text-parsing fallback)
        parsed_op = parse_agent_response(run_result.response_text)

        if parsed_op and parsed_op.operation == 'add':
            # [10] Execute backend API call for add_task operation
            logger.info(
                f"Detected add_task operation from response: task_name='{parsed_op.task_name}'"
            )

            try:
                async with BackendClient(self.backend_base_url, token=token) as backend_client:
                    result = await backend_client.create_task(
                        user_id=user_id,
                        title=parsed_op.task_name,
                        description=None,
                    )

                    logger.info(f"Backend API call successful: task_id={result.get('id')}")

                    # Add to tool calls list
                    all_tool_calls.append({
                        "tool_name": "add_task",
                        "arguments": {"title": parsed_op.task_name},
                        "result": result,
                    })

            except Exception as e:
                logger.error(f"Backend API call failed: {str(e)}", exc_info=True)
                # Continue anyway - the agent's response will be returned

        # [11] Persist assistant response
        agent_msg_id = await persist_message(
            db, conversation_id, user_id, "assistant", run_result.response_text
        )

        logger.info(
            f"Chat request processed: conversation_id={conversation_id}, "
            f"tool_calls_from_agent={len(run_result.tool_calls)}, "
            f"parsed_operations={1 if parsed_op else 0}, "
            f"total_tool_calls={len(all_tool_calls)}"
        )

        # [12] Return complete response with all tool calls
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
                for tc in all_tool_calls
            ],
        )
