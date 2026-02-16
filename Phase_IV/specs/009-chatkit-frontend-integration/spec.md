# Feature Specification: ChatKit Frontend Integration

**Feature Branch**: `003-ai-todo-chatbot`
**Created**: 2026-02-09
**Status**: Draft
**Input**: User description: "Feature: ChatKit Frontend Integration - Replace the manual task UI with a chatbot-style interface using the ChatKit SDK that connects to the backend AI agent."

## Clarifications

### Session 2026-02-09

- Q: Chat Layout Structure: Should the chat be a full-page interface, a centered panel, or a floating widget? → A: Colourful floating widget that goes well with the layout of the pages
- Q: Visual Design Style: Should the design be minimal/clean, modern SaaS, or dark mode oriented? → A: Match the design of the page and be visually pleasing - Chatbot styling should adapt to and complement the existing page design while remaining functional for task control
- Q: Message Bubble Content & Formatting: Should messages include avatars, timestamps, and rich text formatting? → A: Colors + Timestamps + Rich text formatting (markdown support for bold, lists, code blocks)
- Q: Chat Interaction Behavior: Should it auto-scroll, show typing indicators, disable input while loading, or allow resending on error? → A: Auto-scroll + Typing indicator + Disable input while loading (no retry button, show error message instead)
- Q: Mobile & Responsive Strategy: Should the UI prioritize desktop-first, mobile-first, or equal responsiveness? → A: Equal responsiveness - Fully optimized for both desktop and mobile with adaptive layout (floating widget adjusts size/position)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send Message and Receive Response (Priority: P1)

A user with an authenticated session wants to manage their tasks through natural language conversation with an AI assistant.

**Why this priority**: This is the core value proposition - enabling natural language task management. Without this, the feature has no value.

**Independent Test**: User can open the chat page, type "Add a task to buy groceries", press send, and receive a confirmation response from the AI agent. This validates the entire end-to-end flow.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they navigate to the chat page, **Then** they see an empty chat interface with an input field and send button
2. **Given** a user is on the chat page, **When** they type a message and click send, **Then** the message appears as a right-aligned bubble in the chat
3. **Given** a user sent a message, **When** the AI agent processes the request, **Then** a loading indicator appears
4. **Given** the AI agent completes processing, **When** the response is received, **Then** the response appears as a left-aligned bubble in the chat
5. **Given** multiple messages have been exchanged, **When** the user scrolls through the chat, **Then** the message history is preserved and scrollable

---

### User Story 2 - Perform Task Actions Through Chat (Priority: P2)

A user wants to create, update, complete, or delete tasks using natural language commands through the chat interface.

**Why this priority**: This extends the basic chat functionality to actually manipulate tasks, which is the primary use case for the feature.

**Independent Test**: User can send commands like "Mark task 5 as complete", "Delete the grocery shopping task", or "Update my meeting task to 3pm" and receive confirmation that the action was performed.

**Acceptance Scenarios**:

1. **Given** a user types "Create a task to call the dentist", **When** the agent processes the request, **Then** a new task is created and the user receives a confirmation message
2. **Given** a user has existing tasks, **When** they type "Show me all my tasks", **Then** the agent lists all current tasks in the chat
3. **Given** a user types "Complete task 3", **When** the agent processes the request, **Then** task 3 is marked as complete and confirmation is shown
4. **Given** a user types "Delete my shopping task", **When** the agent processes the request, **Then** the matching task is deleted and confirmation is shown

---

### User Story 3 - Visual Feedback and Error Handling (Priority: P3)

A user wants clear visual feedback for message states and helpful error messages when something goes wrong.

**Why this priority**: This improves user experience but the core functionality works without it. Can be added after basic chat is working.

**Independent Test**: User can see typing indicators when waiting for a response, and receives clear error messages if the API call fails.

**Acceptance Scenarios**:

1. **Given** a user sends a message, **When** the request is processing, **Then** a typing indicator or loading state appears
2. **Given** the API is unavailable, **When** a user sends a message, **Then** an error message appears explaining the issue
3. **Given** a user session expires, **When** they try to send a message, **Then** they receive a clear message to log in again
4. **Given** a user sends an empty message, **When** they click send, **Then** the send button is disabled or shows validation feedback

---

### Edge Cases

- What happens when the user's session expires during a chat conversation?
- How does the system handle very long messages (exceeding API limits)?
- What happens if the user sends multiple messages rapidly before the first response arrives?
- How does the chat handle network disconnections or timeout errors?
- What happens when the backend API returns an unexpected error format?
- How does the UI handle very long agent responses that exceed the visible area?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a chat interface as a colourful floating widget overlay that matches and complements the existing page design, with a scrollable message area and fixed input bar at the bottom
- **FR-002**: System MUST render user messages as right-aligned chat bubbles with styling that matches the page's design system and color palette
- **FR-003**: System MUST render assistant messages as left-aligned chat bubbles with complementary styling that visually distinguishes them from user messages while maintaining design consistency
- **FR-004**: System MUST send user messages to the backend endpoint POST /api/{user_id}/chat with the request body: `{"message": "user text"}`
- **FR-005**: System MUST extract the user_id from the authenticated session (better-auth)
- **FR-006**: System MUST display a loading or typing indicator while waiting for the agent's response
- **FR-007**: System MUST parse the API response format: `{"response": "assistant text"}` and display it in the chat
- **FR-008**: System MUST maintain message state in the frontend to preserve conversation history
- **FR-009**: System MUST append new assistant responses to the existing message list without overwriting previous messages
- **FR-010**: System MUST provide a send button to submit messages
- **FR-011**: System MUST make the message area scrollable when messages exceed the visible height
- **FR-012**: System MUST prevent sending empty messages
- **FR-013**: System MUST handle API errors gracefully and display user-friendly error messages
- **FR-014**: System MUST display timestamps for each message bubble showing when the message was sent
- **FR-015**: System MUST render markdown formatting in assistant messages (bold, italic, lists, code blocks) for structured task information
- **FR-016**: System MUST preserve plain text input from users (no markdown rendering for user messages)
- **FR-017**: System MUST auto-scroll the message area to show the latest message when a new message is added
- **FR-018**: System MUST display a typing indicator when waiting for the assistant's response
- **FR-019**: System MUST disable the input field and send button while a request is in progress to prevent double submissions
- **FR-020**: System MUST adapt the floating widget size and position responsively for mobile viewports (≤768px) and desktop viewports (>768px)
- **FR-021**: System MUST ensure touch-friendly target sizes (minimum 44x44px) for interactive elements on mobile devices
- **FR-022**: System MUST maintain full functionality across both desktop and mobile without horizontal scrolling

### Key Entities

- **Message**: Represents a single message in the chat conversation
  - Attributes: content (text), sender (user or assistant), timestamp
  - Relationship: Messages belong to a conversation session

- **User Session**: Represents the authenticated user context
  - Attributes: user_id (extracted from better-auth session)
  - Relationship: Used to scope API requests to the correct user

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can send a message and receive a response in under 5 seconds under normal network conditions
- **SC-002**: Chat interface loads and displays correctly on desktop and mobile viewports
- **SC-003**: 100% of valid task commands (create, update, delete, complete) sent through chat result in the correct backend action
- **SC-004**: Users can complete common task management operations (add task, mark complete, list tasks) through natural language chat with 90% success rate on first attempt
- **SC-005**: Chat message history is preserved for the duration of the user session without data loss
