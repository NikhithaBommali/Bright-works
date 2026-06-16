from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any, Literal
from uuid import uuid4

from fastapi import HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field, ValidationError

from app.schemas.meals import DayPlan, Meal
from app.schemas.preferences import Preference

MealSlot = Literal["Breakfast", "Lunch", "Snack", "Dinner"]
Difficulty = Literal["Easy", "Medium"]


class GeneratedMeal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    slot: MealSlot
    name: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: Difficulty


class GeneratedDay(BaseModel):
    date: str
    meals: list[GeneratedMeal]


@lru_cache(maxsize=1)
def _openai_client() -> OpenAI:
    return OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def _require_key() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured on the backend")


def _prompt(preferences: Preference) -> str:
    return json.dumps(preferences.model_dump(), ensure_ascii=False)


def generate_day(date: str, preferences: Preference) -> DayPlan:
    _require_key()
    client = _openai_client()
    schema = {
        "name": "day_plan",
        "schema": {
            "type": "object",
            "properties": {
                "date": {"type": "string"},
                "meals": {
                    "type": "array",
                    "minItems": 4,
                    "maxItems": 4,
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "slot": {"type": "string", "enum": ["Breakfast", "Lunch", "Snack", "Dinner"]},
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "ingredients": {"type": "array", "items": {"type": "string"}},
                            "prepTimeMinutes": {"type": "number"},
                            "difficulty": {"type": "string", "enum": ["Easy", "Medium"]},
                        },
                        "required": ["id", "slot", "name", "description", "ingredients", "prepTimeMinutes", "difficulty"],
                        "additionalProperties": False,
                    },
                },
            },
            "required": ["date", "meals"],
            "additionalProperties": False,
        },
    }
    resp = client.chat.completions.create(model="gpt-4o-mini", response_format={"type": "json_schema", "json_schema": schema}, messages=[{"role": "system", "content": "Return only JSON matching schema and respect dietary preferences."}, {"role": "user", "content": f"date={date}; preferences={_prompt(preferences)}"}])
    try:
        content = resp.choices[0].message.content or "{}"
        raw = json.loads(content)
        raw["date"] = date
        plan = GeneratedDay.model_validate(raw)
        return DayPlan(date=plan.date, meals=[Meal.model_validate(m.model_dump()) for m in plan.meals])
    except (json.JSONDecodeError, ValidationError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="Failed to validate OpenAI meal response") from exc


def generate_single(date: str, slot: MealSlot, preferences: Preference, existing: DayPlan) -> Meal:
    _require_key()
    client = _openai_client()
    existing_meals = [meal.model_dump() for meal in existing.meals if meal.slot != slot]
    resp = client.chat.completions.create(model="gpt-4o-mini", response_format={"type": "json_object"}, messages=[{"role": "system", "content": "Return JSON for one replacement meal only."}, {"role": "user", "content": json.dumps({"date": date, "slot": slot, "preferences": preferences.model_dump(), "keep": existing_meals}, ensure_ascii=False)}])
    try:
        raw = json.loads(resp.choices[0].message.content or "{}")
        raw["slot"] = slot
        meal = GeneratedMeal.model_validate(raw)
        return Meal.model_validate(meal.model_dump())
    except (json.JSONDecodeError, ValidationError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="Failed to validate OpenAI meal response") from exc
