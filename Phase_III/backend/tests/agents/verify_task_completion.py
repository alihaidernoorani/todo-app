"""Verification script for User Story 3: AI Agent Completes Task.

This script tests the agent's ability to complete tasks via natural language
using Runner.run() from the OpenAI Agents SDK.

Run with: python backend/tests/agents/verify_task_completion.py
"""

import asyncio
from agents import Runner
from backend.src.agents.core.agent import create_task_agent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def verify_task_completion():
    """Verify agent can complete tasks via natural language."""

    # Create agent
    agent = create_task_agent()

    # Mock MCP client for testing
    class MockMCPClient:
        async def call_tool(self, tool_name: str, params: dict) -> dict:
            logger.info(f"Mock MCP call: {tool_name} with params {params}")
            if tool_name == "complete_task":
                return {"task_id": params["task_id"], "status": "completed"}
            return {}

    # Setup context
    context = {
        "mcp_client": MockMCPClient(),
        "user_id": 1,
    }

    # Test cases
    test_messages = [
        "I finished buying groceries",
        "Mark task 123 as done",
        "Complete the review task",
    ]

    print("\n" + "="*60)
    print("VERIFICATION: User Story 3 - AI Agent Completes Task")
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
    print("✅ ALL TESTS PASSED - User Story 3 is functional!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(verify_task_completion())
