from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException

from app.meal_api import AltRequest, DayPlanOut, DayRequest, MealOut, MealSlot, generate_day, generate_meal
from app.meal_store import PLANS_FILE, load_json, save_json

router = APIRouter(prefix="/api/meals")


def _plans() -> dict[str, dict[str, object]]:
    return load_json(PLANS_FILE, {})


def _save_plans(plans: dict[str, dict[str, object]]) -> None:
    save_json(PLANS_FILE, plans)


@router.post("/generate-day", response_model=DayPlanOut)
async def generate_day_route(body: DayRequest) -> DayPlanOut:
    plan = generate_day(body.date, body.preferences)
    plans = _plans()
    plans[body.date] = plan.model_dump()
    _save_plans(plans)
    return plan


@router.post("/suggest-alternative")
async def suggest_alternative_route(body: AltRequest) -> dict:
    plans = _plans()
    stored = plans.get(body.date)
    if stored is None:
        raise HTTPException(status_code=404, detail="No plan exists for that date")
    current = DayPlanOut.model_validate(stored)
    meal = generate_meal(body.date, body.slot, body.preferences)
    updated = current.model_dump()
    updated["meals"][body.slot] = meal.model_dump()
    plans[body.date] = updated
    _save_plans(plans)
    return {"date": body.date, "slot": body.slot, "meal": meal.model_dump(), "meals": updated["meals"]}


@router.get("/../week/{selected_date}")
async def get_week(selected_date: str) -> dict:
    plans = _plans()
    base = datetime.fromisoformat(selected_date).date()
    days = []
    for offset in range(7):
        day = (base + timedelta(days=offset)).isoformat()
        stored = plans.get(day)
        meals = {slot: None for slot in ["breakfast", "lunch", "snack", "dinner"]}
        if stored:
            meals.update(stored.get("meals", {}))
        days.append({"date": day, "meals": meals})
    return {"selectedDate": selected_date, "days": days}
