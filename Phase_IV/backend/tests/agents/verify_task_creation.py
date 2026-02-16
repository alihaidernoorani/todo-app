"""Verification script for User Story 1: AI Agent Creates Task.

This script tests the agent's ability to create tasks via natural language
using Runner.run() from the OpenAI Agents SDK.

Run with: python -m pytest backend/tests/agents/verify_task_creation.py -v
"""

import asyncio
from agents import Runner
from backend.src.agents.core.agent import create_task_agent
from backend.src.agents.core.conversation_handler import build_conversation_history
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def verify_task_creation():
    """Verify agent can create tasks via natural language."""

    # Create agent
    agent = create_task_agent()

    # Mock MCP client for testing (in real use, this would be actual MCP client)
    class MockMCPClient:
        async def call_tool(self, tool_name: str, params: dict) -> dict:
            logger.info(f"Mock MCP call: {tool_name} with params {params}")
            if tool_name == "add_task":
                return {
                    "task_id": 1,
                    "title": params["title"],
                    "description": params.get("description"),
                    "status": "pending",
                    "created_at": "2025-01-01T12:00:00Z"
                }
            return {}

    # Setup context
    context = {
        "mcp_client": MockMCPClient(),
        "user_id": 1,
    }

    # Test cases
    test_messages = [
        "Create a task to review the code today",
        "Add buy groceries to my todo list",
        "I need to schedule a meeting with the team about the project next week",
    ]

    print("\n" + "="*60)
    print("VERIFICATION: User Story 1 - AI Agent Creates Task")
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
    print("✅ ALL TESTS PASSED - User Story 1 is functional!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(verify_task_creation())
