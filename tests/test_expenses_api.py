from __future__ import annotations

from httpx import AsyncClient
import pytest


# AC-1: Creating an expense with a positive amount, valid category, note, and date persists the record and it appears in GET /api/expenses responses.
@pytest.mark.asyncio
async def test_post_expense_persists_and_appears_in_get_expenses(client: AsyncClient):
    payload = {
        "amount": 12.5,
        "category": "food",
        "note": "groceries",
        "date": "2026-06-18",
    }

    create_response = await client.post("/api/expenses", json=payload)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["amount"] == payload["amount"]
    assert created["category"] == payload["category"]
    assert created["note"] == payload["note"]
    assert created["date"] == payload["date"]
    assert isinstance(created["id"], int)

    list_response = await client.get("/api/expenses")

    assert list_response.status_code == 200
    expenses = list_response.json()
    assert isinstance(expenses, list)
    assert any(expense == created for expense in expenses)


# AC-2: Submitting an expense with amount less than or equal to 0 is rejected by the backend with a non-success response.
@pytest.mark.asyncio
@pytest.mark.parametrize("amount", [0, -1, -12.5])
async def test_post_expense_with_non_positive_amount_is_rejected(client: AsyncClient, amount: float):
    response = await client.post(
        "/api/expenses",
        json={
            "amount": amount,
            "category": "food",
            "note": "groceries",
            "date": "2026-06-18",
        },
    )

    assert response.status_code >= 400


# AC-3: GET /api/expenses returns a bare JSON array rather than an object wrapper.
@pytest.mark.asyncio
async def test_get_expenses_returns_bare_json_array(client: AsyncClient):
    response = await client.get("/api/expenses")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert response.headers["content-type"].startswith("application/json")


# AC-4: Editing an existing expense updates its persisted fields and the updated values are reflected in subsequent GET /api/expenses responses.
@pytest.mark.asyncio
async def test_put_expense_updates_persisted_fields(client: AsyncClient):
    create_response = await client.post(
        "/api/expenses",
        json={
            "amount": 10.0,
            "category": "shopping",
            "note": "shoes",
            "date": "2026-06-17",
        },
    )
    expense_id = create_response.json()["id"]

    update_payload = {
        "amount": 25.0,
        "category": "transport",
        "note": "taxi",
        "date": "2026-06-19",
    }
    update_response = await client.put(f"/api/expenses/{expense_id}", json=update_payload)

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == expense_id
    assert updated["amount"] == update_payload["amount"]
    assert updated["category"] == update_payload["category"]
    assert updated["note"] == update_payload["note"]
    assert updated["date"] == update_payload["date"]

    list_response = await client.get("/api/expenses")
    expenses = list_response.json()
    assert any(expense == updated for expense in expenses)


# AC-5: Deleting an existing expense removes it from persisted storage and it no longer appears in later GET /api/expenses results.
@pytest.mark.asyncio
async def test_delete_expense_removes_record_from_get_expenses(client: AsyncClient):
    create_response = await client.post(
        "/api/expenses",
        json={
            "amount": 7.5,
            "category": "food",
            "note": "snack",
            "date": "2026-06-18",
        },
    )
    expense_id = create_response.json()["id"]

    delete_response = await client.delete(f"/api/expenses/{expense_id}")

    assert delete_response.status_code == 200

    list_response = await client.get("/api/expenses")
    expenses = list_response.json()
    assert all(expense["id"] != expense_id for expense in expenses)


# AC-6: Invalid categories outside food|transport|shopping|other are rejected.
@pytest.mark.asyncio
@pytest.mark.parametrize("category", ["travel", "entertainment", "", "FOOD"])
async def test_post_expense_with_invalid_category_is_rejected(client: AsyncClient, category: str):
    response = await client.post(
        "/api/expenses",
        json={
            "amount": 12.5,
            "category": category,
            "note": "groceries",
            "date": "2026-06-18",
        },
    )

    assert response.status_code >= 400
