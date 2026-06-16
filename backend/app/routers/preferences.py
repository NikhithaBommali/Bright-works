from __future__ import annotations

from fastapi import APIRouter

from app.meal_store import PREFERENCES_FILE, load_json, save_json
from app.schemas.preferences import Preference

router = APIRouter(prefix="/api/preferences")
DEFAULT_PREFERENCES = Preference()


@router.get("")
async def get_preferences() -> Preference:
    stored = load_json(PREFERENCES_FILE, None)
    return Preference.model_validate(stored) if stored is not None else DEFAULT_PREFERENCES


@router.put("")
async def put_preferences(payload: Preference) -> Preference:
    save_json(PREFERENCES_FILE, payload.model_dump())
    return payload
