from app.routers.favorites import router as favorites_router
from app.routers.meals import router as meals_router
from app.routers.preferences import router as preferences_router

__all__ = ['favorites_router', 'meals_router', 'preferences_router']
from __future__ import annotations

import functools
import json
import os
from datetime import date, datetime, timedelta
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel, ValidationError

from app.persistence import (
    get_plan,
    get_preferences,
    load_favorites,
    make_favorite_id,
    save_favorites,
    set_plan,
    set_preferences,
)
from app.schemas import (
    DayPlan,
    ErrorResponse,
    FavoriteCreateRequest,
    FavoriteDeleteRequest,
    FavoriteMeal,
    GenerateDayRequest,
    Meal,
    Preferences,
    SuggestAlternativeRequest,
    WeekDay,
    WeekPlan,
)

router = APIRouter(prefix="/api")

API_CONTRACT = """# API CONTRACT
# GET  /api/preferences
#   response: {"number_of_kids": number, "age_range": string, "dietary_restrictions": string, "foods_to_avoid": string, "cuisine_preferences": string[]}
# PUT  /api/preferences
#   request:  {"number_of_kids": number, "age_range": string, "dietary_restrictions": string, "foods_to_avoid": string, "cuisine_preferences": string[]}
#   response: same as request
# POST /api/meals/generate-day
#   request:  {"date": string, "preferences": {"number_of_kids": number, "age_range": string, "dietary_restrictions": string, "foods_to_avoid": string, "cuisine_preferences": string[]}}
#   response: {"date": string, "meals": {"Breakfast": meal, "Lunch": meal, "Snack": meal, "Dinner": meal}}
# POST /api/meals/suggest-alternative
#   request:  {"date": string, "slot": "Breakfast"|"Lunch"|"Snack"|"Dinner", "preferences": {...}}
#   response: {"date": string, "meals": {"Breakfast": meal, "Lunch": meal, "Snack": meal, "Dinner": meal}}
# GET  /api/week/{date}
#   response: {"start_date": string, "days": [{"date": string, "meals": null|{Breakfast: meal, Lunch: meal, Snack: meal, Dinner: meal}}, ...7]}
# GET  /api/favorites
#   response: [{"favorite_id": string, "meal": meal}]
# POST /api/favorites
#   request:  {"meal": meal}
#   response: {"favorite_id": string, "meal": meal}
# DELETE /api/favorites
#   request:  {"favorite_id": string}
#   response: {"deleted": true}
"""


def _openai_client() -> OpenAI:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail={"detail": "OPENAI_API_KEY is not configured"})
    return OpenAI(api_key=key)


class MealSlotResponse(BaseModel):
    Breakfast: Meal
    Lunch: Meal
    Snack: Meal
    Dinner: Meal


class GeneratedDayResponse(BaseModel):
    date: str
    meals: MealSlotResponse


class GeneratedMealsEnvelope(BaseModel):
    meals: MealSlotResponse


def _meal_prompt(preferences: Preferences, date_str: str, target_slot: str | None = None) -> list[dict[str, str]]:
    dietary = preferences.dietary_restrictions.lower()
    cuisine_line = ", ".join(preferences.cuisine_preferences) if preferences.cuisine_preferences else "any kid-friendly cuisine"
    avoid = preferences.foods_to_avoid.strip() or "none"
    focus = f"Generate only the {target_slot} meal" if target_slot else "Generate four meals for the same day"
    vegetarian_rules = "If dietary restrictions indicate vegetarian, exclude meat, poultry, seafood, and broth made from meat." if "veget" in dietary else ""
    return [
        {
            "role": "system",
            "content": (
                "You are a kid-friendly family meal planner. Return only valid JSON matching the schema. "
                "Meals must be practical, appetizing for children, and varied across the day. "
                "Each description must be exactly one sentence. "
                "Ingredients should be concise food items. "
                "Difficulty must be Easy or Medium only. "
                + vegetarian_rules
            ),
        },
        {
            "role": "user",
            "content": (
                f"Date: {date_str}. {focus}. Preferences: {preferences.model_dump_json()}. "
                f"Cuisine preferences: {cuisine_line}. Foods to avoid: {avoid}. "
                "Return JSON with keys Breakfast, Lunch, Snack, Dinner, each meal having id, name, description, ingredients, prep_time_minutes, difficulty."
            ),
        },
    ]


def _parse_meal_plan(content: str) -> MealSlotResponse:
    try:
        envelope = GeneratedMealsEnvelope.model_validate_json(content)
        return envelope.meals
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail={"detail": f"Malformed model output: {exc.errors()}"}) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail={"detail": f"Malformed model output: {exc}"}) from exc


def _generate_day(date_str: str, preferences: Preferences, target_slot: str | None = None, existing: dict[str, Any] | None = None) -> GeneratedDayResponse:
    client = _openai_client()
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=_meal_prompt(preferences, date_str, target_slot),
        )
        content = response.choices[0].message.content or ""
        meals = _parse_meal_plan(content)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail={"detail": f"OpenAI request failed: {exc}"}) from exc

    if target_slot and existing:
        updated = MealSlotResponse.model_validate(existing)
        setattr(updated, target_slot, getattr(meals, target_slot))
        meals = updated
    return GeneratedDayResponse(date=date_str, meals=meals)


@router.get("/preferences", response_model=Preferences)
async def read_preferences() -> Preferences:
    return get_preferences()


@router.put("/preferences", response_model=Preferences)
async def update_preferences(body: Preferences) -> Preferences:
    return set_preferences(body)


@router.post("/meals/generate-day", response_model=GeneratedDayResponse)
async def generate_day(body: GenerateDayRequest) -> GeneratedDayResponse:
    generated = _generate_day(body.date, body.preferences)
    set_plan(body.date, generated.model_dump())
    return generated


@router.post("/meals/suggest-alternative", response_model=GeneratedDayResponse)
async def suggest_alternative(body: SuggestAlternativeRequest) -> GeneratedDayResponse:
    existing = get_plan(body.date)
    if existing is None:
        generated = _generate_day(body.date, body.preferences)
        set_plan(body.date, generated.model_dump())
        return generated
    generated = _generate_day(body.date, body.preferences, target_slot=body.slot, existing=existing["meals"])
    set_plan(body.date, generated.model_dump())
    return generated


@router.get("/week/{date_str}", response_model=WeekPlan)
async def week_view(date_str: str) -> WeekPlan:
    base = datetime.fromisoformat(date_str).date()
    days: list[WeekDay] = []
    prefs = get_preferences()
    for offset in range(7):
        current = (base + timedelta(days=offset)).isoformat()
        plan = get_plan(current)
        days.append(WeekDay(date=current, meals=plan["meals"] if plan else None))
    return WeekPlan(start_date=base.isoformat(), days=days)


@router.get("/favorites", response_model=list[FavoriteMeal])
async def list_favorites() -> list[FavoriteMeal]:
    return [FavoriteMeal.model_validate(item) for item in load_favorites()]


@router.post("/favorites", response_model=FavoriteMeal)
async def add_favorite(body: FavoriteCreateRequest) -> FavoriteMeal:
    favorite = FavoriteMeal(favorite_id=make_favorite_id(body.meal), meal=body.meal)
    favorites = load_favorites()
    if not any(item.get("favorite_id") == favorite.favorite_id for item in favorites):
        favorites.append(favorite.model_dump())
        save_favorites(favorites)
    return favorite


@router.delete("/favorites", response_model=dict)
async def remove_favorite(body: FavoriteDeleteRequest) -> dict[str, bool]:
    favorites = [item for item in load_favorites() if item.get("favorite_id") != body.favorite_id]
    save_favorites(favorites)
    return {"deleted": True}
