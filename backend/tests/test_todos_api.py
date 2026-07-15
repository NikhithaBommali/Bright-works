# AC-3: Backend exposes working CRUD endpoints for todos.
# AC-4: Backend validation rejects malformed todo payloads with a clear client error response.

def test_get_todos_returns_bare_json_array(client):
    response = client.get("/api/todos")
    assert response.status_code == 200
    assert response.json() == []


def test_post_todos_creates_todo_with_expected_fields(client):
    response = client.post("/api/todos", json={"title": "Test todo"})
    assert response.status_code == 201
    data = response.json()
    assert set(data.keys()) == {"id", "title", "completed", "created_at", "updated_at"}
    assert data["title"] == "Test todo"
    assert data["completed"] is False


def test_get_todos_returns_created_todo_in_bare_array(client):
    created = client.post("/api/todos", json={"title": "Test todo"}).json()
    response = client.get("/api/todos")
    assert response.status_code == 200
    assert response.json() == [created]


def test_patch_todos_updates_completed_state(client):
    created = client.post("/api/todos", json={"title": "Test todo"}).json()
    response = client.patch(f"/api/todos/{created['id']}", json={"completed": True})
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"id", "title", "completed", "created_at", "updated_at"}
    assert data["completed"] is True


def test_delete_todos_returns_ok_true(client):
    created = client.post("/api/todos", json={"title": "Test todo"}).json()
    response = client.delete(f"/api/todos/{created['id']}")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_post_todos_rejects_invalid_title_payload(client):
    response = client.post("/api/todos", json={"title": ""})
    assert response.status_code == 422


def test_patch_todos_rejects_invalid_completed_payload(client):
    created = client.post("/api/todos", json={"title": "Test todo"}).json()
    response = client.patch(f"/api/todos/{created['id']}", json={"completed": "yes"})
    assert response.status_code == 422
