"""Business logic for todo operations with strictly monotonic ID generation."""

from typing import Dict, List
from models.task import Task


class TodoService:
    """Service class for todo operations with in-memory storage."""

    def __init__(self):
        """Initialize the todo service with an empty task store."""
        self.task_store: Dict[int, Task] = {}
        self.next_id: int = 1

    def _get_next_id(self) -> int:
        """Get the next available ID, ensuring strictly monotonic behavior."""
        # Find the next available ID that's not in use
        while self.next_id in self.task_store:
            self.next_id += 1
        current_id = self.next_id
        self.next_id += 1
        return current_id

    def add_task(self, title: str) -> Task:
        """Create a new task with unique ID.

        Args:
            title: The title of the task

        Returns:
            The created Task object

        Raises:
            ValueError: If title is empty or contains only whitespace
        """
        if not title or title.isspace():
            raise ValueError("Task title cannot be empty or contain only whitespace")

        task_id = self._get_next_id()
        task = Task(id=task_id, title=title.strip(), is_completed=False)
        self.task_store[task_id] = task
        return task

    def get_task(self, task_id: int) -> Task:
        """Retrieve a task by its ID.

        Args:
            task_id: The ID of the task to retrieve

        Returns:
            The Task object

        Raises:
            KeyError: If the task ID does not exist
        """
        if task_id not in self.task_store:
            raise KeyError(f"Task with ID {task_id} does not exist")
        return self.task_store[task_id]

    def list_tasks(self) -> List[Task]:
        """Return all tasks sorted by ID.

        Returns:
            A list of all Task objects sorted by ID
        """
        return sorted(self.task_store.values(), key=lambda task: task.id)

    def update_task(self, task_id: int, title: str) -> Task:
        """Update a task's title by its ID, preserving completion status.

        Args:
            task_id: The ID of the task to update
            title: The new title for the task

        Returns:
            The updated Task object

        Raises:
            KeyError: If the task ID does not exist
            ValueError: If title is empty or contains only whitespace
        """
        if task_id not in self.task_store:
            raise KeyError(f"Task with ID {task_id} does not exist")

        if not title or title.isspace():
            raise ValueError("Task title cannot be empty or contain only whitespace")

        current_task = self.task_store[task_id]
        # Preserve completion status, only update title
        updated_task = Task(id=current_task.id, title=title.strip(), is_completed=current_task.is_completed)
        self.task_store[task_id] = updated_task
        return updated_task

    def complete_task(self, task_id: int) -> Task:
        """Mark a task as complete (idempotent operation).

        This operation is idempotent - it always sets the task to completed
        regardless of its current state.

        Args:
            task_id: The ID of the task to mark as complete

        Returns:
            The updated Task object

        Raises:
            KeyError: If the task ID does not exist
        """
        if task_id not in self.task_store:
            raise KeyError(f"Task with ID {task_id} does not exist")

        current_task = self.task_store[task_id]
        # Always set to completed (idempotent behavior)
        completed_task = Task(id=current_task.id, title=current_task.title, is_completed=True)
        self.task_store[task_id] = completed_task
        return completed_task

    def delete_task(self, task_id: int) -> bool:
        """Delete a task by its ID.

        Args:
            task_id: The ID of the task to delete

        Returns:
            True if the task was successfully deleted, False if not found
        """
        if task_id in self.task_store:
            # Remove the task but don't reset next_id to maintain strictly monotonic behavior
            del self.task_store[task_id]
            return True
        return False