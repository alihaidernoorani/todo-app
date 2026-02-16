"""Quick test for response parser functionality."""

from src.agents.core.response_parser import parse_agent_response

def test_parse_add_task():
    """Test parsing 'Task added:' pattern."""

    # Test case 1: Basic add task
    response1 = "Task added: Buy groceries"
    result1 = parse_agent_response(response1)

    assert result1 is not None, "Should detect add task operation"
    assert result1.operation == 'add', "Should be add operation"
    assert result1.task_name == "Buy groceries", f"Task name should be 'Buy groceries', got '{result1.task_name}'"

    print("✓ Test 1 passed: Basic add task")

    # Test case 2: Task with quotes
    response2 = 'Task added: "Call dentist"'
    result2 = parse_agent_response(response2)

    assert result2 is not None, "Should detect add task operation"
    assert result2.task_name == "Call dentist", f"Should strip quotes, got '{result2.task_name}'"

    print("✓ Test 2 passed: Task with quotes stripped")

    # Test case 3: No match
    response3 = "I've added 'buy milk' to your task list."
    result3 = parse_agent_response(response3)

    assert result3 is None, "Should not match conversational format"

    print("✓ Test 3 passed: No false positives")

    # Test case 4: Multi-line response
    response4 = """Task added: Buy almond milk

I've added this task to your list."""
    result4 = parse_agent_response(response4)

    assert result4 is not None, "Should detect pattern in multi-line response"
    assert result4.task_name == "Buy almond milk", f"Should extract task name, got '{result4.task_name}'"

    print("✓ Test 4 passed: Multi-line response")

    print("\n✅ All tests passed!")


if __name__ == "__main__":
    test_parse_add_task()
