# AI Agent Integration - OpenAI Agents SDK

This directory contains the AI agent implementation using the **OpenAI Agents SDK** for natural language task management.

## Overview

The AI agent enables users to manage tasks through natural conversation using:
- **OpenAI Agents SDK** for agent orchestration
- **MCP Tools** for task operations (add, list, complete, update, delete)
- **Runner.run()** for stateless agent execution
- **PostgreSQL** for conversation persistence

## Architecture

```
backend/src/agents/
├── config/
│   └── agent_config.py          # Agent instructions and constants
├── mcp/
│   └── mcp_tools.py              # @function_tool decorated MCP wrappers
├── core/
│   ├── agent.py                  # Agent initialization (Agent())
│   ├── conversation_handler.py   # UserMessageItem/AssistantMessageItem builders
│   ├── runner.py                 # Runner.run() wrapper
│   └── tracing.py                # Observability and logging
└── api/
    ├── agent_routes.py           # FastAPI POST /api/v1/agent/chat
    ├── agent_handler.py          # Request handler
    ├── schemas.py                # Pydantic request/response models
    └── serializers.py            # Response formatting helpers
```

## Key Patterns

### 1. Agent Creation

```python
from backend.src.agents.core.agent import create_task_agent

agent = create_task_agent()  # Agent with 5 MCP tools
```

### 2. Function Tools

```python
from agents import function_tool, RunContextWrapper
from typing import Any

@function_tool
async def add_task(
    ctx: RunContextWrapper[Any],
    title: str,
    description: str = None,
) -> dict:
    """Create a new task."""
    mcp_client = ctx.context.get("mcp_client")
    user_id = ctx.context.get("user_id")

    result = await mcp_client.call_tool("add_task", {
        "title": title,
        "description": description,
        "user_id": user_id
    })
    return result
```

### 3. Running the Agent

```python
from agents import Runner
from backend.src.agents.core.agent import create_task_agent

agent = create_task_agent()

context = {
    "mcp_client": mcp_client_instance,
    "user_id": 123,
}

result = await Runner.run(agent, "Create a task to buy groceries", context=context)
print(result.final_output)
```

### 4. Conversation History

```python
from agents.items import UserMessageItem, AssistantMessageItem
from backend.src.agents.core.conversation_handler import build_conversation_history

# From database messages
db_messages = [
    {"role": "user", "content": "Hi", "created_at": "2025-01-01T12:00:00"},
    {"role": "assistant", "content": "Hello!", "created_at": "2025-01-01T12:00:05"},
]

history = build_conversation_history(db_messages)
result = await Runner.run(agent, history + [UserMessageItem(content="What tasks do I have?")], context=context)
```

## API Usage

### POST /api/v1/agent/chat

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/agent/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "user_id": 123,
    "message": "Create a task to buy groceries",
    "conversation_id": null
  }'
```

**Response:**
```json
{
  "conversation_id": 1,
  "user_message_id": 1,
  "agent_message_id": 2,
  "agent_response": "I've added 'buy groceries' to your task list.",
  "tool_calls": null
}
```

## Environment Setup

```bash
# Install dependencies
uv pip install openai[agents]

# Configure environment
export OPENROUTER_API_KEY="your-api-key"
export BACKEND_BASE_URL="http://localhost:8000"

# Run backend
cd backend
uvicorn src.main:app --reload
```

## Testing

```bash
# Run verification scripts
python backend/tests/agents/verify_task_creation.py
python backend/tests/agents/verify_task_listing.py
python backend/tests/agents/verify_task_completion.py
python backend/tests/agents/verify_task_update.py
python backend/tests/agents/verify_task_deletion.py
```

## Tracing & Debugging

```python
from backend.src.agents.core.tracing import setup_agent_tracing

# Enable tracing
setup_agent_tracing(enable=True, custom_handler=True)

# Now all agent executions will be logged
```

## Stateless Design

The agent is **completely stateless**:
- ✅ No in-memory state
- ✅ Conversation history from PostgreSQL
- ✅ MCP client passed via context
- ✅ Each `Runner.run()` call is independent
- ✅ Restart-safe (no session loss)

## MCP Tools

The agent has access to 5 MCP tools:

1. **add_task** - Create new tasks
2. **list_tasks** - Retrieve tasks (with status filtering)
3. **complete_task** - Mark tasks as complete
4. **update_task** - Modify task details
5. **delete_task** - Remove tasks

All tools enforce user_id scoping for security.

## Error Handling

```python
try:
    result = await Runner.run(agent, message, context=context)
except ValueError as e:
    # Validation errors
    logger.error(f"Validation failed: {e}")
except Exception as e:
    # Agent execution errors
    logger.error(f"Agent failed: {e}")
```

## Development Notes

- Agent uses **OpenRouter** (not direct OpenAI) for LLM access
- Model configured in `agent_config.py` (default: `openai/gpt-4o`)
- All tools use `@function_tool` decorator from SDK
- Agent initialization uses `Agent(name, instructions, tools)` pattern
- Execution uses `Runner.run(agent, messages, context)` pattern

## References

- [OpenAI Agents SDK Documentation](https://github.com/openai/agents-sdk)
- [MCP Tools Implementation](../mcp/)
- [API Specification](../../../../specs/008-ai-agent-integration/spec.md)
- [Implementation Plan](../../../../specs/008-ai-agent-integration/plan.md)
