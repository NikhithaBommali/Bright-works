import functools
import json
import os
from datetime import date as date_type, datetime, timedelta
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

# API CONTRACT
# GET  /api/preferences
#   response: {"numberOfKids": number, "ageRange": string, "dietaryRestriction": string, "foodsToAvoid": string, "cuisinePreferences": string[]}
#
# PUT  /api/preferences
#   request:  {"numberOfKids": number, "ageRange": string, "dietaryRestriction": string, "foodsToAvoid": string, "cuisinePreferences": string[]}
#   response: {"numberOfKids": number, "ageRange": string, "dietaryRestriction": string, "foodsToAvoid": string, "cuisinePreferences": string[]}
#
# POST /api/meals/generate-day
#   request:  {"date": string, "preferences": {"numberOfKids": number, "ageRange": string, "dietaryRestriction": string, "foodsToAvoid": string, "cuisinePreferences": string[]}}
#   response: {"date": string, "meals": {"breakfast": {"slot": "Breakfast", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}, "lunch": {"slot": "Lunch", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}, "snack": {"slot": "Snack", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}, "dinner": {"slot": "Dinner", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}}}
#   errors:   503 {"detail": "OPENAI_API_KEY is not configured"}
#
# POST /api/meals/suggest-alternative
#   request:  {"date": string, "slot": "breakfast"|"lunch"|"snack"|"dinner", "preferences": {"numberOfKids": number, "ageRange": string, "dietaryRestriction": string, "foodsToAvoid": string, "cuisinePreferences": string[]}}
#   response: {"date": string, "meals": {"breakfast": {"slot": "Breakfast", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}, "lunch": {"slot": "Lunch", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}, "snack": {"slot": "Snack", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}, "dinner": {"slot": "Dinner", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}}}
#   errors:   503 {"detail": "OPENAI_API_KEY is not configured"}
#
# GET  /api/week/{date}
#   response: {"startDate": string, "days": [{"date": string, "meals": {"breakfast": {"slot": "Breakfast", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}|null, "lunch": {"slot": "Lunch", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}|null, "snack": {"slot": "Snack", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}|null, "dinner": {"slot": "Dinner", "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}|null}}, ...7 total days]}
#
# GET  /api/favorites
#   response: {"favorites": [{"id": string, "slot": string, "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}]}
#
# POST /api/favorites
#   request:  {"favorite": {"id": string, "slot": string, "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}}
#   response: {"favorite": {"id": string, "slot": string, "mealName": string, "description": string, "ingredients": string[], "prepTimeMinutes": number, "difficulty": "Easy"|"Medium"}}
#
# DELETE /api/favorites
#   request:  {"id": string}
#   response: {"deleted": true}

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
PREFERENCES_FILE = BASE_DIR / "preferences.json"
PLANS_FILE = BASE_DIR / "day_plans.json"
FAVORITES_FILE = BASE_DIR / "favorites.json"

MealDifficulty = Literal["Easy", "Medium"]
MealSlotKey = Literal["breakfast", "lunch", "snack", "dinner"]
MealSlotLabel = Literal["Breakfast", "Lunch", "Snack", "Dinner"]


class Preferences(BaseModel):
    numberOfKids: int = Field(default=1, ge=1)
    ageRange: str = ""
    dietaryRestriction: str = ""
    foodsToAvoid: str = ""
    cuisinePreferences: list[str] = Field(default_factory=list)


class Meal(BaseModel):
    slot: MealSlotLabel
    mealName: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: MealDifficulty


class DayMeals(BaseModel):
    breakfast: Meal
    lunch: Meal
    snack: Meal
    dinner: Meal


class NullableDayMeals(BaseModel):
    breakfast: Meal | None
    lunch: Meal | None
    snack: Meal | None
    dinner: Meal | None


class DayPlanResponse(BaseModel):
    date: str
    meals: DayMeals


class GenerateDayRequest(BaseModel):
    date: str
    preferences: Preferences


class SuggestAlternativeRequest(BaseModel):
    date: str
    slot: MealSlotKey
    preferences: Preferences


class WeekDay(BaseModel):
    date: str
    meals: NullableDayMeals


class WeekResponse(BaseModel):
    startDate: str
    days: list[WeekDay]


class Favorite(BaseModel):
    id: str
    slot: str
    mealName: str
    description: str
    ingredients: list[str]
    prepTimeMinutes: int = Field(ge=0)
    difficulty: MealDifficulty


class FavoritesResponse(BaseModel):
    favorites: list[Favorite]


class FavoriteEnvelope(BaseModel):
    favorite: Favorite


class FavoriteDeleteRequest(BaseModel):
    id: str


class FavoriteDeleteResponse(BaseModel):
    deleted: bool


class StructuredMealsResponse(BaseModel):
    meals: DayMeals


def _default_preferences() -> Preferences:
    return Preferences(
        numberOfKids=1,
        ageRange="",
        dietaryRestriction="",
        foodsToAvoid="",
        cuisinePreferences=[],
    )


def _read_json_file(path: Path, default: object) -> object:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default


def _write_json_file(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _load_preferences() -> Preferences:
    stored = _read_json_file(PREFERENCES_FILE, _default_preferences().model_dump())
    return Preferences.model_validate(stored)


def _save_preferences(preferences: Preferences) -> Preferences:
    _write_json_file(PREFERENCES_FILE, preferences.model_dump())
    return preferences


def _load_plans() -> dict[str, dict[str, object]]:
    stored = _read_json_file(PLANS_FILE, {})
    if not isinstance(stored, dict):
        return {}
    return stored


def _save_plans(plans: dict[str, dict[str, object]]) -> None:
    _write_json_file(PLANS_FILE, plans)


def _load_day_plan(plan_date: str) -> DayPlanResponse | None:
    plans = _load_plans()
    raw_plan = plans.get(plan_date)
    if raw_plan is None:
        return None
    return DayPlanResponse.model_validate(raw_plan)


def _store_day_plan(plan: DayPlanResponse) -> DayPlanResponse:
    plans = _load_plans()
    plans[plan.date] = plan.model_dump()
    _save_plans(plans)
    return plan


def _load_favorites() -> list[Favorite]:
    stored = _read_json_file(FAVORITES_FILE, [])
    if not isinstance(stored, list):
        return []
    favorites: list[Favorite] = []
    for item in stored:
        try:
            favorites.append(Favorite.model_validate(item))
        except Exception:
            continue
    return favorites


def _save_favorites(favorites: list[Favorite]) -> None:
    _write_json_file(FAVORITES_FILE, [favorite.model_dump() for favorite in favorites])


def _parse_date(value: str) -> date_type:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid date format. Expected YYYY-MM-DD") from exc


@functools.lru_cache(maxsize=1)
def _openai_client() -> OpenAI:
    return OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def _require_openai_key() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")


def _preferences_prompt(preferences: Preferences) -> str:
    dietary = preferences.dietaryRestriction.strip() or "None"
    avoid = preferences.foodsToAvoid.strip() or "None specified"
    cuisines = ", ".join(preferences.cuisinePreferences) if preferences.cuisinePreferences else "No specific cuisine preference"
    vegetarian_note = "If dietaryRestriction is Vegetarian, exclude meat, poultry, and seafood entirely." if dietary.lower() == "vegetarian" else "Honor the dietaryRestriction exactly as written."
    return (
        f"Family preferences: {preferences.numberOfKids} kid(s), age range '{preferences.ageRange or 'unspecified'}', "
        f"dietary restriction '{dietary}', foods to avoid '{avoid}', cuisine preferences '{cuisines}'. "
        f"Make meals clearly kid-friendly, practical for home cooking, and avoid allergens or ingredients that conflict with foodsToAvoid. "
        f"{vegetarian_note}"
    )


def _generate_day_meals(preferences: Preferences, plan_date: str) -> DayMeals:
    _require_openai_key()
    client = _openai_client()
    completion = client.responses.parse(
        model="gpt-4o-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You are a meal planner for families. Return only structured data matching the provided schema. "
                    "Generate exactly one breakfast, one lunch, one snack, and one dinner. "
                    "Descriptions must be one sentence, ingredients must be concise strings, prepTimeMinutes must be realistic, "
                    "difficulty must be either Easy or Medium, and slot labels must be exactly Breakfast, Lunch, Snack, Dinner."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Create a full day meal plan for {plan_date}. {_preferences_prompt(preferences)}"
                ),
            },
        ],
        text_format=StructuredMealsResponse,
    )
    return completion.output_parsed.meals


def _generate_single_meal(
    preferences: Preferences,
    plan_date: str,
    slot: MealSlotKey,
    existing_plan: DayPlanResponse,
) -> Meal:
    _require_openai_key()
    client = _openai_client()
    slot_map: dict[MealSlotKey, MealSlotLabel] = {
        "breakfast": "Breakfast",
        "lunch": "Lunch",
        "snack": "Snack",
        "dinner": "Dinner",
    }
    other_meals = {
        key: value.model_dump()
        for key, value in existing_plan.meals.model_dump().items()
        if key != slot
    }
    meal_schema = type(
        "SingleMealResponse",
        (BaseModel,),
        {"meal": (Meal, ...)},
    )
    completion = client.responses.parse(
        model="gpt-4o-mini",
        input=[
            {
                "role": "system",
                "content": (
                    "You are a meal planner for families. Return only structured data matching the provided schema. "
                    "Generate exactly one replacement meal for the requested slot. Keep it kid-friendly and compatible with the preferences."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Create a replacement for the {slot_map[slot]} slot on {plan_date}. {_preferences_prompt(preferences)} "
                    f"Keep these other meals unchanged for context: {json.dumps(other_meals)}. "
                    f"The replacement meal must have slot exactly '{slot_map[slot]}'."
                ),
            },
        ],
        text_format=meal_schema,
    )
    return completion.output_parsed.meal


@app.get("/api/preferences", response_model=Preferences)
async def get_preferences() -> Preferences:
    return _load_preferences()


@app.put("/api/preferences", response_model=Preferences)
async def put_preferences(preferences: Preferences) -> Preferences:
    return _save_preferences(preferences)


@app.post("/api/meals/generate-day", response_model=DayPlanResponse)
async def generate_day(request: GenerateDayRequest) -> DayPlanResponse:
    _parse_date(request.date)
    meals = _generate_day_meals(request.preferences, request.date)
    plan = DayPlanResponse(date=request.date, meals=meals)
    return _store_day_plan(plan)


@app.post("/api/meals/suggest-alternative", response_model=DayPlanResponse)
async def suggest_alternative(request: SuggestAlternativeRequest) -> DayPlanResponse:
    _parse_date(request.date)
    existing_plan = _load_day_plan(request.date)
    if existing_plan is None:
        raise HTTPException(status_code=404, detail="No saved plan exists for that date")
    replacement_meal = _generate_single_meal(request.preferences, request.date, request.slot, existing_plan)
    updated = existing_plan.model_copy(deep=True)
    setattr(updated.meals, request.slot, replacement_meal)
    return _store_day_plan(updated)


@app.get("/api/week/{date}", response_model=WeekResponse)
async def get_week(date: str) -> WeekResponse:
    start_date = _parse_date(date)
    days: list[WeekDay] = []
    for offset in range(7):
        current_date = start_date + timedelta(days=offset)
        current_date_str = current_date.isoformat()
        stored_plan = _load_day_plan(current_date_str)
        meals = (
            NullableDayMeals.model_validate(stored_plan.meals.model_dump())
            if stored_plan is not None
            else NullableDayMeals(breakfast=None, lunch=None, snack=None, dinner=None)
        )
        days.append(WeekDay(date=current_date_str, meals=meals))
    return WeekResponse(startDate=start_date.isoformat(), days=days)


@app.get("/api/favorites", response_model=FavoritesResponse)
async def get_favorites() -> FavoritesResponse:
    return FavoritesResponse(favorites=_load_favorites())


@app.post("/api/favorites", response_model=FavoriteEnvelope)
async def create_favorite(payload: FavoriteEnvelope) -> FavoriteEnvelope:
    favorites = _load_favorites()
    favorite = payload.favorite
    if not favorite.id:
        favorite = favorite.model_copy(update={"id": str(uuid4())})
    favorites = [item for item in favorites if item.id != favorite.id] + [favorite]
    _save_favorites(favorites)
    return FavoriteEnvelope(favorite=favorite)


@app.delete("/api/favorites", response_model=FavoriteDeleteResponse)
async def delete_favorite(payload: FavoriteDeleteRequest) -> FavoriteDeleteResponse:
    favorites = _load_favorites()
    remaining = [favorite for favorite in favorites if favorite.id != payload.id]
    _save_favorites(remaining)
    return FavoriteDeleteResponse(deleted=True)
