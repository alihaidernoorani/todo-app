# Research: AI Agent Integration with OpenAI Agents SDK

**Date**: 2026-02-09
**Feature**: 008-ai-agent-integration
**Status**: Complete

## Research Questions & Decisions

### 1. OpenAI Agents SDK MCP Integration Pattern

**Question**: How does OpenAI Agents SDK connect to external MCP servers?

**Research Findings**:
OpenAI Agents SDK uses **function tools** (`@function_tool`) to expose capabilities to agents. MCP tools are NOT directly supported - we must create wrapper functions that call the MCP server.

**Decision**: Create Python wrapper functions that act as MCP clients, calling the existing MCP server via HTTP/stdio. These wrappers will be registered as OpenAI Agents SDK function tools.

**Architecture**:
```
User Message
    ↓
OpenAI Agent (OpenAI Agents SDK)
    ↓
Function Tool Wrapper (@function_tool decorated)
    ↓
MCP Client (httpx or stdio)
    ↓
MCP Server (existing backend/src/mcp/server.py)
    ↓
Backend REST API
    ↓
Database
```

**Implementation Pattern**:
```python
from agents import Agent, function_tool
import httpx

# Wrapper function that calls MCP tool
@function_tool
async def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Create a new task for the user.

    Args:
        user_id: The user's unique identifier
        title: Task title (max 255 characters)
        description: Optional task description (max 2000 characters)
    """
    async with httpx.AsyncClient() as client:
        # Call MCP server via HTTP (or use stdio MCP client)
        response = await client.post(
            "http://localhost:8000/api/v1/tasks",
            json={"user_id": user_id, "title": title, "description": description},
            headers={"Authorization": f"Bearer {get_service_token()}"}
        )
        return response.json()

# Register tools with agent
agent = Agent(
    name="Task Manager",
    instructions="You help users manage their tasks through natural conversation.",
    tools=[add_task, list_tasks, complete_task, update_task, delete_task],
)
```

**Alternatives Considered**:
- **Direct MCP SDK integration**: OpenAI Agents SDK doesn't support MCP protocol directly
- **Bypass MCP and call REST API directly**: Violates architecture principle (all agent operations must go through MCP tools)
- **Run MCP server in-process**: Adds complexity and couples agent to MCP server lifecycle

**Rationale**: Wrapper approach maintains clean separation between agent (OpenAI Agents SDK) and backend (MCP tools), allows agent to remain stateless, and follows existing architecture where MCP tools are the contract between agent and backend.

---

### 2. Conversation History Management

**Question**: How to efficiently reconstruct conversation context from database for each request?

**Research Findings**:
OpenAI Agents SDK accepts conversation history as a list of `UserMessageItem` and `AssistantMessageItem` objects. The agent needs recent messages to maintain context.

**Decision**: Load last **20 messages** from database (10 exchanges) for each agent request.

**Implementation Pattern**:
```python
from agents import Runner
from agents.items import UserMessageItem, AssistantMessageItem
from src.models import Message

async def load_conversation_history(conversation_id: int, user_id: str) -> list:
    """Load recent conversation history from database."""
    # Query last 20 messages ordered by created_at
    messages = await db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.user_id == user_id
    ).order_by(Message.created_at.desc()).limit(20).all()

    # Reverse to chronological order
    messages.reverse()

    # Convert to OpenAI Agents SDK format
    history = []
    for msg in messages:
        if msg.role == "user":
            history.append(UserMessageItem(content=msg.content))
        elif msg.role == "assistant":
            history.append(AssistantMessageItem(content=msg.content))

    return history

# Use in agent execution
history = await load_conversation_history(conversation_id, user_id)
result = await Runner.run(agent, history)
```

**Performance Considerations**:
- **Index**: Already have index on `(conversation_id, created_at)` for efficient queries
- **Query time**: <50ms for 20 messages with proper indexing
- **Memory**: ~20KB per conversation (20 messages × ~1KB average)
- **Token budget**: ~2000 tokens for 20 messages (well within GPT-4 context window)

**Alternatives Considered**:
- **Time-windowed (last 1 hour)**: Variable message count makes response time unpredictable
- **Token-budget-based**: Requires counting tokens before query, adds latency
- **Load all messages**: Poor performance for long conversations, unnecessary context
- **Last 50 messages**: Excessive for most conversations, higher latency and cost

**Rationale**: Fixed message count provides predictable performance, 20 messages covers typical conversation depth while keeping queries fast and token costs manageable.

---

### 3. Agent System Prompt Design

**Question**: What instructions enable accurate natural language → tool selection mapping?

**Research Findings**:
OpenAI Agents SDK agents use natural language instructions to guide behavior. Clear, specific instructions with examples improve tool selection accuracy.

**Decision**: Use structured system prompt with role definition, tool guidance, and conversational tone instructions.

**OpenRouter Configuration** (Required - No OpenAI API Key):
Since we're using OpenRouter instead of direct OpenAI API access, we need to configure the OpenAI Agents SDK to use OpenRouter's base URL and API key.

```python
import os
from openai import OpenAI

# Configure OpenAI client for OpenRouter
openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Pass custom client to Agent (if SDK supports it)
# OR set environment variables that SDK will pick up:
os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
```

**Model Selection via OpenRouter**:
OpenRouter provides access to multiple LLM providers. Use OpenRouter's model naming format:
- `openai/gpt-4o` - OpenAI GPT-4o
- `openai/gpt-4-turbo` - OpenAI GPT-4 Turbo
- `anthropic/claude-3-5-sonnet` - Anthropic Claude 3.5 Sonnet
- `meta-llama/llama-3.1-70b-instruct` - Meta Llama 3.1

**System Prompt Template**:
```python
AGENT_INSTRUCTIONS = """You are a helpful task management assistant.

Your role:
- Help users create, view, update, complete, and delete tasks
- Understand natural language requests and use the appropriate tools
- Provide friendly, conversational responses
- Ask clarifying questions when requests are ambiguous

Available tools and when to use them:
- add_task: User wants to create a new task (e.g., "add", "create", "remind me to")
- list_tasks: User wants to see their tasks (e.g., "show", "list", "what tasks")
- complete_task: User finished a task (e.g., "done", "finished", "completed")
- update_task: User wants to modify a task (e.g., "change", "update", "edit")
- delete_task: User wants to remove a task (e.g., "delete", "remove", "cancel")

Response style:
- Be conversational and friendly (not robotic)
- Confirm actions taken (e.g., "I've added 'Buy milk' to your tasks")
- If a task isn't found, suggest viewing all tasks
- For destructive operations (delete), confirm what was removed

Example interactions:
User: "Add a task to buy groceries"
Assistant: [calls add_task] "I've added 'Buy groceries' to your tasks!"

User: "What do I need to do?"
Assistant: [calls list_tasks] "Here are your current tasks: ..."

User: "I finished buying groceries"
Assistant: [calls complete_task] "Great! I've marked 'Buy groceries' as complete."
"""

agent = Agent(
    name="Task Manager",
    instructions=AGENT_INSTRUCTIONS,
    model="openai/gpt-4o",  # OpenRouter model format
    tools=[add_task, list_tasks, complete_task, update_task, delete_task],
)
```

**Prompt Engineering Best Practices**:
1. **Define role clearly**: "You are a task management assistant"
2. **List tools with triggers**: Map natural language patterns to tools
3. **Provide examples**: Show ideal request/response pairs
4. **Set tone**: Conversational, not robotic
5. **Handle edge cases**: Guidance for ambiguity and errors

**Alternatives Considered**:
- **Minimal prompt**: "Help users manage tasks" - too vague, poor tool selection
- **Detailed examples for every tool**: Verbose, harder to maintain
- **Include tool schemas in prompt**: Redundant (SDK provides this automatically)

**Rationale**: Structured prompt with role, tool mapping, and examples provides clear guidance without overwhelming the agent. Conversational tone requirements ensure friendly user experience.

---

### 4. MCP Tool Error Handling

**Question**: How should agent handle MCP tool failures or invalid responses?

**Research Findings**:
OpenAI Agents SDK function tools can raise exceptions, which the agent can observe and retry or report to the user. Tool functions should return structured data or raise descriptive exceptions.

**Decision**: Use try/except in tool wrappers to catch MCP/API errors and return user-friendly error messages as tool results.

**Implementation Pattern**:
```python
from agents import function_tool

@function_tool
async def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Create a new task for the user.

    Args:
        user_id: User identifier
        title: Task title
        description: Optional description
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                "http://localhost:8000/api/v1/tasks",
                json={"user_id": user_id, "title": title, "description": description}
            )
            response.raise_for_status()
            return response.json()

    except httpx.TimeoutException:
        return {
            "error": "Request timed out",
            "message": "The task service is taking too long to respond. Please try again."
        }

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            return {
                "error": "Invalid input",
                "message": "The task title or description is invalid. Please check your input."
            }
        elif e.response.status_code == 401:
            return {
                "error": "Authentication failed",
                "message": "Unable to authenticate. Please try logging in again."
            }
        else:
            return {
                "error": "Server error",
                "message": "Something went wrong. Please try again later."
            }

    except Exception as e:
        # Log unexpected errors for debugging
        logger.error(f"Unexpected error in add_task: {str(e)}")
        return {
            "error": "Unexpected error",
            "message": "An unexpected error occurred. Please try again."
        }
```

**Error Handling Strategy**:
1. **Catch all exceptions**: Don't let tool failures crash the agent
2. **Return structured errors**: `{"error": "type", "message": "user-friendly text"}`
3. **User-friendly messages**: No stack traces or technical jargon
4. **Log details**: Keep technical details in server logs for debugging
5. **Let agent handle**: Agent can communicate error to user naturally

**Agent Error Response Example**:
```
User: "Add a task to buy milk"
Tool returns: {"error": "Request timed out", "message": "..."}
Agent: "I'm sorry, but I'm having trouble reaching the task service right now. Could you try again in a moment?"
```

**Alternatives Considered**:
- **Raise exceptions**: Agent sees raw error, poor user experience
- **Retry logic in tool**: Adds latency, agent can retry if needed
- **Return None on error**: Agent has no context about what went wrong

**Rationale**: Structured error returns give the agent context to provide helpful responses while keeping technical details out of user view. Logging ensures debugging capability.

---

### 5. Agent Response Streaming

**Question**: Should agent responses be streamed to frontend or sent as complete messages?

**Research Findings**:
OpenAI Agents SDK supports streaming via `Runner.run_streamed()`. Streaming provides better UX (typing indicator, progressive response) but adds complexity. FastAPI supports Server-Sent Events (SSE) for streaming.

**Decision**: Implement **non-streaming** initially, add streaming as optional enhancement later.

**Implementation Pattern (Non-Streaming)**:
```python
from agents import Runner

async def run_agent(agent: Agent, user_message: str, history: list, context: dict) -> str:
    """Run agent and return complete response."""
    result = await Runner.run(
        agent,
        history + [UserMessageItem(content=user_message)],
        context=context
    )
    return result.final_output
```

**Future Streaming Implementation** (documented for reference):
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from agents import Runner

async def stream_agent_response(agent, user_message, history, context):
    """Generator for streaming agent responses."""
    async def generate():
        async for event in Runner.run_streamed(
            agent,
            history + [UserMessageItem(content=user_message)],
            context=context
        ):
            if hasattr(event, "text"):
                yield f"data: {json.dumps({'text': event.text})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

**Alternatives Considered**:
- **Stream immediately**: Adds complexity before validating core functionality
- **WebSocket**: More complex than SSE, overkill for one-way streaming

**Rationale**: Non-streaming is simpler to implement and test. Most agent operations (<2s) don't require streaming. Streaming can be added later without changing agent or tool code - only affects API endpoint.

---

## Architecture Summary

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FastAPI Backend                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ POST /api/v1/agent/chat                               │  │
│  │  1. Extract JWT → user_id                            │  │
│  │  2. Load conversation history from DB                 │  │
│  │  3. Run agent with history + new message             │  │
│  │  4. Save user message & agent response to DB         │  │
│  │  5. Return response                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ OpenAI Agent (OpenAI Agents SDK)                     │  │
│  │  - Instructions: Task management system prompt       │  │
│  │  - Model: openai/gpt-4o (via OpenRouter)            │  │
│  │  - Tools: 5 MCP tool wrappers                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MCP Tool Wrappers (@function_tool)                   │  │
│  │  - add_task_wrapper()                                │  │
│  │  - list_tasks_wrapper()                              │  │
│  │  - complete_task_wrapper()                           │  │
│  │  - update_task_wrapper()                             │  │
│  │  - delete_task_wrapper()                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MCP Server (Existing - backend/src/mcp/server.py)    │  │
│  │  - Stateless tool server                             │  │
│  │  - Calls backend REST API endpoints                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Backend REST API (/api/v1/tasks/*)                   │  │
│  │  - Enforces user_id scoping                          │  │
│  │  - Database operations                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PostgreSQL Database                                  │  │
│  │  - conversations table                                │  │
│  │  - messages table                                     │  │
│  │  - tasks table                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Example

**User Request**: "Add a task to buy milk"

1. **API Endpoint** receives request with JWT
2. **Extract** user_id from JWT → "user_123"
3. **Load History** from database (last 20 messages for conversation_id)
4. **Run Agent** with history + new message + context {"user_id": "user_123"}
5. **Agent** interprets intent → decides to call `add_task` tool
6. **Tool Wrapper** calls MCP server → `add_task(user_id="user_123", title="Buy milk")`
7. **MCP Server** calls backend REST API → `POST /api/v1/tasks`
8. **Backend API** creates task in database, returns `{"task_id": "uuid", "title": "Buy milk", ...}`
9. **Tool Wrapper** returns result to agent
10. **Agent** generates response → "I've added 'Buy milk' to your tasks!"
11. **API Endpoint** saves user message and agent response to database
12. **Return** response to frontend

---

## Implementation Checklist

### Dependencies
- [x] OpenAI Agents SDK: `pip install openai-agents`
- [x] httpx: For calling MCP server (if not already installed)
- [x] Existing: MCP SDK, FastAPI, SQLModel, PostgreSQL client

### Code Artifacts to Create
- [ ] `backend/src/agent/config.py` - Agent configuration (model, instructions)
- [ ] `backend/src/agent/agent.py` - Agent initialization
- [ ] `backend/src/agent/tools.py` - MCP tool wrappers (@function_tool)
- [ ] `backend/src/agent/context.py` - Conversation history loader
- [ ] `backend/src/api/v1/agent.py` - POST /api/v1/agent/chat endpoint
- [ ] `backend/src/services/conversation_service.py` - Conversation CRUD
- [ ] `backend/src/services/message_service.py` - Message persistence
- [ ] `backend/tests/agent/test_agent.py` - Agent tests
- [ ] `backend/tests/agent/test_tools.py` - Tool wrapper tests
- [ ] `backend/tests/api/v1/test_agent_api.py` - API endpoint tests

### Configuration
- [ ] Add `OPENROUTER_API_KEY` to `.env` (NOT OPENAI_API_KEY)
- [ ] Add `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1` to `.env`
- [ ] Add agent model selection config (default: `openai/gpt-4o` - OpenRouter format)
- [ ] Add conversation history window size config (default: 20)
- [ ] Add MCP server connection settings
- [ ] Configure OpenAI Agents SDK to use OpenRouter base URL

---

## Future Frontend Integration Requirements

**Note**: This feature focuses on backend agent implementation only. ChatKit frontend integration is out of scope but documented here for future reference.

### ChatKit Configuration (Frontend - Out of Scope)

When integrating OpenAI ChatKit in the Next.js frontend (separate feature), the following configuration will be required:

**Environment Variables** (frontend/.env.local):
```bash
# OpenAI Domain Key for ChatKit
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here

# Optional: OpenRouter configuration if ChatKit needs direct LLM access
# (Note: Our architecture has ChatKit call backend agent API, not LLM directly)
NEXT_PUBLIC_AGENT_API_URL=http://localhost:8000/api/v1/agent/chat
```

**Domain Allowlist Configuration**:
- **Production**: Must add production domains to OpenAI Security → Domain Allowlist
- **Local Development**: `localhost` typically works without domain allowlist configuration
- **Staging**: Add staging domains to allowlist for testing

**ChatKit Integration Architecture** (Future):
```
User Input (ChatKit UI)
    ↓
POST /api/v1/agent/chat (Backend API)
    ↓
Agent (OpenAI Agents SDK via OpenRouter)
    ↓
MCP Tools
    ↓
Backend REST API
    ↓
Database
```

**Key Points**:
1. ChatKit is a UI component - it calls our backend agent API
2. ChatKit does NOT call OpenRouter directly - backend agent does
3. `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` is for ChatKit UI authentication, not LLM access
4. Our backend agent uses `OPENROUTER_API_KEY` for LLM calls
5. ChatKit receives responses from our agent API endpoint

**Future Implementation** (Separate Feature):
- Feature: Frontend ChatKit Integration
- Scope: Next.js frontend components, ChatKit setup, domain configuration
- Dependencies: This feature (backend agent API must be complete first)
- Tasks: Install ChatKit, configure domain key, connect to agent API, handle streaming

---

## Next Steps

1. **Create data-model.md**: Document existing Conversation/Message models (no new models needed)
2. **Create contracts/agent-api.yaml**: OpenAPI spec for POST /api/v1/agent/chat
3. **Create quickstart.md**: Developer setup and testing guide
4. **Generate tasks**: Run `/sp.tasks` to create implementation tasks from this research

---

**Research Status**: ✅ Complete
**All technical decisions resolved**: Yes
**Ready for Phase 1 (Design)**: Yes
