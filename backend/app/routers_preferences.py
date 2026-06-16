from __future__ import annotations

from fastapi import APIRouter

from app.persistence import Preferences, get_preferences, save_preferences

router = APIRouter(prefix="/api/preferences", tags=["preferences"])


@router.get("", response_model=Preferences)
async def read_preferences() -> Preferences:
    return get_preferences()


@router.put("", response_model=Preferences)
async def update_preferences(payload: Preferences) -> Preferences:
    return save_preferences(payload)
