import os
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.append(str(Path(__file__).resolve().parents[1]))
os.environ["BW_DATA_DIR"] = "/tmp/taskflow-test-data"

from main import app  # noqa: E402
from app.database import init_db  # noqa: E402


@pytest.fixture(autouse=True)
async def reset_db():
    db_path = Path(os.environ["BW_DATA_DIR"]) / "taskflow.db"
    if db_path.exists():
        db_path.unlink()
    await init_db()
    yield
    if db_path.exists():
        db_path.unlink()


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client


@pytest.mark.asyncio
async def test_list_tasks_returns_bare_array_with_exact_contract_fields(client: AsyncClient) -> None:
    await client.post(
        "/api/tasks",
        json={"title": "Task 1", "description": "First task", "status": "todo"},
    )
    await client.post(
        "/api/tasks",
        json={"title": "Task 2", "description": "Second task", "status": "done"},
    )

    response = await client.get("/api/tasks")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert not isinstance(data, dict)
    assert len(data) == 2
    assert set(data[0].keys()) == {"id", "title", "description", "status"}
    assert set(data[1].keys()) == {"id", "title", "description", "status"}
    assert data[0]["title"] == "Task 1"
    assert data[0]["description"] == "First task"
    assert data[0]["status"] == "todo"
    assert isinstance(data[0]["id"], int)
    assert data[1]["title"] == "Task 2"
    assert data[1]["description"] == "Second task"
    assert data[1]["status"] == "done"
    assert isinstance(data[1]["id"], int)


@pytest.mark.asyncio
async def test_create_task_returns_created_task_with_id_and_persists(client: AsyncClient) -> None:
    payload = {"title": "Created task", "description": "Created description", "status": "in-progress"}

    response = await client.post("/api/tasks", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert set(data.keys()) == {"id", "title", "description", "status"}
    assert isinstance(data["id"], int)
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["status"] == payload["status"]

    persisted_response = await client.get(f"/api/tasks/{data['id']}")

    assert persisted_response.status_code == 200
    persisted = persisted_response.json()
    assert persisted["id"] == data["id"]
    assert persisted["title"] == payload["title"]
    assert persisted["description"] == payload["description"]
    assert persisted["status"] == payload["status"]


@pytest.mark.asyncio
async def test_get_task_by_id_returns_matching_task(client: AsyncClient) -> None:
    create_response = await client.post(
        "/api/tasks",
        json={"title": "Lookup task", "description": "Lookup description", "status": "todo"},
    )
    task_id = create_response.json()["id"]

    response = await client.get(f"/api/tasks/{task_id}")

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"id", "title", "description", "status"}
    assert data["id"] == task_id
    assert data["title"] == "Lookup task"
    assert data["description"] == "Lookup description"
    assert data["status"] == "todo"


@pytest.mark.asyncio
async def test_update_task_returns_exact_fields_and_persists_changes(client: AsyncClient) -> None:
    create_response = await client.post(
        "/api/tasks",
        json={"title": "Old title", "description": "Old description", "status": "todo"},
    )
    task_id = create_response.json()["id"]
    payload = {"title": "New title", "description": "New description", "status": "done"}

    response = await client.put(f"/api/tasks/{task_id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"id", "title", "description", "status"}
    assert data["id"] == task_id
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["status"] == payload["status"]

    persisted_response = await client.get(f"/api/tasks/{task_id}")

    assert persisted_response.status_code == 200
    persisted = persisted_response.json()
    assert persisted["id"] == task_id
    assert persisted["title"] == payload["title"]
    assert persisted["description"] == payload["description"]
    assert persisted["status"] == payload["status"]


@pytest.mark.asyncio
async def test_delete_task_removes_task_from_subsequent_list(client: AsyncClient) -> None:
    create_response = await client.post(
        "/api/tasks",
        json={"title": "Delete me", "description": "To be removed", "status": "todo"},
    )
    task_id = create_response.json()["id"]

    delete_response = await client.delete(f"/api/tasks/{task_id}")

    assert delete_response.status_code == 204

    list_response = await client.get("/api/tasks")

    assert list_response.status_code == 200
    data = list_response.json()
    assert isinstance(data, list)
    assert all(item["id"] != task_id for item in data)


@pytest.mark.asyncio
async def test_invalid_status_values_are_rejected_on_create_and_update(client: AsyncClient) -> None:
    invalid_create = await client.post(
        "/api/tasks",
        json={"title": "Bad task", "description": "Bad status", "status": "blocked"},
    )

    assert invalid_create.status_code == 422
    create_body = invalid_create.json()
    assert "detail" in create_body
    assert any(error["loc"][-1] == "status" for error in create_body["detail"])

    create_response = await client.post(
        "/api/tasks",
        json={"title": "Valid task", "description": "Valid status", "status": "todo"},
    )
    task_id = create_response.json()["id"]

    invalid_update = await client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Valid task", "description": "Valid status", "status": "blocked"},
    )

    assert invalid_update.status_code == 422
    update_body = invalid_update.json()
    assert "detail" in update_body
    assert any(error["loc"][-1] == "status" for error in update_body["detail"])
