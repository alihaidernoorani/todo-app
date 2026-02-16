"""Response parser for extracting task operations from agent text output.

This module parses natural language agent responses to detect task operations
when function calling is not supported by the model. It extracts operations
like "Task added:", "Task updated:", etc. and returns structured data for
backend API calls.
"""

import re
import logging
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ParsedTaskOperation:
    """Represents a parsed task operation from agent response text.

    Attributes:
        operation: Type of operation ('add', 'update', 'complete', 'delete', 'list')
        task_name: Task title/name (for add operations)
        task_id: Task ID (for update/complete/delete operations)
        description: Task description (for add/update operations)
        success: Whether the operation succeeded (True if detected)
    """
    operation: str
    task_name: Optional[str] = None
    task_id: Optional[str] = None
    description: Optional[str] = None
    success: bool = True


def parse_agent_response(response_text: str) -> Optional[ParsedTaskOperation]:
    """Parse agent response text to extract task operations.

    Detects patterns like:
    - "Task added: <task_name>"
    - "Task updated: <task_name>"
    - "Task completed: <task_name>"
    - "Task deleted: <task_name>"

    Args:
        response_text: The agent's natural language response

    Returns:
        ParsedTaskOperation if a task operation is detected, None otherwise

    Examples:
        >>> parse_agent_response("Task added: Buy groceries")
        ParsedTaskOperation(operation='add', task_name='Buy groceries', success=True)

        >>> parse_agent_response("I've added 'call dentist' to your list.")
        None  # Doesn't match the exact pattern
    """
    if not response_text or not response_text.strip():
        return None

    # Pattern: "Task added: <task_name>"
    add_pattern = r"Task added:\s*(.+?)(?:\n|$)"
    match = re.search(add_pattern, response_text, re.IGNORECASE)

    if match:
        task_name = match.group(1).strip()
        # Remove surrounding quotes if present
        task_name = task_name.strip('"\'')

        logger.info(f"Parsed add_task operation: task_name='{task_name}'")

        return ParsedTaskOperation(
            operation='add',
            task_name=task_name,
            success=True
        )

    # Pattern: "Task updated: <task_name>" (for future extension)
    update_pattern = r"Task updated:\s*(.+?)(?:\n|$)"
    match = re.search(update_pattern, response_text, re.IGNORECASE)

    if match:
        task_name = match.group(1).strip().strip('"\'')
        logger.info(f"Parsed update_task operation: task_name='{task_name}'")

        return ParsedTaskOperation(
            operation='update',
            task_name=task_name,
            success=True
        )

    # Pattern: "Task completed: <task_name>" (for future extension)
    complete_pattern = r"Task completed:\s*(.+?)(?:\n|$)"
    match = re.search(complete_pattern, response_text, re.IGNORECASE)

    if match:
        task_name = match.group(1).strip().strip('"\'')
        logger.info(f"Parsed complete_task operation: task_name='{task_name}'")

        return ParsedTaskOperation(
            operation='complete',
            task_name=task_name,
            success=True
        )

    # Pattern: "Task deleted: <task_name>" (for future extension)
    delete_pattern = r"Task deleted:\s*(.+?)(?:\n|$)"
    match = re.search(delete_pattern, response_text, re.IGNORECASE)

    if match:
        task_name = match.group(1).strip().strip('"\'')
        logger.info(f"Parsed delete_task operation: task_name='{task_name}'")

        return ParsedTaskOperation(
            operation='delete',
            task_name=task_name,
            success=True
        )

    # No recognized pattern found
    return None
