from __future__ import annotations

import functools
import json
import os
from datetime import date, timedelta
from typing import Any, Literal
from uuid import uuid4

from fastapi import HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field, ValidationError

from app.schemas.preferences import Preference

MealSlot = Literal["breakfast", "lunch", "snack", "dinner"]
Difficulty = Literal["Easy", "Medium"]


class MealOut(BaseModel):
    name: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: Difficulty


class DayPlanOut(BaseModel):
    date: str
    meals: dict[MealSlot, MealOut]


class DayRequest(BaseModel):
    date: str
    preferences: Preference


class AltRequest(BaseModel):
    date: str
    slot: MealSlot
    preferences: Preference


class FavoriteOut(MealOut):
    id: str


@functools.lru_cache(maxsize=1)
def _openai_client() -> OpenAI:
    return OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def _require_key() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured on the backend")


def _prompt_for(preferences: Preference, date_value: str, slot: str | None = None) -> list[dict[str, str]]:
    system = (
        "You generate kid-friendly meal plans. Respect the user's dietaryRestrictions, foodsToAvoid, and "
        "cuisinePreferences. If vegetarian is requested, exclude meat, poultry, and fish. Return only JSON."
    )
    payload: dict[str, Any] = {"date": date_value, "preferences": preferences.model_dump()}
    if slot:
        payload["slot"] = slot
    return [{"role": "system", "content": system}, {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}]


def _schema_for_day() -> dict[str, Any]:
    meal_schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "description": {"type": "string"},
            "ingredients": {"type": "array", "items": {"type": "string"}},
            "prepTimeMinutes": {"type": "number"},
            "difficulty": {"type": "string", "enum": ["Easy", "Medium"]},
        },
        "required": ["name", "description", "ingredients", "prepTimeMinutes", "difficulty"],
        "additionalProperties": False,
    }
    return {
        "name": "day_plan",
        "schema": {
            "type": "object",
            "properties": {"date": {"type": "string"}, "meals": {"type": "object", "properties": {slot: meal_schema for slot in ["breakfast", "lunch", "snack", "dinner"]}, "required": ["breakfast", "lunch", "snack", "dinner"], "additionalProperties": False}},
            "required": ["date", "meals"],
            "additionalProperties": False,
        },
    }


def _schema_for_meal() -> dict[str, Any]:
    return {"type": "object", "properties": {"name": {"type": "string"}, "description": {"type": "string"}, "ingredients": {"type": "array", "items": {"type": "string"}}, "prepTimeMinutes": {"type": "number"}, "difficulty": {"type": "string", "enum": ["Easy", "Medium"]}}, "required": ["name", "description", "ingredients", "prepTimeMinutes", "difficulty"], "additionalProperties": False}


def generate_day(date_value: str, preferences: Preference) -> DayPlanOut:
    _require_key()
    client = _openai_client()
    resp = client.chat.completions.create(model="gpt-4o-mini", response_format={"type": "json_schema", "json_schema": _schema_for_day()}, messages=_prompt_for(preferences, date_value))
    try:
        data = json.loads(resp.choices[0].message.content or "{}")
        data["date"] = date_value
        return DayPlanOut.model_validate(data)
    except (ValidationError, json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="Failed to generate a valid meal plan from OpenAI") from exc


def generate_meal(date_value: str, slot: MealSlot, preferences: Preference) -> MealOut:
    _require_key()
    client = _openai_client()
    resp = client.chat.completions.create(model="gpt-4o-mini", response_format={"type": "json_schema", "json_schema": {"name": "meal", "schema": _schema_for_meal()}}, messages=_prompt_for(preferences, date_value, slot))
    try:
        return MealOut.model_validate(json.loads(resp.choices[0].message.content or "{}"))
    except (ValidationError, json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="Failed to generate a valid meal from OpenAI") from exc
