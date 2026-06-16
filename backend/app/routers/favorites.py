from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter

from app.meal_store import FAVORITES_FILE, load_json, save_json
from app.schemas.meals import DeleteFavoriteRequest, FavoriteRequest

router = APIRouter(prefix="/api/favorites")


def _favorites() -> list[dict]:
    return load_json(FAVORITES_FILE, [])


@router.get("")
async def get_favorites() -> dict:
    return {"favorites": _favorites()}


@router.post("")
async def add_favorite(body: FavoriteRequest) -> dict:
    fav = {"id": str(uuid4()), **body.meal.model_dump()}
    favs = _favorites()
    favs.append(fav)
    save_json(FAVORITES_FILE, favs)
    return {"favorite": fav}


@router.delete("")
async def delete_favorite(body: DeleteFavoriteRequest) -> dict:
    favs = [f for f in _favorites() if f.get("id") != body.id]
    save_json(FAVORITES_FILE, favs)
    return {"deleted": True, "id": body.id}
