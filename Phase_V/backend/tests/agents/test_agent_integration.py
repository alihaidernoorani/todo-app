import pytest
import asyncio
from fastapi.testclient import TestClient
from backend.src.agents.api.agent_routes import router
from backend.src.agents.core.agent_factory import AgentFactory
from backend.src.agents.core.conversation_manager import ConversationManager
from backend.src.agents.config.agent_config import AgentConfig
from backend.src.services.conversation_service import ConversationService
from backend.src.services.message_service import MessageService
from unittest.mock import AsyncMock, MagicMock

# Setup test client
client = TestClient(router)

class TestAgentIntegration:
    """Integration tests for the AI agent system."""

    @pytest.fixture(autouse=True)
    def setup_agent(self):
        """Setup test fixtures for agent integration."""
        # Mock services
        self.mock_conversation_service = MagicMock(spec=ConversationService)
        self.mock_message_service = MagicMock(spec=MessageService)
        self.mock_mcp_client = MagicMock()

        # Create conversation manager
        self.conversation_manager = ConversationManager(
            self.mock_conversation_service,
            self.mock_message_service
        )

        # Create agent config
        self.agent_config = AgentConfig(
            model="gpt-4o",
            base_url="https://api.openai.com/v1",
            api_key="test-api-key",
            system_prompt="You are a helpful task management assistant.",
            max_history_messages=10,
            max_history_minutes=60
        )

        # Create agent factory
        self.agent_factory = AgentFactory(self.agent_config)

    @pytest.mark.asyncio
    async def test_agent_creation_and_message_processing(self):
        """Test agent creation and message processing workflow."""
        # Setup mock MCP tool responses
        self.mock_mcp_client.call_tool = AsyncMock()
        self.mock_mcp_client.call_tool.side_effect = self._mock_mcp_tool_response

        # Test message: Create task
        response = await self._send_agent_message(
            user_id="test-user-1",
            message="Create a task to review code today"
        )
        assert response.status == "success"
        assert "added" in response.response.lower()

        # Test message: List tasks
        response = await self._send_agent_message(
            user_id="test-user-1",
            message="Show me my tasks"
        )
        assert response.status == "success"
        assert "tasks" in response.response.lower()

        # Test message: Complete task
        response = await self._send_agent_message(
            user_id="test-user-1",
            message="Complete task #1"
        )
        assert response.status == "success"
        assert "complete" in response.response.lower()

        # Test message: Update task
        response = await self._send_agent_message(
            user_id="test-user-1",
            message="Change task #1 title to 'Review PRs'"
        )
        assert response.status == "success"
        assert "updated" in response.response.lower()

        # Test message: Delete task
        response = await self._send_agent_message(
            user_id="test-user-1",
            message="Delete task #1"
        )
        assert response.status == "success"
        assert "deleted" in response.response.lower()

    @pytest.mark.asyncio
    async def test_agent_conversation_history(self):
        """Test agent conversation history management."""
        user_id = "test-user-2"

        # Create conversation
        conversation_id = await self.conversation_manager.create_conversation(user_id)
        assert conversation_id is not None

        # Send first message
        response1 = await self._send_agent_message(
            user_id=user_id,
            message="Create a task to test conversation history",
            conversation_id=conversation_id
        )
        assert response1.status == "success"

        # Send follow-up message
        response2 = await self._send_agent_message(
            user_id=user_id,
            message="What was the task I just created?",
            conversation_id=conversation_id
        )
        assert response2.status == "success"
        assert "task" in response2.response.lower()

        # Verify conversation history was saved
        self.mock_message_service.create_message.assert_called()
        self.mock_conversation_service.get_conversation.assert_called()

    @pytest.mark.asyncio
    async def test_agent_error_handling(self):
        """Test agent error handling and recovery."""
        user_id = "test-user-3"

        # Test invalid user_id
        with pytest.raises(Exception):
            await self._send_agent_message(
                user_id="",
                message="Create a task"
            )

        # Test empty message
        with pytest.raises(Exception):
            await self._send_agent_message(
                user_id=user_id,
                message=""
            )

        # Test MCP tool failure
        self.mock_mcp_client.call_tool.side_effect = Exception("MCP tool failed")

        response = await self._send_agent_message(
            user_id=user_id,
            message="Create a task"
        )
        assert response.status == "error"
        assert "error" in response.response.lower()

    @pytest.mark.asyncio
    async def test_agent_stateless_behavior(self):
        """Test agent stateless behavior across requests."""
        user_id = "test-user-4"

        # Send message in first request
        response1 = await self._send_agent_message(
            user_id=user_id,
            message="Create a task in first request"
        )
        assert response1.status == "success"

        # Send message in second request - should not have access to first request state
        response2 = await self._send_agent_message(
            user_id=user_id,
            message="What was the task I created?"
        )
        assert response2.status == "success"
        # Response should not magically know about previous task since we're testing stateless behavior

    def _mock_mcp_tool_response(self, tool_name: str, input_data: dict):
        """Mock responses for MCP tool calls."""
        user_id = input_data.get("user_id", 1)

        if tool_name == "add_task":
            return {
                "task_id": 1,
                "title": input_data["title"],
                "description": input_data.get("description"),
                "status": "pending",
                "created_at": "2026-02-09T00:00:00Z"
            }
        elif tool_name == "list_tasks":
            return {
                "tasks": [
                    {
                        "id": 1,
                        "title": "Test task",
                        "description": "Test description",
                        "status": "pending",
                        "created_at": "2026-02-09T00:00:00Z"
                    }
                ]
            }
        elif tool_name == "complete_task":
            return {
                "task_id": input_data["task_id"],
                "status": "completed"
            }
        elif tool_name == "update_task":
            return {
                "task_id": input_data["task_id"],
                "title": input_data.get("title", "Updated task"),
                "description": input_data.get("description"),
                "updated_at": "2026-02-09T00:00:00Z"
            }
        elif tool_name == "delete_task":
            return {
                "task_id": input_data["task_id"],
                "deleted": True
            }
        else:
            raise Exception(f"Unknown tool: {tool_name}")

    async def _send_agent_message(self, user_id: str, message: str, conversation_id: Optional[int] = None):
        """Send a message to the agent and return the response."""
        # Create the agent
        agent = self.agent_factory.create_agent(
            self.mock_mcp_client,
            self.conversation_manager
        )

        # Get conversation history
        if conversation_id:
            conversation_history = await self.conversation_manager.get_conversation_history(
                conversation_id, user_id
            )
        else:
            conversation_history = []

        # Process the message
        agent_response = await agent.process_message(
            message=message,
            conversation_history=conversation_history
        )

        # Format the response
        formatted_response = f"I've processed your request: {message}. Response: {agent_response}"

        # Return formatted response
        return {
            "response": formatted_response,
            "status": "success"
        }