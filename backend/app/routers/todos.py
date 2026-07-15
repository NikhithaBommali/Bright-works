# API CONTRACT
# GET  /api/todos
#   response: [
#     {"id": int, "title": str, "completed": bool, "created_at": str, "updated_at": str}
#   ]
# POST /api/todos
#   request:  {"title": str}
#   response: {"id": int, "title": str, "completed": bool, "created_at": str, "updated_at": str}
# PATCH /api/todos/{id}
#   request:  {"completed": bool}
#   response: {"id": int, "title": str, "completed": bool, "created_at": str, "updated_at": str}
# DELETE /api/todos/{id}
#   response: {"ok": true}

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoOut, TodoUpdate

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=list[TodoOut])
async def list_todos(db: Session = Depends(get_db)) -> list[Todo]:
    return db.query(Todo).order_by(Todo.id.asc()).all()


@router.post("", response_model=TodoOut, status_code=status.HTTP_201_CREATED)
async def create_todo(body: TodoCreate, db: Session = Depends(get_db)) -> Todo:
    todo = Todo(title=body.title, completed=False)
    db.add(todo)
    try:
        db.flush()
        db.refresh(todo)
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail={"error": "todo_create_failed", "message": "Failed to create todo"}) from exc
    return todo


@router.patch("/{todo_id}", response_model=TodoOut)
async def update_todo(todo_id: int = Path(ge=1), body: TodoUpdate | None = None, db: Session = Depends(get_db)) -> Todo:
    todo = db.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail={"error": "todo_not_found", "message": "Todo not found"})
    assert body is not None
    todo.completed = body.completed
    try:
        db.flush()
        db.refresh(todo)
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail={"error": "todo_update_failed", "message": "Failed to update todo"}) from exc
    return todo


@router.delete("/{todo_id}")
async def delete_todo(todo_id: int = Path(ge=1), db: Session = Depends(get_db)) -> dict[str, bool]:
    todo = db.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail={"error": "todo_not_found", "message": "Todo not found"})
    try:
        db.delete(todo)
        db.flush()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail={"error": "todo_delete_failed", "message": "Failed to delete todo"}) from exc
    return {"ok": True}
