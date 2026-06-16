from fastapi import APIRouter

from app.persistence import load_json, save_json, PREFERENCES_FILE
from app.schemas.preferences import Preference, PreferencesEnvelope

router = APIRouter(prefix="/api/preferences")
DEFAULT_PREFERENCES = Preference(numberOfKids=1, ageRange="", dietaryRestrictions=[], foodsToAvoid="", cuisinePreferences=[])


@router.get("")
async def get_preferences() -> PreferencesEnvelope:
    stored = load_json(PREFERENCES_FILE, None)
    preferences = Preference.model_validate(stored) if stored is not None else DEFAULT_PREFERENCES
    return PreferencesEnvelope(preferences=preferences)


@router.put("")
async def put_preferences(payload: PreferencesEnvelope) -> PreferencesEnvelope:
    save_json(PREFERENCES_FILE, payload.preferences.model_dump())
    return payload
