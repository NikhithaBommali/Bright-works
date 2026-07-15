from __future__ import annotations

from app.models.todo import Todo


def test_list_todos_empty(client) -> None:
    response = client.get("/api/todos")
    assert response.status_code == 200
    assert response.json() == []


def test_create_todo(client) -> None:
    response = client.post("/api/todos", json={"title": "Buy milk"})
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["title"] == "Buy milk"
    assert data["completed"] is False
    assert "created_at" in data
    assert "updated_at" in data


def test_patch_todo(client) -> None:
    created = client.post("/api/todos", json={"title": "Buy milk"}).json()
    response = client.patch(f"/api/todos/{created['id']}", json={"completed": True})
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] is True
    assert data["title"] == "Buy milk"


def test_delete_todo(client) -> None:
    created = client.post("/api/todos", json={"title": "Buy milk"}).json()
    response = client.delete(f"/api/todos/{created['id']}")
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert client.get("/api/todos").json() == []


def test_validation_errors(client) -> None:
    response = client.post("/api/todos", json={})
    assert response.status_code == 422
    response = client.patch("/api/todos/1", json={"completed": "yes"})
    assert response.status_code == 422
