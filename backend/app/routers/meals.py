from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException

from app.meal_store import PLANS_FILE, load_json, save_json
from app.openai_service import generate_day, generate_meal
from app.schemas.meals import DayPlan, GenerateDayRequest, SuggestAlternativeRequest, WeekResponse

router = APIRouter(prefix="/api/meals")


@router.post("/generate-day", response_model=DayPlan)
async def generate_day_route(body: GenerateDayRequest) -> DayPlan:
    plan = generate_day(body.date, body.preferences)
    plans = load_json(PLANS_FILE, {})
    plans[body.date] = plan.model_dump()
    save_json(PLANS_FILE, plans)
    return plan


@router.post("/suggest-alternative", response_model=DayPlan)
async def suggest_alternative_route(body: SuggestAlternativeRequest) -> DayPlan:
    if body.currentPlan.date != body.date:
        raise HTTPException(status_code=422, detail="currentPlan.date must match date")
    updated_meals = []
    replaced = False
    for meal in body.currentPlan.meals:
        if meal.slot == body.slot and not replaced:
            updated_meals.append(generate_meal(body.date, body.slot, body.preferences))
            replaced = True
        else:
            updated_meals.append(meal)
    if not replaced:
        raise HTTPException(status_code=422, detail="Requested slot not found in currentPlan")
    updated = DayPlan(date=body.date, meals=updated_meals)
    plans = load_json(PLANS_FILE, {})
    plans[body.date] = updated.model_dump()
    save_json(PLANS_FILE, plans)
    return updated


@router.get("/week/{date}", response_model=WeekResponse)
async def get_week(date: str) -> WeekResponse:
    base = datetime.fromisoformat(date).date()
    plans = load_json(PLANS_FILE, {})
    days = []
    for offset in range(7):
        day_date = (base + timedelta(days=offset)).isoformat()
        stored = plans.get(day_date)
        days.append(DayPlan.model_validate(stored) if stored is not None else DayPlan(date=day_date, meals=[]))
    return WeekResponse(selectedDate=date, days=days)
