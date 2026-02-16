"""Conversation history management for OpenAI Agents SDK.

This module provides helper functions to build conversation history from database
messages into the dictionary format required by the SDK.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from src.agents.config.agent_config import MAX_HISTORY_MESSAGES, MAX_HISTORY_MINUTES
import logging

logger = logging.getLogger(__name__)


def build_conversation_history(
    messages: List[dict],
    max_messages: int = MAX_HISTORY_MESSAGES,
    max_minutes: int = MAX_HISTORY_MINUTES,
) -> List[Dict[str, Any]]:
    """Build conversation history from database messages.

    Converts database message records into SDK message items, applying
    time and count limits to prevent context overload.

    Args:
        messages: List of message dicts with 'role', 'content', 'created_at' fields
        max_messages: Maximum number of messages to include (default: 20)
        max_minutes: Only include messages from last N minutes (default: 60)

    Returns:
        List of message dictionaries with 'role' and 'content' keys

    Example:
        ```python
        db_messages = [
            {"role": "user", "content": "Hi", "created_at": "2025-01-01T12:00:00"},
            {"role": "assistant", "content": "Hello!", "created_at": "2025-01-01T12:00:05"},
        ]
        history = build_conversation_history(db_messages)
        # Returns: [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello!"}]
        ```
    """
    if not messages:
        return []

    # Filter by time window
    cutoff_time = datetime.utcnow() - timedelta(minutes=max_minutes)
    recent_messages = [
        msg for msg in messages
        if datetime.fromisoformat(msg["created_at"].replace("Z", "+00:00")) > cutoff_time
    ]

    # Limit by count (take most recent)
    limited_messages = recent_messages[-max_messages:]

    # Convert to SDK message format (plain dictionaries)
    history = []
    for msg in limited_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role in ["user", "assistant"]:
            history.append({"role": role, "content": content})
        else:
            logger.warning(f"Unknown message role: {role}, treating as user message")
            history.append({"role": "user", "content": content})

    logger.info(f"Built conversation history: {len(history)} messages from {len(messages)} total")
    return history


def create_user_message(content: str) -> Dict[str, str]:
    """Create a single user message dictionary.

    Args:
        content: User message text

    Returns:
        Dictionary with 'role' and 'content' for use with Runner.run()

    Example:
        ```python
        user_msg = create_user_message("Add a task to buy groceries")
        result = await Runner.run(agent, user_msg, context=ctx)
        ```
    """
    return {"role": "user", "content": content}


def create_assistant_message(content: str) -> Dict[str, str]:
    """Create a single assistant message dictionary.

    Args:
        content: Assistant response text

    Returns:
        Dictionary with 'role' and 'content' for conversation history

    Example:
        ```python
        history = [
            create_user_message("Hi"),
            create_assistant_message("Hello! How can I help?"),
        ]
        ```
    """
    return {"role": "assistant", "content": content}


def append_to_history(
    history: List[Dict[str, Any]],
    message: Dict[str, str],
) -> List[Dict[str, Any]]:
    """Append a message to existing conversation history.

    Args:
        history: Existing conversation history
        message: New message to append

    Returns:
        Updated conversation history

    Example:
        ```python
        history = build_conversation_history(db_messages)
        new_msg = create_user_message("What tasks do I have?")
        updated_history = append_to_history(history, new_msg)
        ```
    """
    return history + [message]
