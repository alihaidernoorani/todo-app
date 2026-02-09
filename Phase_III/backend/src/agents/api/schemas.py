"""Request and response schemas for agent API endpoints.

These Pydantic models define the structure of API requests and responses
for the AI agent chat endpoint.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List


class AgentChatRequest(BaseModel):
    """Request schema for POST /api/v1/agent/chat endpoint.

    Attributes:
        user_id: User ID from JWT authentication
        message: User's natural language message
        conversation_id: Optional conversation ID (0 or None creates new conversation)
    """
    user_id: int = Field(
        ...,
        gt=0,
        description="User ID from JWT authentication"
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User's natural language message"
    )
    conversation_id: Optional[int] = Field(
        None,
        description="Existing conversation ID (None or 0 creates new)"
    )

    @validator('message')
    def validate_message(cls, v):
        """Ensure message is not empty or whitespace."""
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()


class AgentChatResponse(BaseModel):
    """Response schema for POST /api/v1/agent/chat endpoint.

    Attributes:
        conversation_id: Conversation ID (new or existing)
        user_message_id: Stored user message ID
        agent_message_id: Stored agent response message ID
        agent_response: Agent's natural language response
        tool_calls: Optional debug info about tool invocations
    """
    conversation_id: int = Field(
        ...,
        description="Conversation ID (new or existing)"
    )
    user_message_id: int = Field(
        ...,
        description="Stored user message ID"
    )
    agent_message_id: int = Field(
        ...,
        description="Stored agent response message ID"
    )
    agent_response: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Agent's natural language response"
    )
    tool_calls: Optional[List[dict]] = Field(
        None,
        description="Optional debug info about tool invocations"
    )


class ToolCallInfo(BaseModel):
    """Debug information about a tool call.

    Used in AgentChatResponse.tool_calls for debugging.
    """
    tool_name: str = Field(..., description="Name of the tool called")
    arguments: dict = Field(..., description="Tool input parameters")
    result: dict = Field(..., description="Tool output")