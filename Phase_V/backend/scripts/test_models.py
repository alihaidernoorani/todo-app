"""Example usage script demonstrating CRUD operations for Conversation and Message models.

This script shows how to:
1. Create a conversation
2. Add messages to the conversation
3. Query conversation history
4. Update conversation timestamp
5. Delete conversation (with CASCADE delete of messages)

Usage:
    uv run python scripts/test_models.py
"""

import asyncio
from datetime import UTC, datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.database import engine
from src.models import Conversation, Message


async def demonstrate_crud_operations():
    """Demonstrate Create, Read, Update, Delete operations."""
    print("=== Conversation and Message CRUD Demo ===\n")

    async with AsyncSession(engine) as session:
        # ============================
        # 1. CREATE CONVERSATION
        # ============================
        print("1. Creating a new conversation...")
        conversation = Conversation(user_id="demo_user_123")
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)

        print(f"   ✓ Created conversation (id={conversation.id})")
        print(f"     user_id: {conversation.user_id}")
        print(f"     created_at: {conversation.created_at}")
        print(f"     updated_at: {conversation.updated_at}\n")

        # ============================
        # 2. ADD MESSAGES
        # ============================
        print("2. Adding messages to the conversation...")

        # User message
        user_message = Message(
            conversation_id=conversation.id,
            user_id="demo_user_123",
            role="user",
            content="Hello! Can you help me create a task for my project?",
        )
        session.add(user_message)
        await session.commit()
        await session.refresh(user_message)
        print(f"   ✓ Added user message (id={user_message.id})")

        # Assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            user_id="demo_user_123",
            role="assistant",
            content="Of course! I'd be happy to help you create a task. What would you like the task to be?",
        )
        session.add(assistant_message)
        await session.commit()
        await session.refresh(assistant_message)
        print(f"   ✓ Added assistant message (id={assistant_message.id})\n")

        # Update conversation timestamp (application layer responsibility)
        conversation.updated_at = datetime.now(UTC)
        await session.commit()
        print(f"   ✓ Updated conversation.updated_at to {conversation.updated_at}\n")

        # ============================
        # 3. READ CONVERSATION HISTORY
        # ============================
        print("3. Querying conversation history...")

        # Get all messages for the conversation, ordered chronologically
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .where(Message.user_id == "demo_user_123")  # Always filter by user_id!
            .order_by(Message.created_at)
        )

        result = await session.exec(stmt)
        messages = result.all()

        print(f"   ✓ Found {len(messages)} messages:\n")
        for msg in messages:
            print(f"     [{msg.role}] {msg.content[:50]}...")
            print(f"       (id={msg.id}, created_at={msg.created_at})\n")

        # ============================
        # 4. QUERY USER'S CONVERSATIONS
        # ============================
        print("4. Querying all conversations for user...")

        stmt = (
            select(Conversation)
            .where(Conversation.user_id == "demo_user_123")
            .order_by(Conversation.updated_at.desc())
        )

        result = await session.exec(stmt)
        conversations = result.all()

        print(f"   ✓ Found {len(conversations)} conversation(s):\n")
        for conv in conversations:
            print(f"     Conversation {conv.id}")
            print(f"       created_at: {conv.created_at}")
            print(f"       updated_at: {conv.updated_at}\n")

        # ============================
        # 5. DELETE CONVERSATION (CASCADE)
        # ============================
        print("5. Deleting conversation (CASCADE delete messages)...")

        # Count messages before delete
        stmt = select(Message).where(Message.conversation_id == conversation.id)
        result = await session.exec(stmt)
        messages_before = len(result.all())
        print(f"   Messages before delete: {messages_before}")

        # Delete the conversation
        await session.delete(conversation)
        await session.commit()
        print(f"   ✓ Deleted conversation {conversation.id}")

        # Verify messages were cascade deleted
        stmt = select(Message).where(Message.conversation_id == conversation.id)
        result = await session.exec(stmt)
        messages_after = len(result.all())
        print(f"   Messages after delete: {messages_after}")

        if messages_after == 0:
            print("   ✅ CASCADE DELETE working - all messages auto-deleted\n")
        else:
            print(f"   ❌ FAIL: Found {messages_after} orphaned messages\n")

    print("=== Demo Complete ===")


async def demonstrate_user_scoping():
    """Demonstrate user-scoped queries for data isolation."""
    print("\n=== User Data Isolation Demo ===\n")

    async with AsyncSession(engine) as session:
        # Create conversations for two different users
        user1_conv = Conversation(user_id="user_1")
        user2_conv = Conversation(user_id="user_2")
        session.add(user1_conv)
        session.add(user2_conv)
        await session.commit()
        await session.refresh(user1_conv)
        await session.refresh(user2_conv)

        print("1. Created conversations for user_1 and user_2")
        print(f"   user_1 conversation: {user1_conv.id}")
        print(f"   user_2 conversation: {user2_conv.id}\n")

        # Add messages for each user
        msg1 = Message(
            conversation_id=user1_conv.id,
            user_id="user_1",
            role="user",
            content="User 1's private message",
        )
        msg2 = Message(
            conversation_id=user2_conv.id,
            user_id="user_2",
            role="user",
            content="User 2's private message",
        )
        session.add(msg1)
        session.add(msg2)
        await session.commit()
        print("2. Added messages for each user\n")

        # Query with proper user scoping (SAFE)
        print("3. Querying with user_id filter (SAFE):")
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == "user_1")
            .order_by(Conversation.updated_at.desc())
        )
        result = await session.exec(stmt)
        user1_conversations = result.all()
        print(f"   ✅ user_1 sees {len(user1_conversations)} conversation(s) (their own)\n")

        # Query without user scoping (UNSAFE - would leak data in production)
        print("4. Querying WITHOUT user_id filter (UNSAFE):")
        stmt = select(Conversation).order_by(Conversation.updated_at.desc())
        result = await session.exec(stmt)
        all_conversations = result.all()
        print(f"   ❌ Query returns {len(all_conversations)} conversation(s) (cross-user access!)\n")

        print("   Security Note: Always filter by user_id from JWT token!\n")

        # Cleanup
        await session.delete(user1_conv)
        await session.delete(user2_conv)
        await session.commit()

    print("=== Demo Complete ===\n")


async def main():
    """Run all demonstration functions."""
    await demonstrate_crud_operations()
    await demonstrate_user_scoping()


if __name__ == "__main__":
    asyncio.run(main())
