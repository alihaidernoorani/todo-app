"""Custom exception classes for the Todo API."""


class TodoAppError(Exception):
    """Base exception for Todo application."""

    def __init__(self, message: str = "An error occurred") -> None:
        self.message = message
        super().__init__(self.message)


class NotFoundError(TodoAppError):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str = "Resource", identifier: str = "") -> None:
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id '{identifier}' not found"
        super().__init__(message)


class ValidationError(TodoAppError):
    """Raised when input validation fails."""

    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(message)


class DatabaseError(TodoAppError):
    """Raised when database operations fail."""

    def __init__(self, message: str = "Database operation failed") -> None:
        super().__init__(message)
