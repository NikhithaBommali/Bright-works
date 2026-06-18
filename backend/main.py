from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import expense  # noqa: F401
from app.routers import expenses

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(expenses.router)
