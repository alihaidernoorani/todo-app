# Hybrid Mode Implementation

## Overview

The AI agent operates in **hybrid mode**:
- **add_task**: Text-parsing (outputs "Task added: X")
- **Other operations**: Function calling with MCP tools

This approach provides a fallback for add_task while keeping standard tool calling for other operations.

## How It Works

### 1. Agent Output Pattern

When a user requests to add a task, the agent outputs a specific pattern:

```
User: Add a task to buy groceries
Agent: Task added: Buy groceries
```

The pattern must be EXACT: `Task added: <task_name>`

### 2. Response Parsing

The `response_parser.py` module detects these patterns using regex:

```python
Pattern: r"Task added:\s*(.+?)(?:\n|$)"
```

When detected, it extracts the task name and creates a `ParsedTaskOperation` object.

### 3. Backend API Call

The `agent_handler.py` processes the parsed operation:

1. Detects the pattern in the agent's response
2. Calls the backend REST API directly: `POST /api/{user_id}/tasks`
3. Persists the task to the database
4. Records the operation in `tool_calls` for the response

## Architecture Changes

### Hybrid Mode

**For add_task (text-parsing):**
```
User: "Add a task to buy milk"
  → Agent (no add_task tool)
    → "Task added: Buy milk" output
      → Response Parser
        → Backend API directly
          → Database
```

**For other operations (function calling):**
```
User: "List my tasks"
  → Agent with tools [list_tasks, complete_task, update_task, delete_task]
    → OpenAI SDK calls list_tasks()
      → MCP Tool
        → Backend API
          → Database
```

## Modified Files

1. **`agent_config.py`**: Hybrid instructions - text pattern for add_task, tools for others
2. **`agent.py`**: Includes tools EXCEPT add_task (list_tasks, complete_task, update_task, delete_task)
3. **`runner.py`**: Runs agent with context for tools, extracts tool calls from function calling
4. **`agent_handler.py`**: Collects tool calls from both sources (function calling + text parsing)
5. **`response_parser.py`**: NEW - Pattern detection for add_task only

## Agent Instructions

The agent is instructed to:

- Output EXACTLY: `Task added: <task_name>`
- NOT use variations like "I've added..." or quotes around the task name
- Extract the task name from the user's message
- Keep it concise but capture user intent

## Examples

### ✅ Correct Output

```
Task added: Buy groceries
Task added: Call dentist
Task added: Buy almond milk
```

### ❌ Incorrect Output

```
I've added 'buy groceries' to your task list.  ← conversational, won't parse
Task added: 'Buy groceries'                    ← has quotes, will be stripped
Added task: Buy groceries                      ← wrong pattern
```

## Testing

Run the response parser test:

```bash
cd backend
python3 test_response_parser.py
```

Expected output:
```
✓ Test 1 passed: Basic add task
✓ Test 2 passed: Task with quotes stripped
✓ Test 3 passed: No false positives
✓ Test 4 passed: Multi-line response
✅ All tests passed!
```

## Limitations

- Only `add_task` operation is implemented with text parsing
- Other operations (list, complete, update, delete) still use conversational text
- Future extension could add patterns for other operations

## Benefits

- Works with models that don't support function calling
- Simple, predictable output format
- Easy to debug (just check the agent's text output)
- No dependency on OpenAI Agents SDK tool calling

## API Contract

### Request

```json
POST /api/{user_id}/chat
{
  "message": "Add a task to buy groceries"
}
```

### Agent Response

```
Task added: Buy groceries
```

### Backend Processing

1. Parse response → extract "Buy groceries"
2. Call `POST /api/{user_id}/tasks` with `{"title": "Buy groceries"}`
3. Return task creation result in `tool_calls` array

### Response

```json
{
  "conversation_id": "uuid",
  "user_message_id": "uuid",
  "agent_message_id": "uuid",
  "agent_response": "Task added: Buy groceries",
  "tool_calls": [
    {
      "tool_name": "add_task",
      "arguments": {"title": "Buy groceries"},
      "result": {"id": "task-uuid", "title": "Buy groceries", ...}
    }
  ]
}
```

## Logging

The backend logs every step:

```
INFO: Parsed add_task operation: task_name='Buy groceries'
INFO: Backend API call successful: task_id=abc-123
INFO: Chat request processed: conversation_id=xyz, parsed_operations=1, backend_calls=1
```

## Future Enhancements

Potential patterns for other operations:

```
Task updated: <task_name>
Task completed: <task_name>
Task deleted: <task_name>
Tasks list: [task1, task2, task3]
```

These would require:
1. Adding patterns to `response_parser.py`
2. Adding backend API calls to `agent_handler.py`
3. Updating agent instructions in `agent_config.py`
