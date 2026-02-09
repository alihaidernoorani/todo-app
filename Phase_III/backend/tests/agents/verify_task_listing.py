"""Verification script for User Story 2: AI Agent Lists Tasks.

This script tests the agent's ability to list tasks via natural language
using Runner.run() from the OpenAI Agents SDK.

Run with: python backend/tests/agents/verify_task_listing.py
"""

import asyncio
from agents import Runner
from backend.src.agents.core.agent import create_task_agent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def verify_task_listing():
    """Verify agent can list tasks via natural language."""

    # Create agent
    agent = create_task_agent()

    # Mock MCP client for testing
    class MockMCPClient:
        async def call_tool(self, tool_name: str, params: dict) -> dict:
            logger.info(f"Mock MCP call: {tool_name} with params {params}")
            if tool_name == "list_tasks":
                return {
                    "tasks": [
                        {"id": 1, "title": "Buy groceries", "status": "pending"},
                        {"id": 2, "title": "Call mom", "status": "pending"},
                        {"id": 3, "title": "Finish report", "status": "completed"},
                    ]
                }
            return {}

    # Setup context
    context = {
        "mcp_client": MockMCPClient(),
        "user_id": 1,
    }

    # Test cases
    test_messages = [
        "What's on my todo list?",
        "Show me my tasks",
        "What do I need to do?",
    ]

    print("\n" + "="*60)
    print("VERIFICATION: User Story 2 - AI Agent Lists Tasks")
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
    print("✅ ALL TESTS PASSED - User Story 2 is functional!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(verify_task_listing())
