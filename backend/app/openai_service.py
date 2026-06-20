from __future__ import annotations

import functools
import json
import os
from typing import Literal

from fastapi import HTTPException

try:
    from openai import OpenAI
except ModuleNotFoundError:  # pragma: no cover - import fallback for preview boot
    OpenAI = None  # type: ignore[assignment]

from pydantic import ValidationError

from app.schemas.meals import DayPlan, Meal, Preferences

MealSlot = Literal['Breakfast', 'Lunch', 'Snack', 'Dinner']


@functools.lru_cache(maxsize=1)
def _openai_client() -> OpenAI:
    if OpenAI is None:
        raise HTTPException(status_code=503, detail='OPENAI_API_KEY is not configured on the backend')
    return OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))


def _require_openai() -> None:
    if not os.environ.get('OPENAI_API_KEY') or OpenAI is None:
        raise HTTPException(status_code=503, detail='OPENAI_API_KEY is not configured on the backend')


def _schema() -> dict:
    meal_schema = {
        'type': 'object',
        'properties': {
            'slot': {'type': 'string', 'enum': ['Breakfast', 'Lunch', 'Snack', 'Dinner']},
            'name': {'type': 'string'},
            'description': {'type': 'string'},
            'ingredients': {'type': 'array', 'items': {'type': 'string'}},
            'prepTimeMinutes': {'type': 'number'},
            'difficulty': {'type': 'string', 'enum': ['Easy', 'Medium']},
        },
        'required': ['slot', 'name', 'description', 'ingredients', 'prepTimeMinutes', 'difficulty'],
        'additionalProperties': False,
    }
    return {
        'type': 'object',
        'properties': {
            'date': {'type': 'string'},
            'meals': {'type': 'array', 'minItems': 4, 'maxItems': 4, 'items': meal_schema},
        },
        'required': ['date', 'meals'],
        'additionalProperties': False,
    }


def _messages(date: str, preferences: Preferences, slot: str | None = None) -> list[dict[str, str]]:
    system = (
        'You generate kid-friendly meal plans. Return only JSON. Respect numberOfKids, ageRange, '
        'dietaryRestrictions, foodsToAvoid, and cuisinePreferences. If vegetarian is included, '
        'exclude meat, poultry, and fish. Changed preferences must materially affect output.'
    )
    payload: dict[str, object] = {'date': date, 'preferences': preferences.model_dump()}
    if slot is not None:
        payload['slot'] = slot
    return [{'role': 'system', 'content': system}, {'role': 'user', 'content': json.dumps(payload, ensure_ascii=False)}]


def generate_day(date: str, preferences: Preferences) -> DayPlan:
    _require_openai()
    client = _openai_client()
    resp = client.chat.completions.create(model='gpt-4o-mini', response_format={'type': 'json_schema', 'json_schema': {'name': 'day_plan', 'schema': _schema()}}, messages=_messages(date, preferences))
    try:
        return DayPlan.model_validate(json.loads(resp.choices[0].message.content or '{}'))
    except (ValidationError, json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=503, detail='Failed to generate a valid meal plan from OpenAI') from exc


def generate_meal(date: str, slot: MealSlot, preferences: Preferences) -> Meal:
    _require_openai()
    client = _openai_client()
    resp = client.chat.completions.create(model='gpt-4o-mini', response_format={'type': 'json_schema', 'json_schema': {'name': 'meal', 'schema': _schema()['properties']['meals']['items']}}, messages=_messages(date, preferences, slot))
    try:
        return Meal.model_validate(json.loads(resp.choices[0].message.content or '{}'))
    except (ValidationError, json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=503, detail='Failed to generate a valid meal from OpenAI') from exc
