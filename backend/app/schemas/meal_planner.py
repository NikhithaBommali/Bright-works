from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class Preferences(BaseModel):
    number_of_kids: int = Field(ge=1)
    age_range: str
    dietary_restriction: str
    foods_to_avoid: str
    cuisine_preferences: list[str]


class Meal(BaseModel):
    name: str
    description: str
    ingredients: list[str]
    prep_time_minutes: int
    difficulty: Literal["Easy", "Medium"]


class DailyPlan(BaseModel):
    breakfast: Meal
    lunch: Meal
    snack: Meal
    dinner: Meal


class GenerateDayRequest(BaseModel):
    date: date
    preferences: Preferences


class SuggestAlternativeRequest(BaseModel):
    date: date
    slot: Literal["breakfast", "lunch", "snack", "dinner"]
    preferences: Preferences


class GenerateDayResponse(BaseModel):
    date: date
    meals: DailyPlan


class MealPlannerResponse(BaseModel):
    date: date
    meals: DailyPlan


class WeekDayResponse(BaseModel):
    date: date
    meals: DailyPlan | None


class WeekResponse(BaseModel):
    week_start: date
    days: list[WeekDayResponse]


class FavoriteCreate(BaseModel):
    meal: Meal


class FavoriteOut(BaseModel):
    id: str
    meal: Meal


class FavoriteDelete(BaseModel):
    id: str


DEFAULT_PREFERENCES = Preferences(
    number_of_kids=1,
    age_range="4-6 years",
    dietary_restriction="None",
    foods_to_avoid="",
    cuisine_preferences=[],
)
