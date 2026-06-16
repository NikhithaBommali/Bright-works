from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers_favorites import router as favorites_router
from app.routers_meals import router as meals_router
from app.routers_preferences import router as preferences_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
app.include_router(preferences_router)
app.include_router(meals_router)
app.include_router(favorites_router)
