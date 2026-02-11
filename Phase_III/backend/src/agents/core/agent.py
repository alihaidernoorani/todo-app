"""Main agent initialization using OpenAI Agents SDK.

This module creates the task management agent using the Agent() pattern
from OpenAI Agents SDK with configured instructions and MCP tools.
"""

from agents import Agent
from src.agents.config.agent_config import AGENT_INSTRUCTIONS
from src.agents.mcp.mcp_tools import (
    add_task,
    list_tasks,
    complete_task,
    update_task,
    delete_task,
)
from src.config import get_settings

settings = get_settings()


def create_task_agent() -> Agent:
    """Create and return the task management agent.

    Returns:
        Agent: Configured agent with task management tools

    Example:
        ```python
        from src.agents.core.agent import create_task_agent
        from agents import Runner

        agent = create_task_agent()
        context = {"mcp_client": mcp_client, "user_id": user_id}
        result = await Runner.run(agent, "Add a task to buy groceries", context=context)
        print(result.final_output)
        ```
    """
    agent = Agent(
        name="Task Assistant",
        instructions=AGENT_INSTRUCTIONS,
        tools=[
            add_task,
            list_tasks,
            complete_task,
            update_task,
            delete_task,
        ],
        model=settings.agent_model,
        model_params={"max_tokens": settings.agent_max_tokens},
    )

    return agent
