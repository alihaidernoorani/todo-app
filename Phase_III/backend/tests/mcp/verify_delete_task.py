"""Manual verification script for delete_task MCP tool.

Usage:
    python tests/mcp/verify_delete_task.py
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.mcp.client.backend_client import BackendClient, BackendClientError
from src.mcp.config import get_config


async def verify_delete_task():
    """Verify delete_task functionality."""
    config = get_config()
    test_user_id = f"test_user_{uuid4().hex[:8]}"

    print("=" * 60)
    print("VERIFICATION: delete_task MCP Tool")
    print("=" * 60)

    async with BackendClient(config.backend_url, config.request_timeout) as client:
        # Setup: Create tasks
        print("[Setup] Creating test tasks...")
        task1 = await client.create_task(test_user_id, "Task to Delete", None)
        task2 = await client.create_task(test_user_id, "Task to Keep", None)
        task1_id = task1['id']
        task2_id = task2['id']
        print(f"Created task 1: {task1_id}")
        print(f"Created task 2: {task2_id}")
        print()

        # Test 1: Delete task
        print("[Test 1] Deleting task...")
        try:
            result = await client.delete_task(test_user_id, task1_id)
            print("✅ Success!")
            print(f"Result: {result}")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}\n")

        # Test 2: Verify deletion
        print("[Test 2] Verifying task was deleted...")
        try:
            tasks = await client.list_tasks(test_user_id, "all")
            remaining_ids = [t['id'] for t in tasks['items']]
            if str(task1_id) not in [str(id) for id in remaining_ids]:
                print("✅ Task successfully deleted!")
            else:
                print("⚠️  Warning: Task still exists!")
            print(f"Remaining tasks: {len(remaining_ids)}")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}\n")

        # Test 3: Cross-user deletion attempt
        different_user = f"test_user_{uuid4().hex[:8]}"
        print(f"[Test 3] Cross-user deletion test (user: {different_user})...")
        try:
            await client.delete_task(different_user, task2_id)
            print("⚠️  Warning: Cross-user deletion succeeded (should fail!)\n")
        except BackendClientError as e:
            print(f"✅ Correctly blocked: {e.message}\n")

        # Test 4: Delete non-existent task
        print("[Test 4] Deleting non-existent task...")
        fake_uuid = uuid4()
        try:
            await client.delete_task(test_user_id, fake_uuid)
            print("⚠️  Warning: Deletion of non-existent task succeeded\n")
        except BackendClientError as e:
            print(f"✅ Correctly failed: {e.message}\n")

    print("=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(verify_delete_task())
