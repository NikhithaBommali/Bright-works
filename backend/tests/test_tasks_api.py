import pytest
from httpx import AsyncClient


EXPECTED_FIELDS = {"id", "title", "description", "status"}


async def create_task(client: AsyncClient, *, title: str, description: str, status: str):
    response = await client.post(
        "/api/tasks",
        json={"title": title, "description": description, "status": status},
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_post_tasks_creates_task_with_exact_contract_fields(client: AsyncClient):
    response = await client.post(
        "/api/tasks",
        json={
            "title": "Write tests",
            "description": "Add backend API coverage",
            "status": "todo",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert set(body.keys()) == EXPECTED_FIELDS
    assert isinstance(body["id"], int)
    assert body["title"] == "Write tests"
    assert body["description"] == "Add backend API coverage"
    assert body["status"] == "todo"


@pytest.mark.asyncio
async def test_get_tasks_returns_http_200_and_bare_json_array(client: AsyncClient):
    created = await create_task(
        client,
        title="List me",
        description="Task should appear in bare array",
        status="todo",
    )

    response = await client.get("/api/tasks")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert not isinstance(body, dict)
    assert body == [
        {
            "id": created["id"],
            "title": "List me",
            "description": "Task should appear in bare array",
            "status": "todo",
        }
    ]
    assert set(body[0].keys()) == EXPECTED_FIELDS


@pytest.mark.asyncio
async def test_get_task_by_id_returns_matching_task(client: AsyncClient):
    created = await create_task(
        client,
        title="Fetch me",
        description="Task should be fetched by id",
        status="in-progress",
    )

    response = await client.get(f"/api/tasks/{created['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body == created
    assert set(body.keys()) == EXPECTED_FIELDS


@pytest.mark.asyncio
async def test_put_task_updates_title_description_and_status_using_exact_field_names(client: AsyncClient):
    created = await create_task(
        client,
        title="Old title",
        description="Old description",
        status="todo",
    )

    response = await client.put(
        f"/api/tasks/{created['id']}",
        json={
            "title": "New title",
            "description": "New description",
            "status": "done",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == EXPECTED_FIELDS
    assert body == {
        "id": created["id"],
        "title": "New title",
        "description": "New description",
        "status": "done",
    }

    get_response = await client.get(f"/api/tasks/{created['id']}")
    assert get_response.status_code == 200
    assert get_response.json() == body


@pytest.mark.asyncio
async def test_delete_task_removes_task_from_subsequent_get_tasks_results(client: AsyncClient):
    first = await create_task(
        client,
        title="Keep me",
        description="Should remain after delete",
        status="todo",
    )
    second = await create_task(
        client,
        title="Delete me",
        description="Should be removed from list",
        status="in-progress",
    )

    delete_response = await client.delete(f"/api/tasks/{second['id']}")

    assert delete_response.status_code == 204
    assert delete_response.text == ""

    list_response = await client.get("/api/tasks")

    assert list_response.status_code == 200
    assert list_response.json() == [first]


@pytest.mark.asyncio
async def test_post_tasks_rejects_invalid_status_values(client: AsyncClient):
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
async def test_put_tasks_rejects_invalid_status_values(client: AsyncClient):
    created = await create_task(
        client,
        title="Valid task",
        description="Created before invalid update",
        status="todo",
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


@pytest.mark.asyncio
async def test_get_task_by_missing_id_returns_404(client: AsyncClient):
    response = await client.get("/api/tasks/999999")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_put_task_by_missing_id_returns_404(client: AsyncClient):
    response = await client.put(
        "/api/tasks/999999",
        json={
            "title": "Missing",
            "description": "Missing",
            "status": "todo",
        },
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_by_missing_id_returns_404(client: AsyncClient):
    response = await client.delete("/api/tasks/999999")

    assert response.status_code == 404
