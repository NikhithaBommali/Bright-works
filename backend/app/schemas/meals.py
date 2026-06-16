from typing import Literal

from pydantic import BaseModel, Field

MealSlot = Literal["Breakfast", "Lunch", "Snack", "Dinner"]
Difficulty = Literal["Easy", "Medium"]


class Meal(BaseModel):
    id: str
    slot: MealSlot
    name: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: float = Field(ge=0)
    difficulty: Difficulty


class DayPlan(BaseModel):
    date: str
    meals: list[Meal]


class GenerateDayRequest(BaseModel):
    date: str
    preferences: dict


class SuggestAlternativeRequest(BaseModel):
    date: str
    slot: MealSlot
    preferences: dict


class DayPlanEnvelope(BaseModel):
    plan: DayPlan


class FavoritesEnvelope(BaseModel):
    favorites: list[Meal]


class FavoriteRequest(BaseModel):
    meal: Meal


class DeleteFavoriteRequest(BaseModel):
    mealId: str
