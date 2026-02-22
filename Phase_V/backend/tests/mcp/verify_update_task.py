"""Manual verification script for update_task MCP tool.

Usage:
    python tests/mcp/verify_update_task.py
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.mcp.client.backend_client import BackendClient, BackendClientError
from src.mcp.config import get_config


async def verify_update_task():
    """Verify update_task functionality."""
    config = get_config()
    test_user_id = f"test_user_{uuid4().hex[:8]}"

    print("=" * 60)
    print("VERIFICATION: update_task MCP Tool")
    print("=" * 60)

    async with BackendClient(config.backend_url, config.request_timeout) as client:
        # Setup: Create a task
        print("[Setup] Creating test task...")
        task = await client.create_task(
            test_user_id,
            "Original Title",
            "Original Description"
        )
        task_id = task['id']
        print(f"Created task: {task_id}")
        print(f"Title: {task['title']}")
        print(f"Description: {task['description']}")
        print()

        # Test 1: Update title only
        print("[Test 1] Updating title only...")
        try:
            result = await client.update_task(test_user_id, task_id, title="New Title")
            print("✅ Success!")
            print(f"Title: {result['title']}")
            print(f"Description: {result['description']} (should be unchanged)")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}\n")

        # Test 2: Update description only
        print("[Test 2] Updating description only...")
        try:
            result = await client.update_task(
                test_user_id,
                task_id,
                description="New Description"
            )
            print("✅ Success!")
            print(f"Title: {result['title']} (should be 'New Title')")
            print(f"Description: {result['description']}")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}\n")

        # Test 3: Cross-user update attempt
        different_user = f"test_user_{uuid4().hex[:8]}"
        print(f"[Test 3] Cross-user update test (user: {different_user})...")
        try:
            await client.update_task(different_user, task_id, title="Hacked")
            print("⚠️  Warning: Cross-user update succeeded (should fail!)\n")
        except BackendClientError as e:
            print(f"✅ Correctly blocked: {e.message}\n")

    print("=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(verify_update_task())
