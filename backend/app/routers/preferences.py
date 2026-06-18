from __future__ import annotations

from fastapi import APIRouter

from app.meal_store import PREFERENCES_FILE, load_json, save_json
from app.schemas.meals import Preferences

router = APIRouter(prefix='/api/preferences')
DEFAULT_PREFERENCES = Preferences(dietaryRestrictions=['none'])


@router.get('', response_model=Preferences)
async def get_preferences() -> Preferences:
    stored = load_json(PREFERENCES_FILE, None)
    return Preferences.model_validate(stored) if stored is not None else DEFAULT_PREFERENCES


@router.put('', response_model=Preferences)
async def put_preferences(payload: Preferences) -> Preferences:
    save_json(PREFERENCES_FILE, payload.model_dump())
    return payload
