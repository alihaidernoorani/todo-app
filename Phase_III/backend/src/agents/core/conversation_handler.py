"""Conversation history management for OpenAI Agents SDK.

This module provides helper functions to build conversation history from database
messages into UserMessageItem and AssistantMessageItem format required by the SDK.
"""

from typing import List
from agents.items import UserMessageItem, AssistantMessageItem
from datetime import datetime, timedelta
from src.agents.config.agent_config import MAX_HISTORY_MESSAGES, MAX_HISTORY_MINUTES
import logging

logger = logging.getLogger(__name__)


def build_conversation_history(
    messages: List[dict],
    max_messages: int = MAX_HISTORY_MESSAGES,
    max_minutes: int = MAX_HISTORY_MINUTES,
) -> List[UserMessageItem | AssistantMessageItem]:
    """Build conversation history from database messages.

    Converts database message records into SDK message items, applying
    time and count limits to prevent context overload.

    Args:
        messages: List of message dicts with 'role', 'content', 'created_at' fields
        max_messages: Maximum number of messages to include (default: 20)
        max_minutes: Only include messages from last N minutes (default: 60)

    Returns:
        List of UserMessageItem and AssistantMessageItem objects for SDK

    Example:
        ```python
        db_messages = [
            {"role": "user", "content": "Hi", "created_at": "2025-01-01T12:00:00"},
            {"role": "assistant", "content": "Hello!", "created_at": "2025-01-01T12:00:05"},
        ]
        history = build_conversation_history(db_messages)
        # Returns: [UserMessageItem(...), AssistantMessageItem(...)]
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

    # Convert to SDK message items
    history = []
    for msg in limited_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "user":
            history.append(UserMessageItem(content=content))
        elif role == "assistant":
            history.append(AssistantMessageItem(content=content))
        else:
            logger.warning(f"Unknown message role: {role}, treating as user message")
            history.append(UserMessageItem(content=content))

    logger.info(f"Built conversation history: {len(history)} messages from {len(messages)} total")
    return history


def create_user_message(content: str) -> UserMessageItem:
    """Create a single user message item.

    Args:
        content: User message text

    Returns:
        UserMessageItem for use with Runner.run()

    Example:
        ```python
        user_msg = create_user_message("Add a task to buy groceries")
        result = await Runner.run(agent, user_msg, context=ctx)
        ```
    """
    return UserMessageItem(content=content)


def create_assistant_message(content: str) -> AssistantMessageItem:
    """Create a single assistant message item.

    Args:
        content: Assistant response text

    Returns:
        AssistantMessageItem for conversation history

    Example:
        ```python
        history = [
            create_user_message("Hi"),
            create_assistant_message("Hello! How can I help?"),
        ]
        ```
    """
    return AssistantMessageItem(content=content)


def append_to_history(
    history: List[UserMessageItem | AssistantMessageItem],
    message: UserMessageItem | AssistantMessageItem,
) -> List[UserMessageItem | AssistantMessageItem]:
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
