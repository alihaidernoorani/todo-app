"""MCP Server entry point for task management tools.

This module initializes the Model Context Protocol server and registers
all task management tools. The server is stateless and delegates all
operations to the FastAPI backend via REST API.

Usage:
    python -m src.mcp.server
"""

import asyncio
import logging
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from src.mcp.client.backend_client import BackendClient, BackendClientError
from src.mcp.config import get_config
from src.mcp.schemas.task_schemas import (
    AddTaskInput,
    AddTaskOutput,
    CompleteTaskInput,
    CompleteTaskOutput,
    DeleteTaskInput,
    DeleteTaskOutput,
    ListTasksInput,
    ListTasksOutput,
    TaskResponse,
    UpdateTaskInput,
    UpdateTaskOutput,
)

# Load configuration
config = get_config()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config.mcp_debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize MCP server
app = Server("task-management-mcp")

logger.info(f"MCP Server initialized with backend URL: {config.backend_url}")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List all available MCP tools.

    Returns:
        List of Tool definitions with names, descriptions, and input schemas.
    """
    return [
        Tool(
            name="add_task",
            description=(
                "Create a new task for a user. Requires user_id, title (max 255 chars), "
                "and optional description (max 2000 chars). Returns task_id, title, "
                "status, and created_at timestamp."
            ),
            inputSchema=AddTaskInput.model_json_schema(),
        ),
        Tool(
            name="list_tasks",
            description=(
                "Retrieve all tasks for a user with optional status filtering. "
                "Requires user_id and optional status filter ('all', 'pending', 'completed'). "
                "Returns array of task objects with full details."
            ),
            inputSchema=ListTasksInput.model_json_schema(),
        ),
        Tool(
            name="complete_task",
            description=(
                "Mark a task as completed. Requires user_id and task_id (UUID). "
                "Returns updated task with status set to 'completed'."
            ),
            inputSchema=CompleteTaskInput.model_json_schema(),
        ),
        Tool(
            name="update_task",
            description=(
                "Update task title and/or description. Requires user_id, task_id (UUID), "
                "and at least one of: title (max 255 chars) or description (max 2000 chars). "
                "Returns updated task object."
            ),
            inputSchema=UpdateTaskInput.model_json_schema(),
        ),
        Tool(
            name="delete_task",
            description=(
                "Delete a task permanently. Requires user_id and task_id (UUID). "
                "Returns success confirmation message."
            ),
            inputSchema=DeleteTaskInput.model_json_schema(),
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute an MCP tool by name.

    Args:
        name: Tool name (add_task, list_tasks, complete_task, update_task, delete_task)
        arguments: Tool-specific parameters as dict

    Returns:
        List of TextContent with tool execution results (JSON format)

    Raises:
        ValueError: If tool name is invalid
        BackendClientError: If backend operation fails
    """
    logger.info(f"Tool invocation: {name} with arguments: {arguments}")

    try:
        async with BackendClient(config.backend_url, config.request_timeout) as client:
            if name == "add_task":
                return await _handle_add_task(client, arguments)
            elif name == "list_tasks":
                return await _handle_list_tasks(client, arguments)
            elif name == "complete_task":
                return await _handle_complete_task(client, arguments)
            elif name == "update_task":
                return await _handle_update_task(client, arguments)
            elif name == "delete_task":
                return await _handle_delete_task(client, arguments)
            else:
                raise ValueError(f"Unknown tool: {name}")

    except BackendClientError as e:
        logger.error(f"Backend error in {name}: {e.message}")
        error_response = {
            "error": e.message,
            "status_code": e.status_code,
        }
        return [TextContent(type="text", text=str(error_response))]
    except Exception as e:
        logger.error(f"Unexpected error in {name}: {e}", exc_info=True)
        error_response = {
            "error": f"Internal server error: {str(e)}",
            "status_code": 500,
        }
        return [TextContent(type="text", text=str(error_response))]


async def _handle_add_task(
    client: BackendClient,
    arguments: dict[str, Any],
) -> list[TextContent]:
    """Handle add_task tool execution."""
    input_data = AddTaskInput(**arguments)
    result = await client.create_task(
        user_id=input_data.user_id,
        title=input_data.title,
        description=input_data.description,
    )

    output = AddTaskOutput(
        task_id=result["id"],
        title=result["title"],
        status="pending" if not result["is_completed"] else "completed",
        created_at=result["created_at"],
    )

    return [TextContent(type="text", text=output.model_dump_json())]


async def _handle_list_tasks(
    client: BackendClient,
    arguments: dict[str, Any],
) -> list[TextContent]:
    """Handle list_tasks tool execution."""
    input_data = ListTasksInput(**arguments)
    result = await client.list_tasks(
        user_id=input_data.user_id,
        status=input_data.status,
    )

    # Transform backend response to MCP output schema
    tasks = [
        TaskResponse(
            task_id=task["id"],
            title=task["title"],
            description=task.get("description"),
            status="pending" if not task["is_completed"] else "completed",
            priority=task["priority"],
            created_at=task["created_at"],
        )
        for task in result["items"]
    ]

    output = ListTasksOutput(tasks=tasks)
    return [TextContent(type="text", text=output.model_dump_json())]


async def _handle_complete_task(
    client: BackendClient,
    arguments: dict[str, Any],
) -> list[TextContent]:
    """Handle complete_task tool execution."""
    input_data = CompleteTaskInput(**arguments)
    result = await client.complete_task(
        user_id=input_data.user_id,
        task_id=input_data.task_id,
    )

    output = CompleteTaskOutput(
        task_id=result["id"],
        title=result["title"],
        status="completed" if result["is_completed"] else "pending",
    )

    return [TextContent(type="text", text=output.model_dump_json())]


async def _handle_update_task(
    client: BackendClient,
    arguments: dict[str, Any],
) -> list[TextContent]:
    """Handle update_task tool execution."""
    input_data = UpdateTaskInput(**arguments)
    result = await client.update_task(
        user_id=input_data.user_id,
        task_id=input_data.task_id,
        title=input_data.title,
        description=input_data.description,
    )

    output = UpdateTaskOutput(
        task_id=result["id"],
        title=result["title"],
        description=result.get("description"),
        status="pending" if not result["is_completed"] else "completed",
    )

    return [TextContent(type="text", text=output.model_dump_json())]


async def _handle_delete_task(
    client: BackendClient,
    arguments: dict[str, Any],
) -> list[TextContent]:
    """Handle delete_task tool execution."""
    input_data = DeleteTaskInput(**arguments)
    result = await client.delete_task(
        user_id=input_data.user_id,
        task_id=input_data.task_id,
    )

    output = DeleteTaskOutput(
        success=result["success"],
        message=result["message"],
    )

    return [TextContent(type="text", text=output.model_dump_json())]


async def main():
    """Run the MCP server using stdio transport."""
    logger.info("Starting MCP server...")
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
