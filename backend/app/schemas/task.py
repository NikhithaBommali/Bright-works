from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TaskStatus = Literal["todo", "in-progress", "done"]


class TaskBase(BaseModel):
    title: str = Field(min_length=1)
    description: str
    status: TaskStatus


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class TaskRead(TaskBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
