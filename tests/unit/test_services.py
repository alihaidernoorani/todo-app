"""Unit tests for the todo service functions."""

import pytest
from models.task import Task
from services.todo_service import TodoService


def test_add_task():
    """Test adding a task with a title."""
    store = TodoService()
    task = store.add_task("Buy groceries")

    assert task.id == 1
    assert task.title == "Buy groceries"
    assert task.is_completed == False


def test_add_task_empty_title():
    """Test that adding a task with empty title raises ValueError."""
    store = TodoService()

    with pytest.raises(ValueError, match="Task title cannot be empty or contain only whitespace"):
        store.add_task("")

    with pytest.raises(ValueError, match="Task title cannot be empty or contain only whitespace"):
        store.add_task("   ")


def test_list_tasks():
    """Test retrieving all tasks."""
    store = TodoService()
    store.add_task("Task 1")
    store.add_task("Task 2")

    tasks = store.list_tasks()

    assert len(tasks) == 2
    assert tasks[0].id == 1
    assert tasks[1].id == 2
    assert tasks[0].title == "Task 1"
    assert tasks[1].title == "Task 2"


def test_update_task():
    """Test updating a task's title while preserving completion status."""
    store = TodoService()
    original_task = store.add_task("Original task")

    # Complete the task first
    completed_task = store.complete_task(original_task.id)
    assert completed_task.is_completed == True

    # Update the task
    updated_task = store.update_task(original_task.id, "Updated task")

    assert updated_task.id == original_task.id
    assert updated_task.title == "Updated task"
    assert updated_task.is_completed == True  # Should preserve completion status


def test_update_task_empty_title():
    """Test that updating a task with empty title raises ValueError."""
    store = TodoService()
    task = store.add_task("Original task")

    with pytest.raises(ValueError, match="Task title cannot be empty or contain only whitespace"):
        store.update_task(task.id, "")

    with pytest.raises(ValueError, match="Task title cannot be empty or contain only whitespace"):
        store.update_task(task.id, "   ")


def test_update_nonexistent_task():
    """Test that updating a non-existent task raises KeyError."""
    store = TodoService()

    with pytest.raises(KeyError, match="Task with ID 999 does not exist"):
        store.update_task(999, "New title")


def test_complete_task():
    """Test completing a task."""
    store = TodoService()
    task = store.add_task("Incomplete task")
    assert task.is_completed == False

    completed_task = store.complete_task(task.id)

    assert completed_task.id == task.id
    assert completed_task.title == "Incomplete task"
    assert completed_task.is_completed == True


def test_complete_task_idempotent():
    """Test that completing an already completed task remains completed (idempotent behavior)."""
    store = TodoService()
    task = store.add_task("Task to complete")

    # Complete the task
    first_completion = store.complete_task(task.id)
    assert first_completion.is_completed == True

    # Complete it again (should remain completed)
    second_completion = store.complete_task(task.id)
    assert second_completion.is_completed == True


def test_complete_nonexistent_task():
    """Test that completing a non-existent task raises KeyError."""
    store = TodoService()

    with pytest.raises(KeyError, match="Task with ID 999 does not exist"):
        store.complete_task(999)


def test_delete_task():
    """Test deleting a task."""
    store = TodoService()
    task = store.add_task("Task to delete")

    result = store.delete_task(task.id)

    assert result == True
    assert len(store.list_tasks()) == 0


def test_delete_nonexistent_task():
    """Test deleting a non-existent task."""
    store = TodoService()

    result = store.delete_task(999)

    assert result == False


def test_strictly_monotonic_ids():
    """Test that IDs are strictly monotonic and not reused after deletion."""
    store = TodoService()

    # Add some tasks
    task1 = store.add_task("Task 1")
    task2 = store.add_task("Task 2")
    task3 = store.add_task("Task 3")

    assert task1.id == 1
    assert task2.id == 2
    assert task3.id == 3

    # Delete task 2
    store.delete_task(2)

    # Add a new task - should get ID 4, not reuse ID 2
    task4 = store.add_task("Task 4")
    assert task4.id == 4

    # Verify the IDs in the store
    tasks = store.list_tasks()
    task_ids = [t.id for t in tasks]
    assert task_ids == [1, 3, 4]  # task 2 was deleted