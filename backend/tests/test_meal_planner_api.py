# AC-1: GET /api/preferences returns HTTP 200 with default preference values on first load before any preferences have been saved
# AC-2: PUT /api/preferences saves valid preference values and a subsequent GET /api/preferences returns the saved values
# AC-3: POST /api/meals/generate-day returns a full day plan with Breakfast, Lunch, Snack, and Dinner meals, each matching the required meal schema exactly
# AC-6: POST /api/meals/suggest-alternative regenerates only the requested meal slot and leaves the other meals in that day's plan unchanged
# AC-7: GET /api/week/{date} returns a 7-day weekly plan structure for the requested date
# AC-8: GET /api/favorites lists favorites, POST /api/favorites saves a meal, and DELETE /api/favorites removes a previously saved favorite; GET /api/favorites is a bare JSON array
# AC-10: Missing OPENAI_API_KEY makes generation-related endpoints return HTTP 503 with a clear error and no canned fallback

from app.schemas.meal_planner import DEFAULT_PREFERENCES


def test_get_preferences_returns_default_values_on_first_load(client):
    response = client.get("/api/preferences")

    assert response.status_code == 200
    assert response.json() == DEFAULT_PREFERENCES.model_dump()


def test_put_preferences_persists_values_and_get_returns_saved_values(client):
    payload = {
        "number_of_kids": 3,
        "age_range": "7-9 years",
        "dietary_restriction": "Vegetarian",
        "foods_to_avoid": "mushrooms",
        "cuisine_preferences": ["Italian", "Mexican"],
    }

    put_response = client.put("/api/preferences", json=payload)

    assert put_response.status_code == 200
    assert put_response.json() == payload

    get_response = client.get("/api/preferences")

    assert get_response.status_code == 200
    assert get_response.json() == payload


def _assert_meal_shape(meal):
    assert set(meal.keys()) == {"name", "description", "ingredients", "prep_time_minutes", "difficulty"}
    assert isinstance(meal["name"], str)
    assert isinstance(meal["description"], str)
    assert isinstance(meal["ingredients"], list)
    assert isinstance(meal["prep_time_minutes"], int)
    assert meal["difficulty"] in {"Easy", "Medium"}


def test_generate_day_returns_full_day_plan_with_required_schema(client, monkeypatch):
    def fake_generate(*args, **kwargs):
        return {
            "date": "2026-01-01",
            "meals": {
                "breakfast": {
                    "name": "Berry Oat Bowl",
                    "description": "A sweet and creamy breakfast bowl kids can enjoy.",
                    "ingredients": ["oats", "berries"],
                    "prep_time_minutes": 10,
                    "difficulty": "Easy",
                },
                "lunch": {
                    "name": "Mini Pita Pockets",
                    "description": "Colorful pita pockets with simple fillings.",
                    "ingredients": ["pita", "hummus"],
                    "prep_time_minutes": 15,
                    "difficulty": "Easy",
                },
                "snack": {
                    "name": "Yogurt Parfait",
                    "description": "A crunchy, fruity snack with layers.",
                    "ingredients": ["yogurt", "granola"],
                    "prep_time_minutes": 5,
                    "difficulty": "Easy",
                },
                "dinner": {
                    "name": "Cheesy Pasta",
                    "description": "A warm dinner with familiar flavors.",
                    "ingredients": ["pasta", "cheese"],
                    "prep_time_minutes": 20,
                    "difficulty": "Medium",
                },
            },
        }

    monkeypatch.setattr("app.routers.meals.generate_day_plan_with_openai", fake_generate, raising=False)
    response = client.post(
        "/api/meals/generate-day",
        json={"date": "2026-01-01", "preferences": DEFAULT_PREFERENCES.model_dump()},
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"date", "meals"}
    assert body["date"] == "2026-01-01"
    assert set(body["meals"].keys()) == {"breakfast", "lunch", "snack", "dinner"}
    for meal in body["meals"].values():
        _assert_meal_shape(meal)


def test_suggest_alternative_updates_only_requested_slot(client, monkeypatch):
    baseline = client.post(
        "/api/meals/generate-day",
        json={"date": "2026-01-02", "preferences": DEFAULT_PREFERENCES.model_dump()},
    ).json()

    def fake_suggest(*args, **kwargs):
        return {
            "date": "2026-01-02",
            "meals": {
                **baseline["meals"],
                "lunch": {
                    "name": "Sunshine Wrap",
                    "description": "A brighter lunch option with kid-friendly ingredients.",
                    "ingredients": ["tortilla", "cheese"],
                    "prep_time_minutes": 12,
                    "difficulty": "Easy",
                },
            },
        }

    monkeypatch.setattr("app.routers.meals.suggest_alternative_with_openai", fake_suggest, raising=False)
    response = client.post(
        "/api/meals/suggest-alternative",
        json={
            "date": "2026-01-02",
            "slot": "lunch",
            "preferences": DEFAULT_PREFERENCES.model_dump(),
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["date"] == "2026-01-02"
    assert body["meals"]["lunch"]["name"] == "Sunshine Wrap"
    assert body["meals"]["breakfast"] == baseline["meals"]["breakfast"]
    assert body["meals"]["snack"] == baseline["meals"]["snack"]
    assert body["meals"]["dinner"] == baseline["meals"]["dinner"]


def test_get_week_returns_seven_day_structure(client):
    response = client.get("/api/week/2026-01-01")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"week_start", "days"}
    assert len(body["days"]) == 7
    for day in body["days"]:
        assert set(day.keys()) == {"date", "meals"}


def test_favorites_round_trip_with_bare_array_list_response(client):
    meal = {
        "name": "Berry Oat Bowl",
        "description": "A sweet and creamy breakfast bowl kids can enjoy.",
        "ingredients": ["oats", "berries"],
        "prep_time_minutes": 10,
        "difficulty": "Easy",
    }

    list_response = client.get("/api/favorites")
    assert list_response.status_code == 200
    assert list_response.json() == []

    created = client.post("/api/favorites", json={"meal": meal})
    assert created.status_code == 201
    created_body = created.json()
    assert set(created_body.keys()) == {"id", "meal"}
    assert created_body["meal"] == meal

    list_after_create = client.get("/api/favorites")
    assert list_after_create.status_code == 200
    assert list_after_create.json() == [created_body]

    deleted = client.delete("/api/favorites", json={"id": created_body["id"]})
    assert deleted.status_code == 200
    assert deleted.json() == {"id": created_body["id"], "deleted": True}

    assert client.get("/api/favorites").json() == []


def test_generation_endpoints_return_503_without_openai_api_key(client, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    response = client.post(
        "/api/meals/generate-day",
        json={"date": "2026-01-01", "preferences": DEFAULT_PREFERENCES.model_dump()},
    )

    assert response.status_code == 503
    assert "OPENAI_API_KEY" in response.json()["detail"].upper()
    assert "fallback" not in response.text.lower()
