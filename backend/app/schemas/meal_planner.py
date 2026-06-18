from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class Preferences(BaseModel):
    number_of_kids: int = Field(ge=1)
    age_range: str
    dietary_restrictions: list[str]
    foods_to_avoid: str
    cuisine_preferences: list[str]


class Meal(BaseModel):
    name: str
    description: str
    ingredients: list[str]
    prep_time_minutes: int = Field(ge=0)
    difficulty: Literal["Easy", "Medium", "Hard"]


class DayPlan(BaseModel):
    date: date
    meals: dict[Literal["breakfast", "lunch", "snack", "dinner"], Meal]


class GenerateDayRequest(BaseModel):
    date: date
    preferences: Preferences


class SuggestAlternativeRequest(BaseModel):
    date: date
    slot: Literal["breakfast", "lunch", "snack", "dinner"]
    preferences: Preferences
    current_day_plan: DayPlan


class WeekDayPlan(BaseModel):
    date: date
    meals: dict[Literal["breakfast", "lunch", "snack", "dinner"], Meal]


class WeekPlanResponse(BaseModel):
    selected_date: date
    days: list[WeekDayPlan]


class FavoriteCreateRequest(BaseModel):
    meal: Meal


class FavoriteItem(BaseModel):
    id: str
    meal: Meal


class FavoriteDeleteRequest(BaseModel):
    id: str


DEFAULT_PREFERENCES = Preferences(
    number_of_kids=1,
    age_range="2-5",
    dietary_restrictions=["none"],
    foods_to_avoid="",
    cuisine_preferences=[],
)
