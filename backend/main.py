from contextlib import asynccontextmanager
import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

# API CONTRACT
# GET /api/expenses
#   response: [{"id": number, "amount": number, "category": "food|transport|shopping|other", "note": string, "date": string}, ...]
# POST /api/expenses
#   request:  {"amount": number, "category": string, "note": string, "date": string}
#   response: {"id": number, "amount": number, "category": "food|transport|shopping|other", "note": string, "date": string}
# PUT /api/expenses/{expense_id}
#   request:  {"amount": number, "category": string, "note": string, "date": string}
#   response: {"id": number, "amount": number, "category": "food|transport|shopping|other", "note": string, "date": string}
# DELETE /api/expenses/{expense_id}
#   response: {"ok": true}

ALLOWED_CATEGORIES = {"food", "transport", "shopping", "other"}
DATA_DIR = Path(os.environ.get("BW_DATA_DIR", "."))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "spendlog.db"
ENGINE: Engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=ENGINE, autocommit=False, autoflush=False)
router = APIRouter(prefix="/api")


class ExpenseCreate(BaseModel):
    amount: float
    category: str
    note: str
    date: str
    model_config = ConfigDict(extra="forbid")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("amount must be greater than 0")
        return value

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in ALLOWED_CATEGORIES:
            raise ValueError("invalid category")
        return value


class ExpenseOut(ExpenseCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ExpenseRow:
    def __init__(self, row: Any) -> None:
        self.id = int(row["id"])
        self.amount = float(row["amount"])
        self.category = str(row["category"])
        self.note = str(row["note"])
        self.date = str(row["date"])


def _db_session() -> Session:
    return SessionLocal()


def _row_to_expense(row: Any) -> ExpenseOut:
    return ExpenseOut.model_validate(ExpenseRow(row))


def _ensure_db() -> None:
    with ENGINE.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    note TEXT NOT NULL,
                    date TEXT NOT NULL
                )
                """
            )
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    _ensure_db()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@router.get("/expenses", response_model=list[ExpenseOut])
def get_expenses() -> list[ExpenseOut]:
    with _db_session() as db:
        rows = db.execute(text("SELECT id, amount, category, note, date FROM expenses ORDER BY id DESC")).mappings().all()
        return [_row_to_expense(row) for row in rows]


@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate) -> ExpenseOut:
    with _db_session() as db:
        result = db.execute(
            text("INSERT INTO expenses (amount, category, note, date) VALUES (:amount, :category, :note, :date)"),
            payload.model_dump(),
        )
        expense_id = int(result.lastrowid)
        db.commit()
        row = db.execute(
            text("SELECT id, amount, category, note, date FROM expenses WHERE id = :id"),
            {"id": expense_id},
        ).mappings().one()
        return _row_to_expense(row)


@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, payload: ExpenseCreate) -> ExpenseOut:
    with _db_session() as db:
        existing = db.execute(text("SELECT id FROM expenses WHERE id = :id"), {"id": expense_id}).first()
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        db.execute(
            text("UPDATE expenses SET amount = :amount, category = :category, note = :note, date = :date WHERE id = :id"),
            {**payload.model_dump(), "id": expense_id},
        )
        db.commit()
        row = db.execute(
            text("SELECT id, amount, category, note, date FROM expenses WHERE id = :id"),
            {"id": expense_id},
        ).mappings().one()
        return _row_to_expense(row)


@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int) -> dict[str, bool]:
    with _db_session() as db:
        result = db.execute(text("DELETE FROM expenses WHERE id = :id"), {"id": expense_id})
        if result.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        db.commit()
    return {"ok": True}
