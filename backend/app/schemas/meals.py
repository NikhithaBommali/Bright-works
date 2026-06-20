from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

MealSlot = Literal["Breakfast", "Lunch", "Snack", "Dinner"]
Difficulty = Literal["Easy", "Medium"]


class Meal(BaseModel):
    slot: MealSlot
    name: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: Difficulty


class Preferences(BaseModel):
    numberOfKids: int = Field(default=1, ge=0)
    ageRange: str = "2-5"
    dietaryRestrictions: list[str] = Field(default_factory=lambda: ["none"])
    foodsToAvoid: str = ""
    cuisinePreferences: list[str] = Field(default_factory=list)


class GenerateDayRequest(BaseModel):
    date: str
    preferences: Preferences


class GenerateDayResponse(BaseModel):
    date: str
    meals: list[Meal]


class DayPlan(BaseModel):
    date: str
    meals: list[Meal]


class SuggestAlternativeRequest(BaseModel):
    date: str
    slot: MealSlot
    preferences: Preferences
    currentPlan: DayPlan


class WeekResponse(BaseModel):
    selectedDate: str
    days: list[DayPlan]


class FavoritesResponse(BaseModel):
    favorites: list[Meal]


class FavoriteUpsertRequest(BaseModel):
    meal: Meal


class FavoriteDeleteRequest(BaseModel):
    mealName: str
    slot: MealSlot
