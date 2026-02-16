"""Main agent initialization using OpenAI Agents SDK.

This module creates the task management agent using the Agent() pattern
from OpenAI Agents SDK with hybrid mode: text-parsing for add_task,
function calling for other operations.
"""

from agents import Agent, ModelSettings
from src.agents.config.agent_config import AGENT_INSTRUCTIONS
from src.agents.mcp.mcp_tools import (
    list_tasks,
    complete_task,
    update_task,
    delete_task,
)
from src.config import get_settings

settings = get_settings()


def create_task_agent() -> Agent:
    """Create a task management assistant with hybrid mode.

    - add_task: Text-parsing mode (outputs "Task added: <task_name>")
    - Other operations: Function calling with MCP tools

    This hybrid approach provides fallback for add_task when tool execution
    isn't reliable, while keeping standard tool calling for other operations.
    """
    agent = Agent(
        name="Task Assistant",
        instructions=AGENT_INSTRUCTIONS,
        tools=[
            # add_task is NOT included - handled via text parsing
            list_tasks,
            complete_task,
            update_task,
            delete_task,
        ],
        model=settings.agent_model_name,
        model_settings=ModelSettings(max_tokens=settings.agent_max_tokens),
    )

    return agent
