from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from threading import Lock
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "storage"
PREFERENCES_FILE = DATA_DIR / "preferences.json"
MEAL_PLANS_FILE = DATA_DIR / "meal_plans.json"
FAVORITES_FILE = DATA_DIR / "favorites.json"

MealDifficulty = Literal["Easy", "Medium"]
MealSlot = Literal["breakfast", "lunch", "snack", "dinner"]


class Preferences(BaseModel):
    numberOfKids: int = Field(default=1, ge=0)
    ageRange: str = ""
    dietaryRestrictions: list[str] = Field(default_factory=list)
    foodsToAvoid: str = ""
    cuisinePreferences: list[str] = Field(default_factory=list)


class Meal(BaseModel):
    name: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: MealDifficulty


class DayMeals(BaseModel):
    breakfast: Meal
    lunch: Meal
    snack: Meal
    dinner: Meal


class DayPlan(BaseModel):
    date: str
    meals: DayMeals


class Favorite(BaseModel):
    id: str
    meal: Meal


_lock = Lock()


def _ensure_storage() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_json(path: Path, default: object) -> object:
    _ensure_storage()
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def _write_json(path: Path, payload: object) -> None:
    _ensure_storage()
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def get_preferences() -> Preferences:
    return Preferences.model_validate(_load_json(PREFERENCES_FILE, Preferences().model_dump()))


def save_preferences(preferences: Preferences) -> Preferences:
    with _lock:
        _write_json(PREFERENCES_FILE, preferences.model_dump())
    return preferences


def get_meal_plans() -> dict[str, dict[str, object]]:
    data = _load_json(MEAL_PLANS_FILE, {})
    return data if isinstance(data, dict) else {}


def save_meal_plan(plan: DayPlan) -> DayPlan:
    with _lock:
        plans = get_meal_plans()
        plans[plan.date] = plan.model_dump()
        _write_json(MEAL_PLANS_FILE, plans)
    return plan


def get_meal_plan(date: str) -> DayPlan | None:
    raw = get_meal_plans().get(date)
    return DayPlan.model_validate(raw) if raw else None


def get_favorites() -> list[Favorite]:
    raw = _load_json(FAVORITES_FILE, [])
    if not isinstance(raw, list):
        return []
    favorites: list[Favorite] = []
    for item in raw:
        try:
            favorites.append(Favorite.model_validate(item))
        except Exception:
            continue
    return favorites


def add_favorite(meal: Meal) -> Favorite:
    favorite = Favorite(id=str(uuid4()), meal=meal)
    with _lock:
        favorites = get_favorites()
        favorites.append(favorite)
        _write_json(FAVORITES_FILE, [fav.model_dump() for fav in favorites])
    return favorite


def delete_favorite(favorite_id: str) -> bool:
    with _lock:
        favorites = [fav for fav in get_favorites() if fav.id != favorite_id]
        _write_json(FAVORITES_FILE, [fav.model_dump() for fav in favorites])
    return True
