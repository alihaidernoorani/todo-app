"""Agent runner wrapper for OpenAI Agents SDK.

This module provides a wrapper function around Runner.run() to execute
the agent with conversation history and context, returning both the
response text and any tool calls made during the run.
"""

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List

from agents import Runner
from agents.items import ToolCallItem, ToolCallOutputItem

from src.agents.core.agent import create_task_agent
import logging

logger = logging.getLogger(__name__)


@dataclass
class AgentRunResult:
    """Result of a single agent run.

    Attributes:
        response_text: The agent's final natural language response
        tool_calls: List of tool calls made during the run (empty if none)
    """
    response_text: str
    tool_calls: list[dict] = field(default_factory=list)


async def run_agent(
    user_message: str,
    conversation_history: List[Dict[str, str]] | None = None,
    context: Dict[str, Any] | None = None,
) -> AgentRunResult:
    """Run the task management agent with user message and context.

    Executes the agent using Runner.run(), extracts tool calls from
    result.new_items, and returns an AgentRunResult with both the
    response text and the tool call list.

    Args:
        user_message: The user's current message
        conversation_history: Optional list of previous messages for context
        context: Dict with mcp_client and user_id (required)

    Returns:
        AgentRunResult with response_text and tool_calls list

    Raises:
        ValueError: If context is missing mcp_client or user_id
        Exception: If agent execution fails
    """
    if not context:
        raise ValueError("Context is required with mcp_client and user_id")

    if "mcp_client" not in context:
        raise ValueError("mcp_client must be provided in context")

    if "user_id" not in context:
        raise ValueError("user_id must be provided in context")

    agent = create_task_agent()
    history = conversation_history or []

    # Append current user message — confirmed SDK format
    messages = history + [{"role": "user", "content": user_message}]

    logger.info(f"Running agent: {len(history)} history messages + current message")

    result = await Runner.run(agent, messages, context=context)

    # Extract tool calls from result.new_items using SDK-confirmed isinstance checks
    tool_calls = []
    for item in result.new_items:
        if isinstance(item, ToolCallItem):
            raw_args = item.raw_item.arguments or "{}"
            try:
                parsed_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            except (json.JSONDecodeError, TypeError):
                parsed_args = {"raw": str(raw_args)}
            tool_calls.append({
                "tool_name": item.raw_item.name,
                "arguments": parsed_args,
                "result": {},
            })
        elif isinstance(item, ToolCallOutputItem) and tool_calls:
            # item.output is a str — parse JSON if possible
            output = item.output
            try:
                tool_calls[-1]["result"] = json.loads(output) if isinstance(output, str) else output
            except (json.JSONDecodeError, TypeError):
                tool_calls[-1]["result"] = {"output": str(output)}

    logger.info(
        f"Agent complete: response={result.final_output[:80]!r}, tool_calls={len(tool_calls)}"
    )

    return AgentRunResult(
        response_text=result.final_output,
        tool_calls=tool_calls,
    )
