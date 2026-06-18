from __future__ import annotations

import pytest

from app.schemas.meals import Preferences


DEFAULT_PREFERENCES = {
    'numberOfKids': 1,
    'ageRange': '2-5',
    'dietaryRestrictions': ['none'],
    'foodsToAvoid': '',
    'cuisinePreferences': [],
}


def meal_fixture(slot: str, name: str, difficulty: str = 'Easy') -> dict:
    return {
        'slot': slot,
        'name': name,
        'description': f'{name} description',
        'ingredients': [f'{name.lower()} ingredient 1', f'{name.lower()} ingredient 2'],
        'prepTimeMinutes': 10,
        'difficulty': difficulty,
    }


# AC-1: GET /api/preferences returns default values when no preferences have been saved yet.
def test_get_preferences_empty_returns_default_body(client):
    response = client.get('/api/preferences')

    assert response.status_code == 200
    assert response.json() == DEFAULT_PREFERENCES


# AC-2: PUT /api/preferences saves valid preferences and GET returns the saved values.
def test_put_preferences_persists_and_get_returns_same_values(client):
    payload = {
        'numberOfKids': 3,
        'ageRange': '6-8',
        'dietaryRestrictions': ['vegetarian', 'gluten-free'],
        'foodsToAvoid': 'mushrooms',
        'cuisinePreferences': ['Italian', 'Mexican'],
    }

    put_response = client.put('/api/preferences', json=payload)
    get_response = client.get('/api/preferences')

    assert put_response.status_code == 200
    assert put_response.json() == payload
    assert get_response.status_code == 200
    assert get_response.json() == payload


# AC-3: POST /api/meals/generate-day returns a full day plan with exactly one of each meal slot.
def test_generate_day_returns_four_meals_and_required_fields(client, monkeypatch):
    plan = {
        'date': '2024-06-01',
        'meals': [
            meal_fixture('Breakfast', 'Sunny Oatmeal'),
            meal_fixture('Lunch', 'Rainbow Wrap'),
            meal_fixture('Snack', 'Apple Boats'),
            meal_fixture('Dinner', 'Mini Pasta', difficulty='Medium'),
        ],
    }
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setattr('app.routers.meals.generate_day', lambda date, preferences: type('Plan', (), {'model_dump': lambda self: plan})())

    response = client.post('/api/meals/generate-day', json={'date': '2024-06-01', 'preferences': Preferences().model_dump()})

    assert response.status_code == 200
    body = response.json()
    assert body == plan
    assert [meal['slot'] for meal in body['meals']] == ['Breakfast', 'Lunch', 'Snack', 'Dinner']
    for meal in body['meals']:
        assert set(meal) == {'slot', 'name', 'description', 'ingredients', 'prepTimeMinutes', 'difficulty'}
        assert isinstance(meal['ingredients'], list)


# AC-6: POST /api/meals/suggest-alternative changes only the requested slot.
def test_suggest_alternative_changes_only_requested_slot(client, monkeypatch):
    current_plan = {
        'date': '2024-06-01',
        'meals': [
            meal_fixture('Breakfast', 'Sunny Oatmeal'),
            meal_fixture('Lunch', 'Rainbow Wrap'),
            meal_fixture('Snack', 'Apple Boats'),
            meal_fixture('Dinner', 'Mini Pasta', difficulty='Medium'),
        ],
    }
    updated_meal = meal_fixture('Lunch', 'New Lunch')
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setattr('app.routers.meals.generate_meal', lambda date, slot, preferences: updated_meal)

    response = client.post(
        '/api/meals/suggest-alternative',
        json={
            'date': '2024-06-01',
            'slot': 'Lunch',
            'preferences': Preferences().model_dump(),
            'currentPlan': current_plan,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body['date'] == '2024-06-01'
    assert body['meals'][0] == current_plan['meals'][0]
    assert body['meals'][2] == current_plan['meals'][2]
    assert body['meals'][3] == current_plan['meals'][3]
    assert body['meals'][1] == updated_meal


# AC-8: Favorites endpoints work end-to-end.
def test_favorites_end_to_end_lists_adds_and_removes_meals(client):
    meal = meal_fixture('Breakfast', 'Blueberry Pancakes')

    empty_response = client.get('/api/favorites')
    add_response = client.post('/api/favorites', json={'meal': meal})
    list_response = client.get('/api/favorites')
    delete_response = client.delete('/api/favorites', json={'mealName': meal['name'], 'slot': meal['slot']})
    final_response = client.get('/api/favorites')

    assert empty_response.status_code == 200
    assert empty_response.json() == {'favorites': []}
    assert add_response.status_code == 200
    assert add_response.json() == {'favorites': [meal]}
    assert list_response.status_code == 200
    assert list_response.json() == {'favorites': [meal]}
    assert delete_response.status_code == 200
    assert delete_response.json() == {'favorites': []}
    assert final_response.status_code == 200
    assert final_response.json() == {'favorites': []}


# AC-14: Missing OPENAI_API_KEY returns 503 and no fallback meal data.
@pytest.mark.parametrize(
    'path,payload',
    [
        ('/api/meals/generate-day', {'date': '2024-06-01', 'preferences': Preferences().model_dump()}),
        (
            '/api/meals/suggest-alternative',
            {
                'date': '2024-06-01',
                'slot': 'Lunch',
                'preferences': Preferences().model_dump(),
                'currentPlan': {
                    'date': '2024-06-01',
                    'meals': [meal_fixture('Breakfast', 'Sunny Oatmeal'), meal_fixture('Lunch', 'Rainbow Wrap'), meal_fixture('Snack', 'Apple Boats'), meal_fixture('Dinner', 'Mini Pasta', difficulty='Medium')],
                },
            },
        ),
    ],
)
def test_generation_endpoints_without_openai_key_return_503_without_fallback(client, monkeypatch, path, payload):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)

    response = client.post(path, json=payload)

    assert response.status_code == 503
    assert response.json() == {'detail': 'OPENAI_API_KEY is not configured on the backend'}
