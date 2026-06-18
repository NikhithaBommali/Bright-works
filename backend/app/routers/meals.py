from __future__ import annotations

import json
import os
import uuid
from datetime import date, timedelta
from functools import lru_cache
from typing import Literal

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from app.schemas.meal_planner import (
    DEFAULT_PREFERENCES,
    DeleteFavoriteResponse,
    DayPlan,
    FavoriteCreateRequest,
    FavoriteDeleteRequest,
    FavoriteItem,
    FavoritesResponse,
    GenerateDayRequest,
    GenerateDayResponse,
    Meal,
    Preferences,
    SuggestAlternativeRequest,
    WeekDayPlan,
    WeekPlanResponse,
)
from app.storage import read_store, update_store

router = APIRouter(prefix="/api", tags=["meal-planner"])
favorites_router = APIRouter(prefix="/api/favorites", tags=["favorites"])
meal_router = APIRouter(prefix="/api/meals", tags=["meals"])
MealSlot = Literal["breakfast", "lunch", "snack", "dinner"]


@lru_cache(maxsize=1)
def _openai_client() -> OpenAI:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    return OpenAI(api_key=key)


def _generate_meal_plan(prompt: dict[str, Any]) -> dict[str, Any]:
    client = _openai_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Return strict JSON for a kid-friendly meal planner. Use only the requested schema."},
            {"role": "user", "content": json.dumps(prompt)},
        ],
    )
    content = response.choices[0].message.content or "{}"
    return json.loads(content)


def _meal_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "description": {"type": "string"},
            "ingredients": {"type": "array", "items": {"type": "string"}},
            "prep_time_minutes": {"type": "integer"},
            "difficulty": {"type": "string", "enum": ["Easy", "Medium", "Hard"]},
        },
        "required": ["name", "description", "ingredients", "prep_time_minutes", "difficulty"],
        "additionalProperties": False,
    }


def _day_plan_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "breakfast": _meal_schema(),
            "lunch": _meal_schema(),
            "snack": _meal_schema(),
            "dinner": _meal_schema(),
        },
        "required": ["breakfast", "lunch", "snack", "dinner"],
        "additionalProperties": False,
    }


def _validate_meal(meal: object) -> Meal:
    return Meal.model_validate(meal)


def _validate_day_plan(payload: object, plan_date: date) -> DayPlan:
    if isinstance(payload, dict) and "meals" not in payload:
        payload = {"date": plan_date, "meals": payload}
    return DayPlan.model_validate(payload)


def _fetch_preferences() -> Preferences:
    store = read_store()
    raw = store.get("preferences")
    return Preferences.model_validate(raw) if raw else DEFAULT_PREFERENCES


@router.get("/preferences", response_model=Preferences)
async def get_preferences() -> Preferences:
    return _fetch_preferences()


@router.put("/preferences", response_model=Preferences)
async def put_preferences(body: Preferences) -> Preferences:
    def mutate(store: dict[str, object]) -> Preferences:
        store["preferences"] = body.model_dump(mode="json")
        return body

    return update_store(mutate)


@router.post("/meals/generate-day", response_model=GenerateDayResponse)
async def generate_day(body: GenerateDayRequest) -> GenerateDayResponse:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    prompt = json.dumps({"date": body.date.isoformat(), "preferences": body.preferences.model_dump(mode="json"), "schema": _day_plan_schema()})
    payload = _generate_meal_plan(prompt)
    day_plan = _validate_day_plan(payload, body.date)

    def mutate(store: dict[str, object]) -> GenerateDayResponse:
        store.setdefault("day_plans", {})[body.date.isoformat()] = day_plan.model_dump(mode="json")
        return GenerateDayResponse(date=body.date, meals=day_plan.meals)

    return update_store(mutate)


@router.post("/meals/suggest-alternative", response_model=GenerateDayResponse)
async def suggest_alternative(body: SuggestAlternativeRequest) -> GenerateDayResponse:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    prompt = json.dumps(
        {
            "date": body.date.isoformat(),
            "slot": body.slot,
            "preferences": body.preferences.model_dump(mode="json"),
            "current_day_plan": body.current_day_plan.model_dump(mode="json"),
            "schema": {"slot": body.slot, "meal": _meal_schema()},
        }
    )
    payload = _generate_meal_plan(prompt)
    replacement = payload.get("meal", payload)
    if body.slot not in payload and isinstance(payload, dict) and all(key in payload for key in ("name", "description", "ingredients", "prep_time_minutes", "difficulty")):
        replacement = payload
    meal = _validate_meal(replacement)
    updated_meals = {**body.current_day_plan.meals, body.slot: meal}
    updated = DayPlan(date=body.date, meals=updated_meals)

    def mutate(store: dict[str, object]) -> GenerateDayResponse:
        store.setdefault("day_plans", {})[body.date.isoformat()] = updated.model_dump(mode="json")
        return GenerateDayResponse(date=body.date, meals=updated.meals)

    return update_store(mutate)


@router.get("/week/{selected_date}", response_model=WeekPlanResponse)
async def get_week(selected_date: date) -> WeekPlanResponse:
    store = read_store()
    plans = store.get("day_plans", {})
    start = selected_date - timedelta(days=selected_date.weekday())
    days: list[WeekDayPlan] = []
    fallback_preferences = _fetch_preferences()
    for offset in range(7):
        current_date = start + timedelta(days=offset)
        raw = plans.get(current_date.isoformat())
        if raw:
            days.append(WeekDayPlan.model_validate(raw))
        else:
            generated = _validate_day_plan(
                _generate_meal_plan(json.dumps({"date": current_date.isoformat(), "preferences": fallback_preferences.model_dump(mode="json"), "schema": _day_plan_schema()})),
                current_date,
            )
            days.append(WeekDayPlan(date=current_date, meals=generated.meals))
    return WeekPlanResponse(selected_date=selected_date, days=days)


@router.get("/favorites", response_model=list[FavoriteItem])
async def get_favorites() -> list[FavoriteItem]:
    store = read_store()
    return [FavoriteItem.model_validate(item) for item in store.get("favorites", [])]


@router.post("/favorites", response_model=FavoriteItem)
async def add_favorite(body: FavoriteCreateRequest) -> FavoriteItem:
    item = FavoriteItem(id=str(uuid.uuid4()), meal=body.meal)

    def mutate(store: dict[str, object]) -> FavoriteItem:
        store.setdefault("favorites", []).append(item.model_dump(mode="json"))
        return item

    return update_store(mutate)


@router.delete("/favorites", status_code=204)
async def delete_favorite(id: str) -> None:
    def mutate(store: dict[str, object]) -> None:
        store["favorites"] = [favorite for favorite in store.get("favorites", []) if favorite.get("id") != id]

    update_store(mutate)
