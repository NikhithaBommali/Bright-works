from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class TodoUpdate(BaseModel):
    completed: bool

    model_config = {"strict": True}


class TodoOut(BaseModel):
    id: int
    title: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
