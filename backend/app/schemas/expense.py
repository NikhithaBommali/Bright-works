from __future__ import annotations

from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Category(str, Enum):
    food = "food"
    transport = "transport"
    shopping = "shopping"
    other = "other"


class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0)
    category: Category
    note: str = ""
    date: date

    model_config = ConfigDict(extra="forbid")

    @field_validator("note", mode="before")
    @classmethod
    def empty_note(cls, value: object) -> str:
        if value is None:
            return ""
        return str(value)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
