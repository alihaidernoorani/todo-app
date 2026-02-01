"""Integration tests for CLI functionality."""

import sys
from io import StringIO
from unittest.mock import patch
from cli import TodoCLI


def test_add_and_view_tasks():
    """Test adding and viewing tasks works together."""
    cli = TodoCLI()

    # Add a task
    cli.add_task("Test task 1")

    # Capture the output when viewing tasks
    import io
    import contextlib

    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        cli.view_tasks()
    output = f.getvalue()

    # Verify the task appears in the output
    assert "Test task 1" in output
    assert "Incomplete" in output


def test_complete_task_integration():
    """Test completing a task and viewing the change."""
    cli = TodoCLI()

    # Add a task
    cli.add_task("Task to complete")

    # Complete the task
    with patch('builtins.input', return_value='y'):  # Mock any interactive input
        cli.handle_command("complete 1")

    # Verify the task is now complete by viewing
    import io
    import contextlib

    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        cli.view_tasks()
    output = f.getvalue()

    assert "Complete" in output


def test_update_task_preserves_completion_status():
    """Test that updating a task preserves its completion status."""
    cli = TodoCLI()

    # Add and complete a task
    cli.add_task("Original task")
    cli.handle_command("complete 1")

    # Update the task title
    cli.handle_command('update 1 "Updated task"')

    # Verify the task is still complete
    import io
    import contextlib

    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        cli.view_tasks()
    output = f.getvalue()

    assert "Updated task" in output
    assert "Complete" in output  # Should still be complete after update


def test_delete_task():
    """Test that deleting a task removes it from the list."""
    cli = TodoCLI()

    # Add a task
    cli.add_task("Task to delete")

    # Delete the task
    cli.handle_command("delete 1")

    # Verify the task is gone by viewing
    import io
    import contextlib

    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        cli.view_tasks()
    output = f.getvalue()

    assert "Task to delete" not in output


def test_help_command():
    """Test that help command shows available commands."""
    cli = TodoCLI()

    # Capture help output
    import io
    import contextlib

    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        cli.handle_command("help")
    output = f.getvalue()

    # Verify help contains key commands
    assert "add" in output
    assert "view" in output
    assert "complete" in output
    assert "update" in output
    assert "delete" in output
    assert "help" in output