import importlib
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def client(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    monkeypatch.setenv("BW_DATA_DIR", str(data_dir))

    sys.modules.pop("main", None)
    app_module = importlib.import_module("main")

    transport = ASGITransport(app=app_module.app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        await app_module.init_db()
        yield test_client


async def create_task(client: AsyncClient, *, title: str, description: str, status: str):
    response = await client.post(
        "/api/tasks",
        json={"title": title, "description": description, "status": status},
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_get_tasks_returns_bare_array_and_exact_task_shape(client: AsyncClient):
    created = await create_task(
        client,
        title="Write tests",
        description="Add API coverage for tasks",
        status="todo",
    )

    response = await client.get("/api/tasks")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert "items" not in response.json()
    assert data == [
        {
            "id": created["id"],
            "title": "Write tests",
            "description": "Add API coverage for tasks",
            "status": "todo",
        }
    ]
    assert set(data[0].keys()) == {"id", "title", "description", "status"}


@pytest.mark.asyncio
async def test_task_crud_flow_matches_contract_and_delete_removes_from_later_list(client: AsyncClient):
    create_response = await client.post(
        "/api/tasks",
        json={
            "title": "Initial title",
            "description": "Initial description",
            "status": "todo",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert set(created.keys()) == {"id", "title", "description", "status"}
    assert created["title"] == "Initial title"
    assert created["description"] == "Initial description"
    assert created["status"] == "todo"

    get_response = await client.get(f"/api/tasks/{created['id']}")

    assert get_response.status_code == 200
    assert get_response.json() == created

    update_response = await client.put(
        f"/api/tasks/{created['id']}",
        json={
            "title": "Updated title",
            "description": "Updated description",
            "status": "done",
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert set(updated.keys()) == {"id", "title", "description", "status"}
    assert updated["id"] == created["id"]
    assert updated["title"] == "Updated title"
    assert updated["description"] == "Updated description"
    assert updated["status"] == "done"

    delete_response = await client.delete(f"/api/tasks/{created['id']}")

    assert delete_response.status_code == 204
    assert delete_response.text == ""

    list_response = await client.get("/api/tasks")

    assert list_response.status_code == 200
    assert list_response.json() == []


@pytest.mark.asyncio
async def test_post_task_rejects_invalid_status(client: AsyncClient):
    response = await client.post(
        "/api/tasks",
        json={
            "title": "Bad status",
            "description": "Should fail validation",
            "status": "blocked",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_put_task_rejects_invalid_status(client: AsyncClient):
    created = await create_task(
        client,
        title="Valid task",
        description="Created before invalid update",
        status="in-progress",
    )

    response = await client.put(
        f"/api/tasks/{created['id']}",
        json={
            "title": "Still valid title",
            "description": "Still valid description",
            "status": "blocked",
        },
    )

    assert response.status_code == 422
