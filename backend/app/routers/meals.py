from fastapi import APIRouter, HTTPException

from app.persistence import load_json, save_json, MEAL_PLANS_FILE
from app.schemas.meals import DayPlanEnvelope, DeleteFavoriteRequest, FavoriteRequest, FavoritesEnvelope, GenerateDayRequest, Meal, SuggestAlternativeRequest
from app.openai_service import generate_day, generate_single

router = APIRouter(prefix="/api/meals")
