"""Manual verification script for list_tasks MCP tool.

This script tests the list_tasks tool with different status filters
and validates filtering logic.

Usage:
    python tests/mcp/verify_list_tasks.py
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.mcp.client.backend_client import BackendClient, BackendClientError
from src.mcp.config import get_config


async def verify_list_tasks():
    """Verify list_tasks functionality with status filtering."""
    config = get_config()
    test_user_id = f"test_user_{uuid4().hex[:8]}"

    print("=" * 60)
    print("VERIFICATION: list_tasks MCP Tool")
    print("=" * 60)
    print(f"Backend URL: {config.backend_url}")
    print(f"Test User ID: {test_user_id}")
    print()

    async with BackendClient(config.backend_url, config.request_timeout) as client:
        # Setup: Create multiple tasks with different statuses
        print("[Setup] Creating test tasks...")
        try:
            task1 = await client.create_task(
                user_id=test_user_id,
                title="Pending Task 1",
                description="This task should remain pending",
            )
            print(f"Created pending task: {task1['id']}")

            task2 = await client.create_task(
                user_id=test_user_id,
                title="Task to Complete",
                description="This task will be completed",
            )
            print(f"Created task to complete: {task2['id']}")

            # Complete task2
            completed_task = await client.complete_task(test_user_id, task2['id'])
            print(f"Completed task: {completed_task['id']}")

            task3 = await client.create_task(
                user_id=test_user_id,
                title="Pending Task 2",
                description="Another pending task",
            )
            print(f"Created pending task: {task3['id']}")
            print()
        except BackendClientError as e:
            print(f"❌ Setup failed: {e.message}")
            return

        # Test 1: List all tasks (status="all")
        print("[Test 1] Listing all tasks (status='all')...")
        try:
            result1 = await client.list_tasks(test_user_id, status="all")
            print("✅ Success!")
            print(f"Total tasks: {result1['count']}")
            print(f"Expected: 3 tasks (2 pending, 1 completed)")
            for task in result1['items']:
                status = "completed" if task['is_completed'] else "pending"
                print(f"  - {task['title']} [{status}]")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}")
            print()

        # Test 2: List only pending tasks (status="pending")
        print("[Test 2] Listing pending tasks only (status='pending')...")
        try:
            result2 = await client.list_tasks(test_user_id, status="pending")
            print("✅ Success!")
            print(f"Total tasks: {result2['count']}")
            print(f"Expected: 2 pending tasks")
            for task in result2['items']:
                status = "completed" if task['is_completed'] else "pending"
                print(f"  - {task['title']} [{status}]")
            if any(task['is_completed'] for task in result2['items']):
                print("⚠️  Warning: Completed tasks found in 'pending' filter!")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}")
            print()

        # Test 3: List only completed tasks (status="completed")
        print("[Test 3] Listing completed tasks only (status='completed')...")
        try:
            result3 = await client.list_tasks(test_user_id, status="completed")
            print("✅ Success!")
            print(f"Total tasks: {result3['count']}")
            print(f"Expected: 1 completed task")
            for task in result3['items']:
                status = "completed" if task['is_completed'] else "pending"
                print(f"  - {task['title']} [{status}]")
            if any(not task['is_completed'] for task in result3['items']):
                print("⚠️  Warning: Pending tasks found in 'completed' filter!")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}")
            print()

        # Test 4: Verify user isolation (different user should see empty list)
        different_user_id = f"test_user_{uuid4().hex[:8]}"
        print(f"[Test 4] Verifying user isolation (user: {different_user_id})...")
        try:
            result4 = await client.list_tasks(different_user_id, status="all")
            print("✅ Success!")
            print(f"Total tasks: {result4['count']}")
            print(f"Expected: 0 tasks (different user)")
            if result4['count'] > 0:
                print("⚠️  Warning: Data leakage detected! User sees other user's tasks!")
            else:
                print("✓ User isolation confirmed: No data leakage")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}")
            print()

    print("=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)
    print("\nManual Checks:")
    print("1. Verify all filters return correct number of tasks")
    print("2. Verify 'pending' filter excludes completed tasks")
    print("3. Verify 'completed' filter excludes pending tasks")
    print("4. Verify user isolation (no cross-user data access)")
    print("5. Verify task objects include all required fields")


if __name__ == "__main__":
    try:
        asyncio.run(verify_list_tasks())
    except KeyboardInterrupt:
        print("\n\nVerification interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Verification failed with error: {e}")
        import traceback
        traceback.print_exc()
