---
id: 0002
title: agent-integration-research-and-planning
stage: plan
date: 2026-02-09
surface: agent
model: claude-sonnet-4-5-20250929
feature: 008-ai-agent-integration
branch: 008-ai-agent-integration
user: alihaidernoorani
command: /sp.plan
labels: ["planning", "research", "openai-agents-sdk", "mcp-integration", "openrouter", "architecture"]
links:
  spec: specs/008-ai-agent-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/008-ai-agent-integration/plan.md
 - specs/008-ai-agent-integration/research.md
tests:
 - Phase 0 research completed with OpenRouter configuration
 - All technical decisions documented
---

## Prompt

```text
User Request 1: /sp.plan
Feature: AI Agent Integration

Context:
Phase III requires an AI agent that can manage tasks through
natural language using MCP tools.

The agent will:
- Receive user messages
- Interpret user intent
- Decide which MCP tool to call
- Call the tool via MCP
- Return a friendly natural-language response

Available MCP tools:
- add_task
- list_tasks
- complete_task
- update_task
- delete_task

The system already has:
- Conversation and Message database models
- Stateless MCP server with all task tools implemented

Goal:
Create a clear, step-by-step implementation plan for integrating
an AI agent using the OpenAI Agents SDK that can call MCP tools
to manage tasks.

Constraints:
- Must use OpenAI Agents SDK (use openai-agents-sdk skill)
- Agent must only interact with tasks through MCP tools
- No direct database access from the agent
- Must support conversation history
- Must remain stateless outside of stored conversations

User Request 2: Research on how to create the agent

User Request 3: Update for OpenRouter
Please put into consideration in the plan that I don't have OpenAI API key
so I will have to use OpenRouter and connect it to the agent using chat
completions model

User Request 4: ChatKit Requirements
Kindly note and research on this also: Environment Variables
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here

Note: The hosted ChatKit option only works after adding the correct domains
under Security → Domain Allowlist. Local development (`localhost`) typically
works without this configuration.
```

## Response snapshot

Created comprehensive implementation plan and completed Phase 0 research for AI Agent Integration with OpenRouter configuration.

**Plan Artifacts Created**:
1. **plan.md** - Complete implementation plan with:
   - Technical context updated for OpenRouter (no OpenAI API key needed)
   - LLM Provider: OpenRouter with chat completions model
   - Constitution check (all 13 principles validated)
   - Project structure (backend/src/agent/ directory, no new DB models)
   - Phase 0-2 breakdown with research tasks
   - Updated dependencies and external services (OpenRouter API)
   - Risk assessment including OpenRouter compatibility considerations

2. **research.md** - Phase 0 research with 5 resolved technical decisions:
   - **MCP Integration Pattern**: Wrapper functions (@function_tool) that call MCP server via HTTP
   - **Conversation History**: Load last 20 messages from database (<50ms query time)
   - **System Prompt**: Structured prompt with role definition, tool mapping, examples
   - **Error Handling**: Try/except in wrappers returning user-friendly error messages
   - **Response Streaming**: Non-streaming initially (simpler), streaming as future enhancement
   - **OpenRouter Configuration**: How to configure OpenAI Agents SDK with OpenRouter base URL
   - **ChatKit Requirements**: Documented for future frontend integration (out of scope)

**Key Architecture Decisions**:

**Backend Agent (Current Feature)**:
- Agent uses OpenRouter API (not direct OpenAI) via custom base_url configuration
- Environment: `OPENROUTER_API_KEY` and `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- Model format: `openai/gpt-4o` (OpenRouter naming convention)
- Function tool wrappers call existing MCP server
- Stateless agent reconstructs conversation context from DB on each request
- POST /api/v1/agent/chat endpoint handles JWT auth, history loading, agent execution

**OpenRouter Integration**:
```python
import os
from openai import OpenAI

# Configure for OpenRouter
openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

agent = Agent(
    name="Task Manager",
    instructions=AGENT_INSTRUCTIONS,
    model="openai/gpt-4o",  # OpenRouter format
    tools=[add_task, list_tasks, complete_task, update_task, delete_task],
)
```

**Frontend ChatKit (Future Feature - Documented Only)**:
- Requires `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` for ChatKit UI
- Domain allowlist configuration needed for production
- ChatKit calls backend agent API (not OpenRouter directly)
- Backend handles all LLM interactions via OpenRouter

**Component Flow**:
```
User → ChatKit UI (future) → Backend Agent API → Agent (OpenAI SDK + OpenRouter) →
Tool Wrappers → MCP Server → Backend REST API → Database
```

**Configuration Summary**:

Backend (.env):
- `OPENROUTER_API_KEY=your-key-here`
- `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- `AGENT_MODEL=openai/gpt-4o`

Frontend (.env.local) - Future:
- `NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here`
- `NEXT_PUBLIC_AGENT_API_URL=http://localhost:8000/api/v1/agent/chat`

**Research Output**:
- Complete OpenRouter integration patterns with code examples
- Environment variable configuration for OpenRouter
- Model selection via OpenRouter (openai/gpt-4o, anthropic/claude-3-5-sonnet, etc.)
- ChatKit requirements documented for future frontend integration
- Error handling strategy with user-friendly messages
- Performance benchmarks (20 messages = <50ms query, <2s agent response)
- Architecture diagram showing all components including OpenRouter
- Implementation checklist with 10 artifacts to create

## Outcome

- ✅ Impact: Complete plan ready for task generation with OpenRouter configuration and all technical decisions resolved
- 🧪 Tests: Research validation - 5 technical questions answered + OpenRouter integration pattern + ChatKit requirements documented
- 📁 Files: 2 files created and updated (plan.md, research.md)
- 🔁 Next prompts: /sp.tasks (generate implementation tasks), create data-model.md, contracts/, quickstart.md
- 🧠 Reflection: OpenAI Agents SDK supports custom base_url making OpenRouter integration straightforward; ChatKit requirements documented for future frontend team; no OpenAI API key needed thanks to OpenRouter

## Evaluation notes (flywheel)

- Failure modes observed: None - iteratively refined plan based on user constraints (OpenRouter, ChatKit)
- Graders run and results (PASS/FAIL): Phase 0 research gate - PASS (all 5 technical questions + OpenRouter config + ChatKit requirements resolved)
- Prompt variant (if applicable): Standard sp.plan workflow enhanced with openai-agents-sdk skill + user-specific constraints (OpenRouter instead of OpenAI direct)
- Next experiment (smallest change to try): Proceed to Phase 1 (create data-model.md, contracts/agent-api.yaml, quickstart.md) then run /sp.tasks for implementation with OpenRouter configuration included in all tasks
