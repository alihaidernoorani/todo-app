"""Manual verification script for complete_task MCP tool.

Usage:
    python tests/mcp/verify_complete_task.py
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.mcp.client.backend_client import BackendClient, BackendClientError
from src.mcp.config import get_config


async def verify_complete_task():
    """Verify complete_task functionality."""
    config = get_config()
    test_user_id = f"test_user_{uuid4().hex[:8]}"

    print("=" * 60)
    print("VERIFICATION: complete_task MCP Tool")
    print("=" * 60)

    async with BackendClient(config.backend_url, config.request_timeout) as client:
        # Setup: Create a pending task
        print("[Setup] Creating test task...")
        task = await client.create_task(test_user_id, "Task to Complete", "Test task")
        task_id = task['id']
        print(f"Created task: {task_id}")
        print(f"Initial status: {'completed' if task['is_completed'] else 'pending'}")
        print()

        # Test 1: Complete the task
        print("[Test 1] Completing task...")
        try:
            result = await client.complete_task(test_user_id, task_id)
            print("✅ Success!")
            print(f"New status: {'completed' if result['is_completed'] else 'pending'}")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}\n")

        # Test 2: Attempt cross-user completion
        different_user = f"test_user_{uuid4().hex[:8]}"
        print(f"[Test 2] Cross-user access test (user: {different_user})...")
        try:
            await client.complete_task(different_user, task_id)
            print("⚠️  Warning: Cross-user access succeeded (should fail!)\n")
        except BackendClientError as e:
            print(f"✅ Correctly blocked: {e.message}\n")

    print("=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(verify_complete_task())
