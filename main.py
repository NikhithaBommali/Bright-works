from __future__ import annotations

# API CONTRACT
# GET /api/tasks
#   response: [{"id": int, "title": str, "description": str, "status": "todo"|"in-progress"|"done"}]
# POST /api/tasks
#   request:  {"title": str, "description": str, "status": "todo"|"in-progress"|"done"}
#   response: {"id": int, "title": str, "description": str, "status": "todo"|"in-progress"|"done"}
# GET /api/tasks/{id}
#   response: {"id": int, "title": str, "description": str, "status": "todo"|"in-progress"|"done"}
# PUT /api/tasks/{id}
#   request:  {"title": str, "description": str, "status": "todo"|"in-progress"|"done"}
#   response: {"id": int, "title": str, "description": str, "status": "todo"|"in-progress"|"done"}
# DELETE /api/tasks/{id}
#   response: null

import os
from pathlib import Path
from typing import Literal

import aiosqlite
from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

TaskStatus = Literal["todo", "in-progress", "done"]
DATA_DIR = Path(os.getenv("BW_DATA_DIR", "/app/data"))
DB_PATH = DATA_DIR / "taskflow.db"


class TaskCreateUpdate(BaseModel):
    """Task payload for create and update requests."""

    title: str
    description: str
    status: TaskStatus


class Task(BaseModel):
    """Task response payload."""

    id: int
    title: str
    description: str
    status: TaskStatus


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def init_db() -> None:
    """Create the SQLite database and tasks table if they do not exist."""

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'done'))
            )
            """
        )
        await db.commit()


async def row_to_task(row: aiosqlite.Row | tuple[int, str, str, str] | None) -> Task:
    """Convert a SQLite row to a Task model."""

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return Task(id=row[0], title=row[1], description=row[2], status=row[3])


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize persistent storage during application startup."""

    await init_db()


@app.get("/api/tasks", response_model=list[Task])
async def list_tasks() -> list[Task]:
    """Return all tasks as a bare JSON array."""

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT id, title, description, status FROM tasks ORDER BY id ASC"
        )
        rows = await cursor.fetchall()
        await cursor.close()
    return [Task(id=row[0], title=row[1], description=row[2], status=row[3]) for row in rows]


@app.post("/api/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreateUpdate) -> Task:
    """Create a new task."""

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)",
            (payload.title, payload.description, payload.status),
        )
        await db.commit()
        task_id = cursor.lastrowid
        await cursor.close()

        select_cursor = await db.execute(
            "SELECT id, title, description, status FROM tasks WHERE id = ?", (task_id,)
        )
        row = await select_cursor.fetchone()
        await select_cursor.close()
    return await row_to_task(row)


@app.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(task_id: int) -> Task:
    """Return a single task by id."""

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT id, title, description, status FROM tasks WHERE id = ?", (task_id,)
        )
        row = await cursor.fetchone()
        await cursor.close()
    return await row_to_task(row)


@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: int, payload: TaskCreateUpdate) -> Task:
    """Update an existing task by id."""

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?",
            (payload.title, payload.description, payload.status, task_id),
        )
        await db.commit()
        updated = cursor.rowcount
        await cursor.close()
        if updated == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        select_cursor = await db.execute(
            "SELECT id, title, description, status FROM tasks WHERE id = ?", (task_id,)
        )
        row = await select_cursor.fetchone()
        await select_cursor.close()
    return await row_to_task(row)


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int) -> Response:
    """Delete a task by id."""

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        await db.commit()
        deleted = cursor.rowcount
        await cursor.close()
    if deleted == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
