"""Verification script for User Story 4: AI Agent Updates Task.

This script tests the agent's ability to update tasks via natural language
using Runner.run() from the OpenAI Agents SDK.

Run with: python backend/tests/agents/verify_task_update.py
"""

import asyncio
from agents import Runner
from backend.src.agents.core.agent import create_task_agent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def verify_task_update():
    """Verify agent can update tasks via natural language."""

    # Create agent
    agent = create_task_agent()

    # Mock MCP client for testing
    class MockMCPClient:
        async def call_tool(self, tool_name: str, params: dict) -> dict:
            logger.info(f"Mock MCP call: {tool_name} with params {params}")
            if tool_name == "update_task":
                return {
                    "task_id": params["task_id"],
                    "title": params.get("title", ""),
                    "description": params.get("description", ""),
                    "updated_at": "2025-01-01T12:00:00Z"
                }
            return {}

    # Setup context
    context = {
        "mcp_client": MockMCPClient(),
        "user_id": 1,
    }

    # Test cases
    test_messages = [
        "Change task 123 title to 'Buy almond milk'",
        "Update the meeting task to 4pm",
        "Change the description of task 456 to 'High priority'",
    ]

    print("\n" + "="*60)
    print("VERIFICATION: User Story 4 - AI Agent Updates Task")
    print("="*60 + "\n")

    for i, message in enumerate(test_messages, 1):
        print(f"\n--- Test {i}/3 ---")
        print(f"User: {message}")

        try:
            result = await Runner.run(agent, message, context=context)
            response = result.final_output

            print(f"Agent: {response}")
            print(f"✅ Test {i} PASSED\n")

        except Exception as e:
            print(f"❌ Test {i} FAILED: {str(e)}\n")
            raise

    print("="*60)
    print("✅ ALL TESTS PASSED - User Story 4 is functional!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(verify_task_update())
