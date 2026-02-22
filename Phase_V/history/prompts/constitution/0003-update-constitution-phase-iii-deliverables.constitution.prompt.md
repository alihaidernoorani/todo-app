---
id: 0003
title: Update constitution with Phase III deliverables
stage: constitution
date: 2026-02-09
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 003-ai-todo-chatbot
user: alihaidernoorani
command: /sp.constitution
labels: ["constitution", "deliverables", "phase-iii", "project-structure"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - none
---

## Prompt

```text
Update the constitution to include these deliverables: Deliverables
1) GitHub repository with:
- /frontend – ChatKit-based UI
- /backend – FastAPI + Agents SDK + MCP
- /specs – Specification files for agent and MCP tools
- Database migration scripts
- README with setup instructions

2) Working chatbot that can:
- Manage tasks through natural language via MCP tools
- Maintain conversation context via database (stateless server)
- Provide helpful responses with action confirmations
- Handle errors gracefully
- Resume conversations after server restart
```

## Response snapshot

Updated constitution from version 2.0.0 to 2.1.0 (MINOR bump).

**Changes Made**:

1. **Updated Multi-Tier Isolation (Principle I)**:
   - Clarified directory structure: `/frontend`, `/backend` (now includes agent code), `/specs`
   - Backend explicitly contains FastAPI + Agents SDK + MCP tools (consolidated architecture)
   - Added `/specs` for agent and MCP tool specifications

2. **Added New Section: "Project Structure & Deliverables"**:
   - Repository structure requirements (directories and their contents)
   - Database migration scripts location (`/backend/alembic/versions/`)
   - README requirements (setup instructions, architecture overview)
   - Working chatbot deliverables in 5 categories:
     - Natural Language Task Management
     - Conversation Context Persistence
     - Helpful User Experience
     - Error Handling
     - Tool-Based Architecture
   - Acceptance criteria (100 concurrent conversations, <2s latency, no data loss)

3. **Updated Cross-References**:
   - Tool definitions location: `/agent/` → `/backend/`
   - Cross-phase principles section clarified

## Outcome

- ✅ Impact: Constitution now documents concrete Phase III deliverables and repository structure requirements
- 🧪 Tests: No tests (documentation update)
- 📁 Files: 1 modified (.specify/memory/constitution.md)
- 🔁 Next prompts: Begin implementing Phase III based on these requirements
- 🧠 Reflection: MINOR version bump appropriate as this adds new organizational requirements without breaking existing principles

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (documentation)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Validate templates alignment with new structure requirements
