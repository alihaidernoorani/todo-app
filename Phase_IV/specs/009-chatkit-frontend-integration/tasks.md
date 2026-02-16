# Implementation Tasks: ChatKit Frontend Integration

**Feature**: ChatKit Frontend Integration
**Branch**: `003-ai-todo-chatbot`
**Created**: 2026-02-09
**Status**: Ready for Implementation
**Spec**: [spec.md](../spec.md)
**Plan**: [plan.md](../plan.md)

---

## Executive Summary

This tasks document breaks down the ChatKit Frontend Integration feature into small, sequential tasks. The implementation follows the priority order from the spec (User Story 1 first, then 2, then 3).

**Implementation Strategy**:
- Start with minimal viable chat functionality (US1)
- Extend with task operations (US2)
- Add polish and error handling (US3)
- Each user story is independently testable

---

## Dependencies

- Next.js 16+ (App Router) - Existing
- Better Auth client - Existing
- Tailwind CSS - Existing
- OpenAI ChatKit SDK - New dependency to install
- `uuid` library - New dependency to install

---

## Phase 1: Setup & Dependencies

### Setup Tasks
- [X] T001 Install ChatKit SDK and uuid dependencies: `pnpm add @openai/chatkit uuid`
- [X] T002 [P] Create directory structure: `frontend/components/chat/`, `frontend/lib/api/`, `frontend/lib/hooks/`

---

## Phase 2: Backend Endpoint Update

### API Endpoint Modification
- [X] T003 Update backend endpoint from `/api/v1/agent/chat` to `/api/{user_id}/chat`
- [X] T004 [P] Modify backend to accept user_id as path parameter instead of request body
- [X] T005 [P] Update backend request format to: `{ "message": string }`
- [X] T006 [P] Update backend response format to: `{ "response": string }`
- [X] T007 Test updated backend endpoint with curl to ensure it works correctly

### AI Agent Hybrid Mode Implementation (NEW)
- [X] Implemented hybrid mode: text-parsing for add_task, function calling for others
- [X] Created response_parser.py to extract add_task operations from agent text output
- [X] Updated agent_config.py with hybrid mode instructions
- [X] Modified agent_handler.py to combine tool calls from both sources
- [X] Updated agent.py to include tools EXCEPT add_task (list, complete, update, delete)
- [X] Updated runner.py to run with context and extract tool calls from function calling
- [X] Added comprehensive documentation in TEXT_PARSING_MODE.md and HYBRID_MODE_SUMMARY.md
- [X] Created test_response_parser.py with passing test cases (4/4 passed)

---

## Phase 3: Foundational Components

### API Client Implementation
- [X] T008 Create API client at `frontend/lib/api/chat.ts` with sendMessage function
- [ ] T009 [P] Implement authentication integration with Better Auth session in `frontend/lib/api/chat.ts`
- [ ] T010 [P] Connect to updated backend endpoint `POST /api/{user_id}/chat`
- [ ] T011 [P] Update API client to match new backend contract:
  - Request: `{message: string}`
  - Response: `{response: string}`
- [ ] T012 Test API client with updated backend to ensure proper integration

---

## Phase 4: [US1] Send Message and Receive Response

### User Story Goal
A user with an authenticated session wants to manage their tasks through natural language conversation with an AI assistant.

### Independent Test Criteria
User can open the chat page, type "Add a task to buy groceries", press send, and receive a confirmation response from the AI agent. This validates the entire end-to-end flow.

### Implementation Tasks

#### Message State Management
- [X] T013 Create custom hook `frontend/lib/hooks/useChatMessages.ts` for message state
- [X] T014 [P] Implement message array state management in `useChatMessages.ts`
- [X] T015 [P] Add loading state management to `useChatMessages.ts`
- [X] T016 [P] Add error state management to `useChatMessages.ts`
- [X] T017 [P] Implement send message handler in `useChatMessages.ts` that calls API client
- [X] T018 [P] Extract user_id from Better Auth session in the hook

#### ChatKit Integration
- [X] T019 Create ChatKit wrapper component at `frontend/components/chat/ChatKitWrapper.tsx`
- [X] T020 [P] Integrate ChatKit `<Chat>` component in `ChatKitWrapper.tsx`
- [X] T021 [P] Wire up messages prop from useChatMessages hook to ChatKit
- [X] T022 [P] Implement onSend callback to trigger useChatMessages.send
- [ ] T023 [P] Test ChatKit rendering with mock messages to verify basic functionality

#### Floating Widget Implementation
- [X] T024 Create floating widget container at `frontend/components/chat/ChatWidget.tsx`
- [X] T025 [P] Implement open/closed state management in ChatWidget
- [X] T026 [P] Add responsive layout styling for desktop (floating) and mobile (full-screen)
- [X] T027 [P] Integrate ChatKitWrapper inside ChatWidget component

#### Toggle Button
- [X] T028 Create toggle button component at `frontend/components/chat/ChatToggleButton.tsx`
- [X] T029 [P] Implement open/close functionality with ChatWidget
- [X] T030 [P] Add proper styling and accessibility attributes

#### Dashboard Integration
- [X] T031 Integrate ChatWidget and ChatToggleButton into `/frontend/app/dashboard/page.tsx`
- [X] T032 [P] Position floating widget independently of dashboard content
- [ ] T033 Test complete end-to-end flow: open widget → type message → send → receive response

### Test Cases for User Story 1
- [ ] TC-US1-01: Verify user message appears right-aligned
- [ ] TC-US1-02: Verify typing indicator appears during agent processing
- [ ] TC-US1-03: Verify assistant response appears left-aligned
- [ ] TC-US1-04: Verify auto-scroll to latest message
- [ ] TC-US1-05: Verify message history persists during session

---

## Phase 5: [US2] Perform Task Actions Through Chat

### User Story Goal
A user wants to create, update, complete, or delete tasks using natural language commands through the chat interface.

### Independent Test Criteria
User can send commands like "Mark task 5 as complete", "Delete the grocery shopping task", or "Update my meeting task to 3pm" and receive confirmation that the action was performed.

### Implementation Tasks

#### Enhanced Message Handling
- [X] T034 [P] Enhance useChatMessages hook to handle different message types
- [X] T035 [P] Add support for markdown rendering in assistant messages (using ChatKit built-in)
- [X] T036 [P] Implement message timestamp display (using ChatKit built-in)

#### Task Operation Commands
- [ ] T037 Test "Create task" commands to ensure backend integration works with MCP tools
- [ ] T038 [P] Test "Show tasks" commands to verify list rendering from database
- [ ] T039 [P] Test "Complete task" commands to verify confirmation responses from MCP tools
- [ ] T040 [P] Test "Delete task" commands to verify deletion confirmations from MCP tools

#### Backend Integration Verification
- [ ] T041 Verify integration with OpenAI Agent through updated endpoint
- [X] T042 [P] Verify MCP tools are properly invoked by the agent
- [ ] T043 [P] Verify database operations (Neon PostgreSQL + SQLModel) work correctly
- [ ] T044 [P] Test complete flow: UI → FastAPI → OpenAI Agent → MCP Tools → Database → Response

#### Message Formatting
- [ ] T045 Enhance assistant message styling to match spec requirements (complementary to user)
- [ ] T046 [P] Verify markdown rendering for task lists and structured responses from agent

### Test Cases for User Story 2
- [ ] TC-US2-01: Create task command results in successful task creation confirmation via MCP tools
- [ ] TC-US2-02: Show tasks command displays formatted task list from database
- [ ] TC-US2-03: Complete task command shows success confirmation from MCP tools
- [ ] TC-US2-04: Delete task command shows success confirmation from MCP tools

---

## Phase 6: [US3] Visual Feedback and Error Handling

### User Story Goal
A user wants clear visual feedback for message states and helpful error messages when something goes wrong.

### Independent Test Criteria
User can see typing indicators when waiting for a response, and receives clear error messages if the API call fails.

### Implementation Tasks

#### Loading and Input States
- [X] T047 Implement input field disabling during agent processing (FR-019)
- [X] T048 [P] Add visual feedback for disabled input state
- [X] T049 [P] Implement empty message validation to prevent sending (FR-012)

#### Error Handling Enhancement
- [X] T050 Enhance API client error handling for different status codes
- [X] T051 [P] Implement display of session expiry errors in chat (401/403)
- [X] T052 [P] Implement display of network error messages in chat
- [X] T053 [P] Implement display of agent unavailable errors in chat (500)
- [X] T054 [P] Handle MCP tool execution errors and display appropriately

#### Visual Polish
- [X] T055 Create theme configuration to match existing page design
- [X] T056 [P] Apply proper styling to user messages (right-aligned, primary colors)
- [X] T057 [P] Apply proper styling to assistant messages (left-aligned, complementary colors)
- [X] T058 [P] Add proper touch targets for mobile (minimum 44x44px) (FR-021)

#### Responsive Behavior
- [X] T059 Verify responsive behavior on mobile viewports (≤768px) (FR-020)
- [X] T060 [P] Verify no horizontal scrolling on any device (FR-022)

### Test Cases for User Story 3
- [ ] TC-US3-01: Verify typing indicator appears during processing (FR-018)
- [ ] TC-US3-02: Verify input field disables during loading (FR-019)
- [ ] TC-US3-03: Verify empty messages cannot be sent (FR-012)
- [ ] TC-US3-04: Verify network errors show proper user-friendly messages
- [ ] TC-US3-05: Verify session expiry errors show proper user-friendly messages
- [ ] TC-US3-06: Verify MCP tool errors are handled gracefully

---

## Phase 7: Testing & Documentation

### Testing Tasks
- [ ] T061 Execute all manual test cases for User Story 1
- [ ] T062 [P] Execute all manual test cases for User Story 2
- [ ] T063 [P] Execute all manual test cases for User Story 3
- [ ] T064 [P] Test responsive layouts on desktop and mobile
- [ ] T065 [P] Test edge cases (long messages, rapid sending, errors)
- [ ] T066 [P] Test complete integration flow: ChatKit → FastAPI → OpenAI Agent → MCP Tools → Database → Response

### Documentation Tasks
- [X] T067 Update README.md with chat feature documentation section
- [X] T068 [P] Add usage instructions for the chat interface
- [X] T069 [P] Document chat features and capabilities
- [X] T070 [P] Document the complete architecture: UI → Agent → Tools → DB

### Final Validation
- [ ] T071 Verify all functional requirements (FR-001 through FR-022) are satisfied
- [ ] T072 [P] Verify all success criteria (SC-001 through SC-005) are met
- [ ] T073 [P] Conduct final end-to-end testing of complete feature including backend integration

---

## Implementation Notes

### MVP Approach
1. **Backend Update** (Tasks T001-T007): Update backend to match spec
2. **Core Functionality** (Tasks T008-T033): Basic chat flow working with updated backend
3. **Task Operations** (Tasks T034-T046): Full task management via chat through MCP tools
4. **Polish & Error Handling** (Tasks T047-T060): Production-ready experience
5. **Documentation** (Tasks T061-T073): Complete feature validation

### Parallel Opportunities
- Tasks marked [P] can be developed in parallel if working with multiple developers
- Frontend development can proceed after backend updates are complete
- Different aspects of message handling can be tackled simultaneously

### Critical Path
- T001,T002,T003,T004,T005,T006,T007 → Backend updates
- T008,T009,T010,T011,T013,T019,T024,T028,T031 → Basic functionality
- T034,T035,T036,T037 → Message enhancements
- T047,T050,T051,T052,T053 → Error handling
- T061,T062,T063 → Testing & validation

---

**Task Count**: 73 tasks across 7 phases
**Estimated Completion**: 2-3 weeks for full implementation
**MVP Scope**: Tasks T001-T033 (Backend updates + Basic chat functionality)
