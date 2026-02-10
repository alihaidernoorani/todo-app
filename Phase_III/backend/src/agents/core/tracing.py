"""Tracing and observability for OpenAI Agents SDK.

This module configures agent tracing for debugging and monitoring.
"""

from openai.agents import enable_tracing, set_trace_handler
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


def setup_agent_tracing(enable: bool = True, custom_handler: bool = True):
    """Enable agent tracing for observability.

    Args:
        enable: Whether to enable tracing (default: True)
        custom_handler: Whether to use custom trace handler (default: True)
    """
    if not enable:
        logger.info("Agent tracing disabled")
        return

    # Enable SDK tracing
    enable_tracing()
    logger.info("✅ Agent tracing enabled")

    if custom_handler:
        set_trace_handler(log_trace_handler)
        logger.info("✅ Custom trace handler configured")


def log_trace_handler(trace):
    """Custom trace handler that logs trace events.

    Args:
        trace: Trace object from OpenAI Agents SDK
    """
    trace_info = {
        "name": trace.name,
        "duration_ms": getattr(trace, "duration_ms", None),
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Log trace event
    logger.info(f"Agent Trace: {json.dumps(trace_info)}")

    # Log detailed trace for debugging (in development)
    if hasattr(trace, "details"):
        logger.debug(f"Trace Details: {json.dumps(trace.details, default=str)}")


def log_tool_invocation(tool_name: str, arguments: dict, result: dict, duration_ms: float):
    """Log tool invocation for debugging.

    Args:
        tool_name: Name of the tool called
        arguments: Tool input arguments
        result: Tool output result
        duration_ms: Execution duration in milliseconds
    """
    log_entry = {
        "event": "tool_invocation",
        "tool": tool_name,
        "arguments": arguments,
        "result_summary": {k: str(v)[:100] for k, v in result.items()} if result else None,
        "duration_ms": duration_ms,
        "timestamp": datetime.utcnow().isoformat(),
    }

    logger.info(f"Tool Invocation: {json.dumps(log_entry)}")


def log_agent_execution(user_id: int, message: str, response: str, duration_ms: float):
    """Log agent execution for monitoring.

    Args:
        user_id: User ID
        message: User message
        response: Agent response
        duration_ms: Execution duration in milliseconds
    """
    log_entry = {
        "event": "agent_execution",
        "user_id": user_id,
        "message": message[:100],  # Truncate for privacy
        "response": response[:100],  # Truncate for logs
        "duration_ms": duration_ms,
        "timestamp": datetime.utcnow().isoformat(),
    }

    logger.info(f"Agent Execution: {json.dumps(log_entry)}")
