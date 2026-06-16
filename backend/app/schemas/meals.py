from typing import Literal

from pydantic import BaseModel, Field

MealSlot = Literal["breakfast", "lunch", "snack", "dinner"]
Difficulty = Literal["Easy", "Medium"]


class Meal(BaseModel):
    name: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: Difficulty


class GenerateDayRequest(BaseModel):
    date: str
    preferences: dict


class SuggestAlternativeRequest(BaseModel):
    date: str
    slot: MealSlot
    preferences: dict


class FavoriteRequest(BaseModel):
    meal: Meal


class DeleteFavoriteRequest(BaseModel):
    id: str
