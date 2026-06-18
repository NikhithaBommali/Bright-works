from __future__ import annotations

from httpx import AsyncClient
import pytest


# AC-1: Creating an expense with a positive amount, valid category, optional note, and date stores the record and makes it appear in GET /api/expenses results.
@pytest.mark.asyncio
async def test_post_expenses_with_valid_payload_succeeds_and_persists_in_get_results(client: AsyncClient):
    payload = {
        "amount": 12.5,
        "category": "food",
        "note": "Lunch",
        "date": "2026-06-18",
    }

    create_response = await client.post("/api/expenses", json=payload)

    assert create_response.status_code == 201
    created = create_response.json()
    assert set(created.keys()) == {"id", "amount", "category", "note", "date"}
    assert isinstance(created["id"], int)
    assert created["amount"] == payload["amount"]
    assert created["category"] == payload["category"]
    assert created["note"] == payload["note"]
    assert created["date"] == payload["date"]

    get_response = await client.get("/api/expenses")

    assert get_response.status_code == 200
    data = get_response.json()
    assert isinstance(data, list)
    assert data == [created]


# AC-2: Submitting amount <= 0 to POST /api/expenses is rejected by the backend with a client-error response.
@pytest.mark.asyncio
@pytest.mark.parametrize("amount", [0, -1])
async def test_post_expenses_with_non_positive_amount_returns_client_error(client: AsyncClient, amount: float):
    response = await client.post(
        "/api/expenses",
        json={
            "amount": amount,
            "category": "food",
            "note": "Lunch",
            "date": "2026-06-18",
        },
    )

    assert 400 <= response.status_code < 500


# AC-3: GET /api/expenses returns a bare JSON array of expense objects rather than a wrapped object.
@pytest.mark.asyncio
async def test_get_expenses_returns_bare_array_not_wrapped_object(client: AsyncClient):
    response = await client.get("/api/expenses")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# AC-1: User can create an expense with amount, category, note, and date, and the new expense appears in the expense list after a successful save.
@pytest.mark.asyncio
async def test_put_expense_updates_persisted_data(client: AsyncClient):
    create_response = await client.post(
        "/api/expenses",
        json={
            "amount": 10.0,
            "category": "shopping",
            "note": "Shoes",
            "date": "2026-06-18",
        },
    )
    expense_id = create_response.json()["id"]

    update_payload = {
        "amount": 25.0,
        "category": "other",
        "note": "Gift",
        "date": "2026-06-19",
    }
    response = await client.put(f"/api/expenses/{expense_id}", json=update_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == expense_id
    assert data["amount"] == update_payload["amount"]
    assert data["category"] == update_payload["category"]
    assert data["note"] == update_payload["note"]
    assert data["date"] == update_payload["date"]

    get_response = await client.get("/api/expenses")
    assert get_response.status_code == 200
    expenses = get_response.json()
    assert len(expenses) == 1
    assert expenses[0]["id"] == expense_id
    assert expenses[0]["amount"] == update_payload["amount"]
    assert expenses[0]["category"] == update_payload["category"]
    assert expenses[0]["note"] == update_payload["note"]
    assert expenses[0]["date"] == update_payload["date"]


# AC-1: User can delete an expense and it is removed from the list after deletion.
@pytest.mark.asyncio
async def test_delete_expense_removes_it_from_subsequent_get_results(client: AsyncClient):
    create_response = await client.post(
        "/api/expenses",
        json={
            "amount": 7.5,
            "category": "food",
            "note": "Snack",
            "date": "2026-06-18",
        },
    )
    expense_id = create_response.json()["id"]

    delete_response = await client.delete(f"/api/expenses/{expense_id}")

    assert delete_response.status_code == 200
    assert delete_response.json() == {"ok": True}

    get_response = await client.get("/api/expenses")
    assert get_response.status_code == 200
    assert get_response.json() == []
