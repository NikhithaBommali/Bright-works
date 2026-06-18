from __future__ import annotations

from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("BW_DATA_DIR", str(tmp_path))

    import importlib
    import sys

    sys.modules.pop("main", None)
    main = importlib.import_module("main")

    transport = ASGITransport(app=main.app)
    async with main.app.router.lifespan_context(main.app):
        async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
            yield async_client


@pytest.mark.asyncio
async def test_get_tasks_returns_bare_json_array_with_exact_contract_fields(client: AsyncClient):
    create_response = await client.post(
        "/api/tasks",
        json={
            "title": "Write tests",
            "description": "Cover TaskFlow CRUD endpoints",
            "status": "todo",
        },
    )
    assert create_response.status_code == 201

    response = await client.get("/api/tasks")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert not isinstance(data, dict)
    assert len(data) == 1
    assert set(data[0].keys()) == {"id", "title", "description", "status"}
    assert data[0]["title"] == "Write tests"
    assert data[0]["description"] == "Cover TaskFlow CRUD endpoints"
    assert data[0]["status"] == "todo"


@pytest.mark.asyncio
async def test_post_tasks_creates_task_and_returns_exact_contract_fields(client: AsyncClient):
    payload = {
        "title": "Ship feature",
        "description": "Implement task endpoint",
        "status": "in-progress",
    }

    response = await client.post("/api/tasks", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert set(data.keys()) == {"id", "title", "description", "status"}
    assert isinstance(data["id"], int)
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["status"] == payload["status"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload,missing_field",
    [
        ({"description": "Missing title", "status": "todo"}, "title"),
        ({"title": "Missing description", "status": "todo"}, "description"),
        ({"title": "Missing status", "description": "Required field absent"}, "status"),
    ],
)
async def test_post_tasks_missing_required_field_returns_validation_error(
    client: AsyncClient, payload: dict[str, str], missing_field: str
):
    response = await client.post("/api/tasks", json=payload)

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(error["loc"][-1] == missing_field for error in detail)


@pytest.mark.asyncio
async def test_post_tasks_invalid_status_returns_validation_error(client: AsyncClient):
    response = await client.post(
        "/api/tasks",
        json={
            "title": "Bad status",
            "description": "Should fail validation",
            "status": "blocked",
        },
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(error["loc"][-1] == "status" for error in detail)


@pytest.mark.asyncio
async def test_get_task_by_id_returns_exact_contract_fields(client: AsyncClient):
    create_response = await client.post(
        "/api/tasks",
        json={
            "title": "Fetch me",
            "description": "Read single task",
            "status": "done",
        },
    )
    task_id = create_response.json()["id"]

    response = await client.get(f"/api/tasks/{task_id}")

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"id", "title", "description", "status"}
    assert data["id"] == task_id
    assert data["title"] == "Fetch me"
    assert data["description"] == "Read single task"
    assert data["status"] == "done"


@pytest.mark.asyncio
async def test_get_task_by_id_missing_task_returns_404(client: AsyncClient):
    response = await client.get("/api/tasks/999999")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_put_task_updates_task_and_returns_exact_contract_fields(client: AsyncClient):
    create_response = await client.post(
        "/api/tasks",
        json={
            "title": "Before",
            "description": "Old description",
            "status": "todo",
        },
    )
    task_id = create_response.json()["id"]

    response = await client.put(
        f"/api/tasks/{task_id}",
        json={
            "title": "After",
            "description": "New description",
            "status": "in-progress",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"id", "title", "description", "status"}
    assert data["id"] == task_id
    assert data["title"] == "After"
    assert data["description"] == "New description"
    assert data["status"] == "in-progress"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload,missing_field",
    [
        ({"description": "Missing title", "status": "todo"}, "title"),
        ({"title": "Missing description", "status": "todo"}, "description"),
        ({"title": "Missing status", "description": "Required field absent"}, "status"),
    ],
)
async def test_put_task_missing_required_field_returns_validation_error(
    client: AsyncClient, payload: dict[str, str], missing_field: str
):
    create_response = await client.post(
        "/api/tasks",
        json={
            "title": "Original",
            "description": "Original description",
            "status": "todo",
        },
    )
    task_id = create_response.json()["id"]

    response = await client.put(f"/api/tasks/{task_id}", json=payload)

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(error["loc"][-1] == missing_field for error in detail)


@pytest.mark.asyncio
async def test_put_task_invalid_status_returns_validation_error(client: AsyncClient):
    create_response = await client.post(
        "/api/tasks",
        json={
            "title": "Original",
            "description": "Original description",
            "status": "todo",
        },
    )
    task_id = create_response.json()["id"]

    response = await client.put(
        f"/api/tasks/{task_id}",
        json={
            "title": "Original",
            "description": "Original description",
            "status": "blocked",
        },
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(error["loc"][-1] == "status" for error in detail)


@pytest.mark.asyncio
async def test_put_task_missing_task_returns_404(client: AsyncClient):
    response = await client.put(
        "/api/tasks/999999",
        json={
            "title": "Missing",
            "description": "No such task",
            "status": "done",
        },
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_removes_task_and_subsequent_get_returns_404(client: AsyncClient):
    create_response = await client.post(
        "/api/tasks",
        json={
            "title": "Delete me",
            "description": "Will be removed",
            "status": "todo",
        },
    )
    task_id = create_response.json()["id"]

    delete_response = await client.delete(f"/api/tasks/{task_id}")

    assert delete_response.status_code == 204
    assert delete_response.content == b""

    get_response = await client.get(f"/api/tasks/{task_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_missing_task_returns_404(client: AsyncClient):
    response = await client.delete("/api/tasks/999999")

    assert response.status_code == 404
