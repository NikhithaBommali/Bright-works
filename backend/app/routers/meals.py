from __future__ import annotations

import functools
import json
import os
import uuid
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
try:
    from openai import OpenAI
except ModuleNotFoundError:  # pragma: no cover - import compatibility in test env
    OpenAI = None  # type: ignore[assignment]

from app.schemas.meal_planner import (
    DailyPlan,
    DEFAULT_PREFERENCES,
    FavoriteCreate,
    FavoriteDelete,
    FavoriteOut,
    GenerateDayRequest,
    GenerateDayWithOpenAIRequest,
    GenerateDayResponse,
    SuggestAlternativeResponse,
    Meal,
    Preferences,
    SuggestAlternativeRequest,
    SuggestAlternativeWithOpenAIRequest,
    WeekDayResponse,
    WeekResponse,
)

router = APIRouter(prefix="/api", tags=["meal-planner"])
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
PREFERENCES_FILE = DATA_DIR / "preferences.json"
PLANS_FILE = DATA_DIR / "plans.json"
FAVORITES_FILE = DATA_DIR / "favorites.json"


@functools.lru_cache(maxsize=1)
def _openai_client() -> OpenAI:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    if OpenAI is None:
        raise HTTPException(status_code=503, detail="openai package is not installed")
    return OpenAI(api_key=key)


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text())


def _write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, sort_keys=True))


def _normalize_plan(data: Any) -> DailyPlan:
    return DailyPlan.model_validate(data)


def _meal_prompt(date_value: date, preferences: Preferences, slot: str | None, existing: DailyPlan | None) -> list[dict[str, str]]:
    system = (
        "You are a kid-friendly meal planner for families. Return only valid JSON matching the schema. "
        "Respect restrictive preferences strictly, including vegetarian, vegan, halal, kosher, dairy-free, egg-free, nut-free, gluten-free, and allergy avoidance. "
        "Avoid any ingredients in foods_to_avoid. Keep descriptions to one sentence."
    )
    user = {
        "date": date_value.isoformat(),
        "slot": slot,
        "preferences": preferences.model_dump(),
        "existing_plan": existing.model_dump() if existing else None,
        "schema": {
            "date": "YYYY-MM-DD",
            "meals": {
                "breakfast": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
                "lunch": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
                "snack": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
                "dinner": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
            },
        },
    }
    return [{"role": "system", "content": system}, {"role": "user", "content": json.dumps(user)}]


def _generate_plan(date_value: date, preferences: Preferences, slot: str | None = None, existing: DailyPlan | None = None) -> DailyPlan:
    client = _openai_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=_meal_prompt(date_value, preferences, slot, existing),
    )
    content = response.choices[0].message.content or ""
    payload = json.loads(content)
    if "meals" not in payload and all(slot_name in payload for slot_name in ("breakfast", "lunch", "snack", "dinner")):
        payload = {"date": date_value.isoformat(), "meals": payload}
    return GenerateDayResponse.model_validate(payload).meals


def _load_preferences() -> Preferences:
    stored = _read_json(PREFERENCES_FILE, None)
    return DEFAULT_PREFERENCES if stored is None else Preferences.model_validate(stored)


def _save_preferences(preferences: Preferences) -> None:
    _write_json(PREFERENCES_FILE, preferences.model_dump())


def _load_plans() -> dict[str, dict[str, Any]]:
    return _read_json(PLANS_FILE, {})


def _save_plans(plans: dict[str, dict[str, Any]]) -> None:
    _write_json(PLANS_FILE, plans)


def _load_favorites() -> list[dict[str, Any]]:
    return _read_json(FAVORITES_FILE, [])


def _save_favorites(favorites: list[dict[str, Any]]) -> None:
    _write_json(FAVORITES_FILE, favorites)


@router.get("/preferences", response_model=Preferences)
async def get_preferences() -> Preferences:
    return _load_preferences()


@router.put("/preferences", response_model=Preferences)
async def put_preferences(body: Preferences) -> Preferences:
    _save_preferences(body)
    return body


@router.post("/meals/generate-day", response_model=GenerateDayResponse)
async def generate_day(body: GenerateDayWithOpenAIRequest | GenerateDayRequest) -> GenerateDayResponse:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    plan = _generate_plan(body.date, body.preferences)
    plans = _load_plans()
    plans[body.date.isoformat()] = plan.model_dump()
    _save_plans(plans)
    return GenerateDayResponse(date=body.date, meals=plan)


@router.post("/meals/suggest-alternative", response_model=GenerateDayResponse)
async def suggest_alternative(body: SuggestAlternativeWithOpenAIRequest | SuggestAlternativeRequest) -> GenerateDayResponse:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    plans = _load_plans()
    existing_raw = plans.get(body.date.isoformat())
    if existing_raw is None:
        raise HTTPException(status_code=404, detail="No stored plan for this date")
    existing = _normalize_plan(existing_raw)
    regenerated = _generate_plan(body.date, body.preferences, slot=body.slot, existing=existing)
    updated = existing.model_dump()
    updated[body.slot] = regenerated.model_dump()[body.slot]
    plans[body.date.isoformat()] = updated
    _save_plans(plans)
    return SuggestAlternativeResponse(date=body.date, meals=DailyPlan.model_validate(updated))


@router.get("/week/{date_value}", response_model=WeekResponse)
async def get_week(date_value: date) -> WeekResponse:
    week_start = date_value - timedelta(days=date_value.weekday())
    plans = _load_plans()
    days = []
    for offset in range(7):
        current_date = week_start + timedelta(days=offset)
        stored = plans.get(current_date.isoformat())
        days.append(WeekDayResponse(date=current_date, meals=DailyPlan.model_validate(stored) if stored else None))
    return WeekResponse(week_start=week_start, days=days)


@router.get("/favorites", response_model=list[FavoriteOut])
async def get_favorites() -> list[FavoriteOut]:
    return [FavoriteOut.model_validate(item) for item in _load_favorites()]


@router.post("/favorites", response_model=FavoriteOut)
async def add_favorite(body: FavoriteCreate) -> FavoriteOut:
    favorite = {"id": str(uuid.uuid4()), "meal": body.meal.model_dump()}
    favorites = _load_favorites()
    favorites.append(favorite)
    _save_favorites(favorites)
    return FavoriteOut.model_validate(favorite)


@router.delete("/favorites", response_model=dict)
async def delete_favorite(body: FavoriteDelete) -> dict[str, Any]:
    favorites = _load_favorites()
    remaining = [item for item in favorites if item.get("id") != body.id]
    _save_favorites(remaining)
    return {"id": body.id, "deleted": True}
