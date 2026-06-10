from typing import Literal

from pydantic import BaseModel, ConfigDict


TaskStatus = Literal["todo", "in-progress", "done"]

# API CONTRACT
# GET /api/tasks
#   response: [{"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}]
# POST /api/tasks
#   request:  {"title": str, "description": str, "status": "todo" | "in-progress" | "done"}
#   response: {"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}
# GET /api/tasks/{id}
#   response: {"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}
# PUT /api/tasks/{id}
#   request:  {"title": str, "description": str, "status": "todo" | "in-progress" | "done"}
#   response: {"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}
# DELETE /api/tasks/{id}
#   response: null


class TaskBase(BaseModel):
    """Shared task fields for request payloads."""

    title: str
    description: str
    status: TaskStatus


class TaskCreate(TaskBase):
    """Request schema for creating a task."""


class TaskUpdate(TaskBase):
    """Request schema for updating a task."""


class TaskRead(TaskBase):
    """Response schema for task payloads."""

    model_config = ConfigDict(from_attributes=True)

    id: int
