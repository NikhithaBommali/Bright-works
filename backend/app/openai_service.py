from __future__ import annotations

import functools
import json
import os
from typing import Literal

from fastapi import HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field

from app.persistence import Meal, MealDifficulty, Preferences


class MealWithSlot(BaseModel):
    name: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: MealDifficulty


class DayMealsResponse(BaseModel):
    breakfast: MealWithSlot
    lunch: MealWithSlot
    snack: MealWithSlot
    dinner: MealWithSlot


class GeneratedDayResponse(BaseModel):
    date: str
    meals: DayMealsResponse


class AlternativeResponse(BaseModel):
    meal: MealWithSlot


@functools.lru_cache(maxsize=1)
def _openai_client() -> OpenAI:
    return OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def _require_key() -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    return key


def _preferences_text(preferences: Preferences) -> str:
    restrictions = ", ".join(preferences.dietaryRestrictions) or "none"
    avoid = preferences.foodsToAvoid.strip() or "none"
    cuisines = ", ".join(preferences.cuisinePreferences) or "none"
    return (
        f"numberOfKids={preferences.numberOfKids}; ageRange={preferences.ageRange}; "
        f"dietaryRestrictions={restrictions}; foodsToAvoid={avoid}; cuisinePreferences={cuisines}."
    )


def _normalize_meal(meal: MealWithSlot) -> Meal:
    return Meal(
        name=meal.name.strip(),
        description=meal.description.strip(),
        ingredients=[item.strip() for item in meal.ingredients if item.strip()],
        prepTimeMinutes=int(meal.prepTimeMinutes),
        difficulty=meal.difficulty,
    )


def _prompt_for_day(date: str, preferences: Preferences) -> str:
    return (
        f"Generate a kid-friendly full-day meal plan for {date}. "
        f"Use and respect these preferences exactly: {_preferences_text(preferences)} "
        "Avoid ingredients that conflict with dietaryRestrictions and foodsToAvoid. "
        "Return only JSON matching the schema."
    )


def generate_day(date: str, preferences: Preferences) -> dict[str, Meal]:
    _require_key()
    client = _openai_client()
    response = client.responses.parse(
        model="gpt-4o-mini",
        input=[
            {"role": "system", "content": "You generate structured JSON only."},
            {"role": "user", "content": _prompt_for_day(date, preferences)},
        ],
        text_format=GeneratedDayResponse,
    )
    meals = response.output_parsed.meals
    return {
        "breakfast": _normalize_meal(meals.breakfast),
        "lunch": _normalize_meal(meals.lunch),
        "snack": _normalize_meal(meals.snack),
        "dinner": _normalize_meal(meals.dinner),
    }


def generate_alternative(date: str, slot: Literal["breakfast", "lunch", "snack", "dinner"], preferences: Preferences, existing: dict[str, Meal]) -> Meal:
    _require_key()
    client = _openai_client()
    existing_json = json.dumps({k: v.model_dump() for k, v in existing.items()}, ensure_ascii=False)
    response = client.responses.parse(
        model="gpt-4o-mini",
        input=[
            {"role": "system", "content": "You generate structured JSON only."},
            {
                "role": "user",
                "content": (
                    f"Generate a replacement {slot} for {date}. {_preferences_text(preferences)} "
                    f"Keep the other meal slots unchanged: {existing_json}. "
                    "Return only JSON matching the schema."
                ),
            },
        ],
        text_format=AlternativeResponse,
    )
    return _normalize_meal(response.output_parsed.meal)
