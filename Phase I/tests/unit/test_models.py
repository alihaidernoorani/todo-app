"""Unit tests for the Task model."""

from models.task import Task


def test_task_creation():
    """Test creating a Task instance."""
    task = Task(id=1, title="Test task")

    assert task.id == 1
    assert task.title == "Test task"
    assert task.is_completed == False  # Should default to False


def test_task_creation_with_completion_status():
    """Test creating a Task instance with explicit completion status."""
    task = Task(id=2, title="Completed task", is_completed=True)

    assert task.id == 2
    assert task.title == "Completed task"
    assert task.is_completed == True


def test_task_attributes():
    """Test that Task has the correct attributes."""
    task = Task(id=1, title="Sample task", is_completed=False)

    assert hasattr(task, 'id')
    assert hasattr(task, 'title')
    assert hasattr(task, 'is_completed')

    assert isinstance(task.id, int)
    assert isinstance(task.title, str)
    assert isinstance(task.is_completed, bool)