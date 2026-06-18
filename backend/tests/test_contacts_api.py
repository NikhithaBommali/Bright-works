# AC-1: User can create a contact with a required name and optional email, phone, company, and notes, and the new contact persists in the list after refresh
# AC-2: Submitting a contact with an invalid email is rejected with a clear validation error
# AC-7: The backend exposes /api/contacts CRUD endpoints that return appropriate success and not-found responses for create, read, update, delete, and list operations

from app.models.contact import Contact


def test_create_contact_persists_optional_fields_and_returns_created_contact(client, db_session):
    payload = {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "phone": "555-0101",
        "company": "Analytical Engines",
        "notes": "Important contact",
    }

    response = client.post("/api/contacts", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body == {"id": 1, **payload}
    assert db_session.query(Contact).count() == 1


def test_create_contact_without_optional_fields_returns_nulls(client):
    response = client.post("/api/contacts", json={"name": "Grace Hopper"})

    assert response.status_code == 201
    assert response.json()["email"] is None
    assert response.json()["phone"] is None
    assert response.json()["company"] is None
    assert response.json()["notes"] is None


def test_create_contact_with_invalid_email_returns_clear_validation_error(client):
    response = client.post("/api/contacts", json={"name": "Bad Email", "email": "not-an-email"})

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("value is not a valid email address" in err["msg"].lower() for err in errors)


def test_list_contacts_returns_bare_array_with_expected_fields(client):
    response = client.get("/api/contacts")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert set(body[0].keys()) == {"id", "name", "email", "phone", "company", "notes"}


def test_list_contacts_search_filters_case_insensitive_substring_on_name(client):
    client.post("/api/contacts", json={"name": "Ada Lovelace", "email": None, "phone": None, "company": None, "notes": None})
    client.post("/api/contacts", json={"name": "Grace Hopper", "email": None, "phone": None, "company": None, "notes": None})

    response = client.get("/api/contacts", params={"search": "lov"})

    assert response.status_code == 200
    assert [item["name"] for item in response.json()] == ["Ada Lovelace"]


def test_get_contact_returns_contact_by_id(client):
    created = client.post("/api/contacts", json={"name": "Ada Lovelace", "email": None, "phone": None, "company": None, "notes": None}).json()

    response = client.get(f"/api/contacts/{created['id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_get_missing_contact_returns_404(client):
    response = client.get("/api/contacts/999")

    assert response.status_code == 404
    assert response.json()["detail"]["error"] == "contact_not_found"


def test_update_contact_returns_updated_contact(client):
    created = client.post("/api/contacts", json={"name": "Ada Lovelace", "email": None, "phone": None, "company": None, "notes": None}).json()
    update_payload = {"name": "Ada Byron", "email": "ada.byron@example.com", "phone": "555-0199", "company": "Babbage Co.", "notes": "Updated"}

    response = client.put(f"/api/contacts/{created['id']}", json=update_payload)

    assert response.status_code == 200
    assert response.json() == {"id": created["id"], **update_payload}


def test_update_missing_contact_returns_404(client):
    response = client.put("/api/contacts/999", json={"name": "Ada Byron", "email": None, "phone": None, "company": None, "notes": None})

    assert response.status_code == 404


def test_delete_contact_returns_204_and_removes_contact(client):
    created = client.post("/api/contacts", json={"name": "Ada Lovelace", "email": None, "phone": None, "company": None, "notes": None}).json()

    response = client.delete(f"/api/contacts/{created['id']}")

    assert response.status_code == 204
    assert client.get(f"/api/contacts/{created['id']}").status_code == 404


def test_delete_missing_contact_returns_404(client):
    response = client.delete("/api/contacts/999")

    assert response.status_code == 404
