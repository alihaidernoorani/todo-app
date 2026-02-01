"""Task dataclass definition for the Todo CLI application."""

from dataclasses import dataclass


@dataclass
class Task:
    """Represents a single todo item."""
    id: int
    title: str
    is_completed: bool = False