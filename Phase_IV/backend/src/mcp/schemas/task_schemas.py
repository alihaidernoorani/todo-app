"""Pydantic schemas for MCP tool inputs and outputs.

These schemas define the structure of data passed to and from MCP tools,
matching the backend API contracts for task operations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# Input Schemas (Tool Parameters)


class AddTaskInput(BaseModel):
    """Input schema for add_task MCP tool."""

    user_id: str = Field(..., description="User identifier for task scoping")
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional task description",
    )


class ListTasksInput(BaseModel):
    """Input schema for list_tasks MCP tool."""

    user_id: str = Field(..., description="User identifier for task scoping")
    status: str = Field(
        default="all",
        description="Filter by status: 'all', 'pending', or 'completed'",
        pattern="^(all|pending|completed)$",
    )


class CompleteTaskInput(BaseModel):
    """Input schema for complete_task MCP tool."""

    user_id: str = Field(..., description="User identifier for task scoping")
    task_id: UUID = Field(..., description="UUID of task to complete")


class UpdateTaskInput(BaseModel):
    """Input schema for update_task MCP tool."""

    user_id: str = Field(..., description="User identifier for task scoping")
    task_id: UUID = Field(..., description="UUID of task to update")
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="New task title (optional)",
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="New task description (optional)",
    )


class DeleteTaskInput(BaseModel):
    """Input schema for delete_task MCP tool."""

    user_id: str = Field(..., description="User identifier for task scoping")
    task_id: UUID = Field(..., description="UUID of task to delete")


# Output Schemas (Tool Responses)


class TaskResponse(BaseModel):
    """Common task response schema."""

    task_id: UUID = Field(..., description="Task unique identifier")
    title: str = Field(..., description="Task title")
    description: str | None = Field(None, description="Task description")
    status: str = Field(..., description="Task status (pending or completed)")
    priority: str = Field(..., description="Task priority (High, Medium, Low)")
    created_at: datetime = Field(..., description="Task creation timestamp")


class AddTaskOutput(BaseModel):
    """Output schema for add_task MCP tool."""

    task_id: UUID
    title: str
    status: str
    created_at: datetime


class ListTasksOutput(BaseModel):
    """Output schema for list_tasks MCP tool."""

    tasks: list[TaskResponse] = Field(
        default_factory=list,
        description="Array of tasks matching filter criteria",
    )


class CompleteTaskOutput(BaseModel):
    """Output schema for complete_task MCP tool."""

    task_id: UUID
    title: str
    status: str


class UpdateTaskOutput(BaseModel):
    """Output schema for update_task MCP tool."""

    task_id: UUID
    title: str
    description: str | None
    status: str


class DeleteTaskOutput(BaseModel):
    """Output schema for delete_task MCP tool."""

    success: bool = Field(..., description="Operation success indicator")
    message: str = Field(..., description="Confirmation message")
