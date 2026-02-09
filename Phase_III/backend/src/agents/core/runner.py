"""Agent runner wrapper for OpenAI Agents SDK.

This module provides a wrapper function around Runner.run() to execute
the agent with conversation history and context.
"""

from typing import Any, Dict, List
from agents import Runner, Agent
from agents.items import UserMessageItem, AssistantMessageItem
from backend.src.agents.core.agent import create_task_agent
import logging

logger = logging.getLogger(__name__)


async def run_agent(
    user_message: str,
    conversation_history: List[UserMessageItem | AssistantMessageItem] | None = None,
    context: Dict[str, Any] | None = None,
) -> tuple[str, Any]:
    """Run the task management agent with user message and context.

    This function wraps Runner.run() to execute the agent, handling conversation
    history and returning the agent's response.

    Args:
        user_message: The user's current message
        conversation_history: Optional list of previous messages for context
        context: Dict with mcp_client and user_id (required)

    Returns:
        tuple: (agent_response_text, full_result_object)

    Raises:
        ValueError: If context is missing mcp_client or user_id
        Exception: If agent execution fails

    Example:
        ```python
        from backend.src.agents.core.runner import run_agent

        context = {
            "mcp_client": mcp_client_instance,
            "user_id": 123,
        }

        response, result = await run_agent(
            user_message="Add a task to buy groceries",
            context=context
        )

        print(response)  # "I've added 'buy groceries' to your task list."
        ```
    """
    # Validate context
    if not context:
        raise ValueError("Context is required with mcp_client and user_id")

    if "mcp_client" not in context:
        raise ValueError("mcp_client must be provided in context")

    if "user_id" not in context:
        raise ValueError("user_id must be provided in context")

    # Create agent
    agent = create_task_agent()

    # Build message history
    if conversation_history is None:
        conversation_history = []

    # Append current user message
    from agents.items import UserMessageItem
    current_message = UserMessageItem(content=user_message)
    messages = conversation_history + [current_message]

    logger.info(f"Running agent with {len(conversation_history)} history messages + 1 new message")
    logger.info(f"User message: {user_message[:100]}...")

    try:
        # Execute agent with Runner.run()
        result = await Runner.run(agent, messages, context=context)

        # Extract response text
        response_text = result.final_output

        logger.info(f"Agent response: {response_text[:100]}...")

        return response_text, result

    except Exception as e:
        logger.error(f"Agent execution failed: {str(e)}")
        raise


async def run_agent_with_streaming(
    user_message: str,
    conversation_history: List[UserMessageItem | AssistantMessageItem] | None = None,
    context: Dict[str, Any] | None = None,
):
    """Run the agent with streaming responses (for future use).

    This function uses Runner.run_streamed() to yield agent responses as they
    are generated, enabling real-time UI updates.

    Args:
        user_message: The user's current message
        conversation_history: Optional list of previous messages for context
        context: Dict with mcp_client and user_id (required)

    Yields:
        Event objects with streaming response data

    Example:
        ```python
        async for event in run_agent_with_streaming("Add task", context=ctx):
            if hasattr(event, "text"):
                print(event.text, end="", flush=True)
        ```
    """
    # Validate context
    if not context:
        raise ValueError("Context is required with mcp_client and user_id")

    if "mcp_client" not in context:
        raise ValueError("mcp_client must be provided in context")

    if "user_id" not in context:
        raise ValueError("user_id must be provided in context")

    # Create agent
    agent = create_task_agent()

    # Build message history
    if conversation_history is None:
        conversation_history = []

    # Append current user message
    from agents.items import UserMessageItem
    current_message = UserMessageItem(content=user_message)
    messages = conversation_history + [current_message]

    logger.info(f"Running agent with streaming, {len(conversation_history)} history messages")

    try:
        # Execute agent with streaming
        async for event in Runner.run_streamed(agent, messages, context=context):
            yield event

    except Exception as e:
        logger.error(f"Agent streaming failed: {str(e)}")
        raise
