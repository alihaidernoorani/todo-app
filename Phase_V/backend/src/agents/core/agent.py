"""Main agent initialization using OpenAI Agents SDK.

This module creates the task management agent using the Agent() pattern
from OpenAI Agents SDK with hybrid mode: text-parsing for add_task,
function calling for other operations.
"""

from agents import Agent, ModelSettings
from src.agents.config.agent_config import AGENT_INSTRUCTIONS
from src.agents.mcp.mcp_tools import (
    add_recurring_task,
    cancel_reminder,
    complete_task,
    delete_task,
    list_tasks,
    set_reminder,
    update_task,
)
from src.config import get_settings

settings = get_settings()


def create_task_agent() -> Agent:
    """Create a task management assistant with hybrid mode.

    - add_task: Text-parsing mode (outputs "Task added: <task_name>")
    - Other operations: Function calling with MCP tools

    Phase V extends the agent with recurring tasks and reminder tools.
    T060/T077: Includes filter-aware list_tasks and edge case instructions.
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
            # Phase V tools (T029/T042/T050)
            add_recurring_task,
            set_reminder,
            cancel_reminder,
        ],
        model=settings.agent_model_name,
        model_settings=ModelSettings(max_tokens=settings.agent_max_tokens),
    )

    return agent
