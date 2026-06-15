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
#   response: 204 No Content

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db, init_db
from app.models.task import TaskORM
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate

app = FastAPI(title="TaskFlow API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    init_db()


@app.get("/api/tasks", response_model=list[TaskRead])
async def list_tasks(db: Annotated[Session, Depends(get_db)]) -> list[TaskORM]:
    return db.query(TaskORM).order_by(TaskORM.id.asc()).all()


@app.post("/api/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, db: Annotated[Session, Depends(get_db)]) -> TaskORM:
    task = TaskORM(
        title=payload.title,
        description=payload.description,
        status=payload.status,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.get("/api/tasks/{task_id}", response_model=TaskRead)
async def get_task(task_id: int, db: Annotated[Session, Depends(get_db)]) -> TaskORM:
    task = db.get(TaskORM, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@app.put("/api/tasks/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> TaskORM:
    task = db.get(TaskORM, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task.title = payload.title
    task.description = payload.description
    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    task = db.get(TaskORM, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
