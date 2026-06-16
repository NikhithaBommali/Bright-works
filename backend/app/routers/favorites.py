from fastapi import APIRouter

from app.persistence import FAVORITES_FILE, load_json, save_json
from app.schemas.meals import DeleteFavoriteRequest, FavoriteRequest, FavoritesEnvelope

router = APIRouter(prefix="/api/favorites")
