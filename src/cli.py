"""Main CLI entry point with interactive loop for the todo application."""

import sys
from typing import List
from models.task import Task
from services.todo_service import TodoService


class TodoCLI:
    """Command-line interface for the todo application."""

    def __init__(self):
        """Initialize the CLI with a todo service."""
        self.service = TodoService()
        self.running = True

    def display_tasks(self, tasks: List[Task]) -> None:
        """Display tasks in a tabular format with aligned columns."""
        if not tasks:
            print("No tasks found. Use 'add' to create one.")
            return

        # Calculate column widths for alignment
        id_width = max(2, len("ID"))  # At least 2 for "ID"
        title_width = max(5, len("Title"))  # At least 5 for "Title"
        status_width = max(6, len("Status"))  # At least 6 for "Status"

        for task in tasks:
            id_width = max(id_width, len(str(task.id)))
            title_width = max(title_width, len(task.title))
            status_width = max(status_width, len("Complete" if task.is_completed else "Incomplete"))

        # Print header
        print(f"{'ID':<{id_width}}  {'Title':<{title_width}}  {'Status':<{status_width}}")
        print(f"{'-' * id_width}  {'-' * title_width}  {'-' * status_width}")

        # Print tasks
        for task in tasks:
            status = "Complete" if task.is_completed else "Incomplete"
            print(f"{task.id:<{id_width}}  {task.title:<{title_width}}  {status:<{status_width}}")

    def add_task(self, title: str) -> None:
        """Add a new task with the given title."""
        try:
            task = self.service.add_task(title)
            print(f"Task added: ID={task.id}, Title=\"{task.title}\", Status={'Complete' if task.is_completed else 'Incomplete'}")
        except ValueError as e:
            print(f"Error: {e}")

    def view_tasks(self) -> None:
        """Display all tasks in tabular format."""
        tasks = self.service.list_tasks()
        self.display_tasks(tasks)

    def get_interactive_input(self, prompt: str) -> str:
        """Get input interactively from the user."""
        return input(prompt)

    def handle_command(self, command: str) -> None:
        """Handle a single command from the user."""
        parts = command.strip().split()
        if not parts:
            return

        cmd = parts[0].lower()

        if cmd == "add":
            if len(parts) < 2:
                # Interactive mode: prompt for title
                try:
                    title = self.get_interactive_input("Enter task title: ")
                    if title.strip():
                        self.add_task(title)
                    else:
                        print("Error: Task title cannot be empty or contain only whitespace. Usage: add \"task title\"")
                except (EOFError, KeyboardInterrupt):
                    print()
                    return
            else:
                # Inline mode: extract title from command
                title = " ".join(parts[1:])
                # Remove surrounding quotes if they exist
                if len(title) >= 2 and title.startswith('"') and title.endswith('"'):
                    title = title[1:-1]
                elif len(title) >= 2 and title.startswith("'") and title.endswith("'"):
                    title = title[1:-1]
                self.add_task(title)
        elif cmd == "view":
            self.view_tasks()
        elif cmd == "complete":
            if len(parts) < 2:
                print("Usage: complete <task_id>")
                return
            try:
                task_id = int(parts[1])
                try:
                    task = self.service.complete_task(task_id)
                    print(f"Task {task.id} marked as complete")
                except KeyError:
                    print(f"Error: Task with ID {task_id} does not exist. Use 'view' to see available tasks.")
            except ValueError:
                print("Error: Please provide a valid task ID as a number. Usage: complete 1")
        elif cmd == "update":
            if len(parts) < 3:
                # Interactive mode: prompt for new title
                if len(parts) == 2:
                    try:
                        task_id = int(parts[1])
                        try:
                            # Get current task to show to user
                            current_task = self.service.get_task(task_id)
                            new_title = self.get_interactive_input(f"Enter new title for task {task_id} (current: \"{current_task.title}\"): ")
                            if new_title.strip():
                                updated_task = self.service.update_task(task_id, new_title)
                                print(f"Task updated: ID={updated_task.id}, Title=\"{updated_task.title}\", Status={'Complete' if updated_task.is_completed else 'Incomplete'}")
                            else:
                                print("Error: Task title cannot be empty or contain only whitespace. Usage: update <id> \"new title\"")
                        except KeyError:
                            print(f"Error: Task with ID {task_id} does not exist. Use 'view' to see available tasks.")
                    except ValueError:
                        print("Error: Please provide a valid task ID as a number. Usage: update <id> \"new title\"")
                else:
                    print("Usage: update <task_id> \"new title\" or update <task_id> (for interactive mode)")
            else:
                # Inline mode: extract new title from command
                try:
                    task_id = int(parts[1])
                    new_title = " ".join(parts[2:])
                    # Remove surrounding quotes if they exist
                    if len(new_title) >= 2 and new_title.startswith('"') and new_title.endswith('"'):
                        new_title = new_title[1:-1]
                    elif len(new_title) >= 2 and new_title.startswith("'") and new_title.endswith("'"):
                        new_title = new_title[1:-1]
                    try:
                        updated_task = self.service.update_task(task_id, new_title)
                        print(f"Task updated: ID={updated_task.id}, Title=\"{updated_task.title}\", Status={'Complete' if updated_task.is_completed else 'Incomplete'}")
                    except KeyError:
                        print(f"Error: Task with ID {task_id} does not exist. Use 'view' to see available tasks.")
                    except ValueError as e:
                        print(f"Error: {e}")
                except ValueError:
                    print("Error: Please provide a valid task ID as a number. Usage: update <id> \"new title\"")
        elif cmd == "delete":
            if len(parts) < 2:
                print("Usage: delete <task_id>")
                return
            try:
                task_id = int(parts[1])
                success = self.service.delete_task(task_id)
                if success:
                    print(f"Task {task_id} deleted")
                else:
                    print(f"Error: Task with ID {task_id} does not exist. Use 'view' to see available tasks.")
            except ValueError:
                print("Error: Please provide a valid task ID as a number. Usage: delete 1")
        elif cmd == "help":
            print("Available commands: add, view, update, complete, delete, help, exit, quit")
            print("Usage examples:")
            print("- add \"Buy groceries\" (inline) or just 'add' (interactive)")
            print("- view")
            print("- update 1 \"New title\" (inline) or 'update 1' (interactive)")
            print("- complete 1")
            print("- delete 1")
        elif cmd == "exit" or cmd == "quit":
            self.running = False
            print("Goodbye!")
        else:
            print(f"Unknown command: {cmd}. Type 'help' for available commands.")


    def run(self) -> None:
        """Run the interactive CLI loop."""
        print("Welcome to the Todo App!")
        print("Type 'help' for available commands, or 'exit' to quit.")

        while self.running:
            try:
                command = input("todo> ")
                self.handle_command(command)
            except KeyboardInterrupt:
                print("\nGoodbye!")
                sys.exit(0)
            except EOFError:
                print("\nGoodbye!")
                sys.exit(0)


def main():
    """Main entry point for the application."""
    cli = TodoCLI()
    cli.run()


if __name__ == "__main__":
    main()