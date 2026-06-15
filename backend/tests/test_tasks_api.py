import pytest
from httpx import AsyncClient


async def create_task(client: AsyncClient, *, title: str, description: str, status: str):
    response = await client.post(
        "/api/tasks",
        json={"title": title, "description": description, "status": status},
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_get_tasks_returns_bare_json_array_with_exact_task_fields(client: AsyncClient):
    created = await create_task(
        client,
        title="Write tests",
        description="Add backend API coverage",
        status="todo",
    )

    response = await client.get("/api/tasks")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data == [
        {
            "id": created["id"],
            "title": "Write tests",
            "description": "Add backend API coverage",
            "status": "todo",
        }
    ]
    assert set(data[0].keys()) == {"id", "title", "description", "status"}


@pytest.mark.asyncio
async def test_post_and_get_task_persist_created_values(client: AsyncClient):
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


@pytest.mark.asyncio
async def test_put_task_updates_values_visible_in_get_and_list(client: AsyncClient):
    created = await create_task(
        client,
        title="Initial title",
        description="Initial description",
        status="todo",
    )

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
    assert updated == {
        "id": created["id"],
        "title": "Updated title",
        "description": "Updated description",
        "status": "done",
    }

    get_after_update = await client.get(f"/api/tasks/{created['id']}")

    assert get_after_update.status_code == 200
    assert get_after_update.json() == updated

    list_after_update = await client.get("/api/tasks")

    assert list_after_update.status_code == 200
    assert list_after_update.json() == [updated]


@pytest.mark.asyncio
async def test_delete_task_removes_task_from_get_and_list(client: AsyncClient):
    created = await create_task(
        client,
        title="Delete me",
        description="Task scheduled for deletion",
        status="in-progress",
    )

    delete_response = await client.delete(f"/api/tasks/{created['id']}")

    assert delete_response.status_code == 204
    assert delete_response.text == ""

    get_after_delete = await client.get(f"/api/tasks/{created['id']}")

    assert get_after_delete.status_code == 404

    list_after_delete = await client.get("/api/tasks")

    assert list_after_delete.status_code == 200
    assert list_after_delete.json() == []


@pytest.mark.asyncio
async def test_get_task_missing_id_returns_non_success(client: AsyncClient):
    response = await client.get("/api/tasks/999999")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_missing_id_returns_non_success(client: AsyncClient):
    response = await client.delete("/api/tasks/999999")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_post_task_rejects_missing_required_fields(client: AsyncClient):
    response = await client.post(
        "/api/tasks",
        json={"title": "Missing description", "status": "todo"},
    )

    assert response.status_code >= 400
    assert response.status_code < 600


@pytest.mark.asyncio
async def test_post_task_rejects_unsupported_status_value(client: AsyncClient):
    response = await client.post(
        "/api/tasks",
        json={
            "title": "Bad status",
            "description": "Should fail validation",
            "status": "blocked",
        },
    )

    assert response.status_code >= 400
    assert response.status_code < 600


@pytest.mark.asyncio
async def test_put_task_rejects_unsupported_status_value(client: AsyncClient):
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

    assert response.status_code >= 400
    assert response.status_code < 600


@pytest.mark.asyncio
async def test_put_task_rejects_missing_required_fields(client: AsyncClient):
    created = await create_task(
        client,
        title="Complete payload required",
        description="Task before invalid update",
        status="todo",
    )

    response = await client.put(
        f"/api/tasks/{created['id']}",
        json={"title": "Incomplete payload"},
    )

    assert response.status_code >= 400
    assert response.status_code < 600
