"""Manual verification script for add_task MCP tool.

This script tests the add_task tool by creating sample tasks
and printing the results for manual validation.

Usage:
    python tests/mcp/verify_add_task.py
"""

import asyncio
import json
import sys
from pathlib import Path
from uuid import uuid4

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.mcp.client.backend_client import BackendClient, BackendClientError
from src.mcp.config import get_config


async def verify_add_task():
    """Verify add_task functionality."""
    config = get_config()
    test_user_id = f"test_user_{uuid4().hex[:8]}"

    print("=" * 60)
    print("VERIFICATION: add_task MCP Tool")
    print("=" * 60)
    print(f"Backend URL: {config.backend_url}")
    print(f"Test User ID: {test_user_id}")
    print()

    async with BackendClient(config.backend_url, config.request_timeout) as client:
        # Test 1: Create task with title and description
        print("[Test 1] Creating task with title and description...")
        try:
            result1 = await client.create_task(
                user_id=test_user_id,
                title="Complete project documentation",
                description="Write comprehensive README and API docs",
            )
            print("✅ Success!")
            print(f"Task ID: {result1['id']}")
            print(f"Title: {result1['title']}")
            print(f"Description: {result1['description']}")
            print(f"Status: {'completed' if result1['is_completed'] else 'pending'}")
            print(f"Created At: {result1['created_at']}")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}")
            print()

        # Test 2: Create task with title only (no description)
        print("[Test 2] Creating task with title only...")
        try:
            result2 = await client.create_task(
                user_id=test_user_id,
                title="Review pull requests",
                description=None,
            )
            print("✅ Success!")
            print(f"Task ID: {result2['id']}")
            print(f"Title: {result2['title']}")
            print(f"Description: {result2.get('description', 'None')}")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}")
            print()

        # Test 3: Create task for different user (isolation test)
        different_user_id = f"test_user_{uuid4().hex[:8]}"
        print(f"[Test 3] Creating task for different user: {different_user_id}...")
        try:
            result3 = await client.create_task(
                user_id=different_user_id,
                title="Deploy to production",
                description="Deploy latest version to prod environment",
            )
            print("✅ Success!")
            print(f"Task ID: {result3['id']}")
            print(f"User ID: {different_user_id}")
            print("Note: This task should be isolated from first user's tasks")
            print()
        except BackendClientError as e:
            print(f"❌ Failed: {e.message}")
            print()

    print("=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)
    print("\nManual Checks:")
    print("1. Verify tasks appear in database with correct user_id")
    print("2. Verify task_id is a valid UUID")
    print("3. Verify created_at timestamp is recent")
    print("4. Verify tasks for different users are isolated")


if __name__ == "__main__":
    try:
        asyncio.run(verify_add_task())
    except KeyboardInterrupt:
        print("\n\nVerification interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Verification failed with error: {e}")
        import traceback
        traceback.print_exc()
