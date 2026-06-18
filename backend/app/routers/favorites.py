from __future__ import annotations

from fastapi import APIRouter

from app.meal_store import FAVORITES_FILE, load_json, save_json
from app.schemas.meals import FavoriteDeleteRequest, FavoriteUpsertRequest, FavoritesResponse

router = APIRouter(prefix="/api/favorites")


def _favorites() -> list[dict]:
    return load_json(FAVORITES_FILE, [])


@router.get("", response_model=FavoritesResponse)
async def get_favorites() -> FavoritesResponse:
    return FavoritesResponse(favorites=_favorites())


@router.post("", response_model=FavoritesResponse)
async def add_favorite(body: FavoriteUpsertRequest) -> FavoritesResponse:
    favs = _favorites()
    meal = body.meal.model_dump()
    if meal not in favs:
        favs.append(meal)
        save_json(FAVORITES_FILE, favs)
    return FavoritesResponse(favorites=favs)


@router.delete("", response_model=FavoritesResponse)
async def delete_favorite(body: FavoriteDeleteRequest) -> FavoritesResponse:
    favs = [meal for meal in _favorites() if not (meal.get('name') == body.mealName and meal.get('slot') == body.slot)]
    save_json(FAVORITES_FILE, favs)
    return FavoritesResponse(favorites=favs)
