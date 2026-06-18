import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models.contact import Contact
from main import app


@pytest.fixture()
def client():
    engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
            db.commit()
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


# AC-4: The backend rejects create or update requests that omit name with a client-error response.
# AC-5: The backend rejects create or update requests with an invalid email format when email is provided.
# AC-10: The backend exposes CRUD endpoints under /api/contacts for list, create, read, update, and delete operations.

def test_create_contact_with_valid_payload_succeeds_and_persists_fields(client):
    payload = {"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"}

    response = client.post("/api/contacts", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Alice"
    assert body["email"] is None
    assert body["phone"] == "123"
    assert body["company"] == "Acme"
    assert body["notes"] == "hi"
    assert "id" in body


def test_get_contacts_returns_bare_json_array_of_contacts(client):
    client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"})

    response = client.get("/api/contacts")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["name"] == "Alice"
    assert set(body[0].keys()) == {"id", "name", "email", "phone", "company", "notes"}


def test_get_contacts_search_filters_by_name(client):
    client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"})
    client.post("/api/contacts", json={"name": "Bob", "email": None, "phone": "456", "company": "Beta", "notes": "yo"})

    response = client.get("/api/contacts", params={"search": "ali"})

    assert response.status_code == 200
    assert [contact["name"] for contact in response.json()] == ["Alice"]


def test_get_contact_returns_stored_fields(client):
    created = client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"}).json()

    response = client.get(f"/api/contacts/{created['id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_update_contact_updates_stored_values(client):
    created = client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"}).json()
    update_payload = {"name": "Alice Smith", "email": "alice@example.com", "phone": "999", "company": "Globex", "notes": "updated"}

    response = client.put(f"/api/contacts/{created['id']}", json=update_payload)

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]
    assert response.json()["name"] == "Alice Smith"
    assert response.json()["email"] == "alice@example.com"
    assert response.json()["phone"] == "999"
    assert response.json()["company"] == "Globex"
    assert response.json()["notes"] == "updated"


def test_delete_contact_returns_ok_true_and_removes_contact_from_list(client):
    created = client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"}).json()

    response = client.delete(f"/api/contacts/{created['id']}")

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert client.get("/api/contacts").json() == []


def test_create_contact_without_name_fails_with_client_error(client):
    response = client.post("/api/contacts", json={"email": None, "phone": "123", "company": "Acme", "notes": "hi"})

    assert 400 <= response.status_code < 500


def test_create_contact_with_empty_name_fails_with_client_error(client):
    response = client.post("/api/contacts", json={"name": "", "email": None, "phone": "123", "company": "Acme", "notes": "hi"})

    assert 400 <= response.status_code < 500


def test_create_contact_with_invalid_email_fails_with_client_error(client):
    response = client.post("/api/contacts", json={"name": "Alice", "email": "not-an-email", "phone": "123", "company": "Acme", "notes": "hi"})

    assert 400 <= response.status_code < 500


def test_update_contact_without_name_fails_with_client_error(client):
    created = client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"}).json()

    response = client.put(f"/api/contacts/{created['id']}", json={"email": None, "phone": "123", "company": "Acme", "notes": "hi"})

    assert 400 <= response.status_code < 500


def test_update_contact_with_empty_name_fails_with_client_error(client):
    created = client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"}).json()

    response = client.put(f"/api/contacts/{created['id']}", json={"name": "", "email": None, "phone": "123", "company": "Acme", "notes": "hi"})

    assert 400 <= response.status_code < 500


def test_update_contact_with_invalid_email_fails_with_client_error(client):
    created = client.post("/api/contacts", json={"name": "Alice", "email": None, "phone": "123", "company": "Acme", "notes": "hi"}).json()

    response = client.put(f"/api/contacts/{created['id']}", json={"name": "Alice", "email": "not-an-email", "phone": "123", "company": "Acme", "notes": "hi"})

    assert 400 <= response.status_code < 500
