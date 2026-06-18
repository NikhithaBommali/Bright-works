from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseUpdate

# API CONTRACT
# GET  /api/expenses
#   response: [{"id": int, "amount": float, "category": "food|transport|shopping|other", "note": str, "date": "YYYY-MM-DD"}, ...]
# POST /api/expenses
#   request:  {"amount": float, "category": "food|transport|shopping|other", "note": str?, "date": "YYYY-MM-DD"}
#   response: {"id": int, "amount": float, "category": "food|transport|shopping|other", "note": str, "date": "YYYY-MM-DD"}
# PUT  /api/expenses/{id}
#   request:  {"amount": float, "category": "food|transport|shopping|other", "note": str?, "date": "YYYY-MM-DD"}
#   response: {"id": int, "amount": float, "category": "food|transport|shopping|other", "note": str, "date": "YYYY-MM-DD"}
# DELETE /api/expenses/{id}
#   response: 204 No Content

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


async def _ensure_tables(db: Session) -> None:
    from app.database import engine, Base
    from app.models import expense as _expense  # noqa: F401
    Base.metadata.create_all(bind=engine)


@router.get("", response_model=list[ExpenseOut])
async def list_expenses(db: Session = Depends(get_db)) -> list[ExpenseOut]:
    await _ensure_tables(db)
    expenses = db.execute(select(Expense).order_by(Expense.id.asc())).scalars().all()
    return expenses


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)) -> ExpenseOut:
    await _ensure_tables(db)
    expense = Expense(**payload.model_dump())
    if expense.note is None:
        expense.note = ""
    db.add(expense)
    db.flush()
    db.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(expense_id: int, payload: ExpenseUpdate, db: Session = Depends(get_db)) -> ExpenseOut:
    await _ensure_tables(db)
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    for key, value in payload.model_dump().items():
        setattr(expense, key, value)
    if expense.note is None:
        expense.note = ""
    db.add(expense)
    db.flush()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
async def delete_expense(expense_id: int, db: Session = Depends(get_db)) -> None:
    await _ensure_tables(db)
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    db.delete(expense)
    return None
