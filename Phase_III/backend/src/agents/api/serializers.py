"""Response serialization helpers for agent API.

Note: FastAPI handles Pydantic serialization automatically, so these
helpers are optional and mainly for consistency/debugging.
"""

from typing import Dict, Any
from src.agents.api.schemas import AgentChatResponse
import datetime


def format_agent_response(response: AgentChatResponse) -> Dict[str, Any]:
    """Convert AgentChatResponse to dict (FastAPI does this automatically).

    Args:
        response: AgentChatResponse object

    Returns:
        Dictionary representation of the response
    """
    return {
        "conversation_id": response.conversation_id,
        "user_message_id": response.user_message_id,
        "agent_message_id": response.agent_message_id,
        "agent_response": response.agent_response,
        "tool_calls": response.tool_calls,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


def format_error_response(error_message: str, status_code: int = 500) -> Dict[str, Any]:
    """Format error response for consistent error handling.

    Args:
        error_message: Error message to return
        status_code: HTTP status code

    Returns:
        Formatted error response dict
    """
    return {
        "detail": error_message,
        "status_code": status_code,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
