import os
from contextlib import asynccontextmanager
from enum import Enum
from pathlib import Path
from typing import AsyncGenerator

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Integer, String, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# API CONTRACT
# GET /api/tasks
#   response: [{"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}]
# POST /api/tasks
#   request:  {"title": str, "description": str, "status": "todo" | "in-progress" | "done"}  # all required
#   response: {"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}
# GET /api/tasks/{id}
#   response: {"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}
# PUT /api/tasks/{id}
#   request:  {"title": str, "description": str, "status": "todo" | "in-progress" | "done"}  # all required
#   response: {"id": int, "title": str, "description": str, "status": "todo" | "in-progress" | "done"}
# DELETE /api/tasks/{id}
#   response: null


BW_DATA_DIR = Path(os.getenv("BW_DATA_DIR", "/app/data"))
BW_DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite+aiosqlite:///{BW_DATA_DIR / 'taskflow.db'}"


class Base(DeclarativeBase):
    """Base ORM model class."""


class TaskStatus(str, Enum):
    """Allowed task status values."""

    TODO = "todo"
    IN_PROGRESS = "in-progress"
    DONE = "done"


class TaskORM(Base):
    """SQLite-backed task record."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)


class TaskCreate(BaseModel):
    """Task creation payload."""

    title: str
    description: str
    status: TaskStatus
    model_config = ConfigDict(extra="forbid")


class TaskUpdate(BaseModel):
    """Task update payload."""

    title: str
    description: str
    status: TaskStatus
    model_config = ConfigDict(extra="forbid")


class TaskRead(BaseModel):
    """Task response payload."""

    id: int
    title: str
    description: str
    status: TaskStatus
    model_config = ConfigDict(from_attributes=True)


engine = create_async_engine(DATABASE_URL, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    """Create database tables if they do not already exist."""

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize application resources on startup."""

    await init_db()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session."""

    async with SessionLocal() as session:
        yield session


@app.get("/api/tasks", response_model=list[TaskRead], status_code=status.HTTP_200_OK)
async def list_tasks(session: AsyncSession = Depends(get_session)) -> list[TaskRead]:
    """Return all tasks as a bare JSON array."""

    result = await session.execute(select(TaskORM).order_by(TaskORM.id))
    tasks = result.scalars().all()
    return [TaskRead.model_validate(task) for task in tasks]


@app.post("/api/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, session: AsyncSession = Depends(get_session)) -> TaskRead:
    """Create a new task."""

    task = TaskORM(
        title=payload.title,
        description=payload.description,
        status=payload.status.value,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return TaskRead.model_validate(task)


@app.get("/api/tasks/{task_id}", response_model=TaskRead, status_code=status.HTTP_200_OK)
async def get_task(task_id: int, session: AsyncSession = Depends(get_session)) -> TaskRead:
    """Return a single task by id."""

    task = await session.get(TaskORM, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return TaskRead.model_validate(task)


@app.put("/api/tasks/{task_id}", response_model=TaskRead, status_code=status.HTTP_200_OK)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    session: AsyncSession = Depends(get_session),
) -> TaskRead:
    """Update an existing task."""

    task = await session.get(TaskORM, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task.title = payload.title
    task.description = payload.description
    task.status = payload.status.value
    await session.commit()
    await session.refresh(task)
    return TaskRead.model_validate(task)


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, session: AsyncSession = Depends(get_session)) -> Response:
    """Delete a task by id."""

    task = await session.get(TaskORM, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await session.delete(task)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
