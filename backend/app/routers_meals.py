from __future__ import annotations

from datetime import date as date_type, timedelta
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.openai_service import generate_alternative, generate_day
from app.persistence import DayMeals, DayPlan, Meal, get_meal_plan, save_meal_plan

router = APIRouter(prefix="/api/meals", tags=["meals"])

SlotName = Literal["breakfast", "lunch", "snack", "dinner"]


class GenerateDayBody(BaseModel):
    date: str
    preferences: object


class SuggestAlternativeBody(BaseModel):
    date: str
    slot: SlotName
    preferences: object


class DayPlanResponse(BaseModel):
    date: str
    meals: DayMeals


class WeekDay(BaseModel):
    date: str
    planned: bool
    meals: dict[str, Meal | None]


class WeekResponse(BaseModel):
    weekStartDate: str
    days: list[WeekDay]


class ErrorResponse(BaseModel):
    detail: str


@router.post("/generate-day", response_model=DayPlanResponse)
async def generate_day_route(body: GenerateDayBody) -> DayPlanResponse:
    meals = generate_day(body.date, body.preferences)  # type: ignore[arg-type]
    plan = DayPlan(date=body.date, meals=DayMeals(**meals))
    save_meal_plan(plan)
    return DayPlanResponse(date=plan.date, meals=plan.meals)


@router.post("/suggest-alternative", response_model=DayPlanResponse)
async def suggest_alternative_route(body: SuggestAlternativeBody) -> DayPlanResponse:
    existing = get_meal_plan(body.date)
    if existing is None:
        raise HTTPException(status_code=404, detail="Meal plan not found for the requested date")
    updated_meals = existing.meals.model_dump()
    replacement = generate_alternative(body.date, body.slot, body.preferences, existing.meals.model_dump())  # type: ignore[arg-type]
    updated_meals[body.slot] = replacement
    plan = DayPlan(date=body.date, meals=DayMeals(**updated_meals))
    save_meal_plan(plan)
    return DayPlanResponse(date=plan.date, meals=plan.meals)


@router.get("/week/{day}", response_model=WeekResponse)
async def week_for_day(day: str) -> WeekResponse:
    start = date_type.fromisoformat(day)
    days: list[WeekDay] = []
    for offset in range(7):
        current = start + timedelta(days=offset)
        plan = get_meal_plan(current.isoformat())
        meals = plan.meals.model_dump() if plan else {"breakfast": None, "lunch": None, "snack": None, "dinner": None}
        days.append(WeekDay(date=current.isoformat(), planned=plan is not None, meals=meals))
    return WeekResponse(weekStartDate=start.isoformat(), days=days)
