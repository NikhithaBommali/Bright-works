from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.persistence import Favorite, Meal, add_favorite, delete_favorite, get_favorites

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


class FavoriteMealBody(BaseModel):
    meal: Meal


class DeleteFavoriteBody(BaseModel):
    id: str


@router.get("", response_model=list[Favorite])
async def list_favorites() -> list[Favorite]:
    return get_favorites()


@router.post("", response_model=Favorite)
async def create_favorite(payload: FavoriteMealBody) -> Favorite:
    return add_favorite(payload.meal)


@router.delete("", response_model=dict[str, str | bool])
async def remove_favorite(payload: DeleteFavoriteBody) -> dict[str, str | bool]:
    delete_favorite(payload.id)
    return {"deleted": True, "id": payload.id}
