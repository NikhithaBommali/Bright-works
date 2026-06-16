from __future__ import annotations

import pytest

from app.persistence import FAVORITES_FILE, PREFERENCES_FILE, PLANS_FILE, save_json
from app.schemas.preferences import Preference


# AC-1: GET /api/preferences returns default values before anything is saved.
def test_get_preferences_first_load_returns_defaults(client):
    response = client.get('/api/preferences')

    assert response.status_code == 200
    assert response.json() == {
        'numberOfKids': 1,
        'ageRange': '2-5',
        'dietaryRestrictions': [],
        'foodsToAvoid': '',
        'cuisinePreferences': [],
    }


# AC-2: PUT /api/preferences persists and GET returns the saved values.
def test_put_preferences_persists_and_get_returns_saved_values(client):
    payload = {
        'numberOfKids': 3,
        'ageRange': '5-8',
        'dietaryRestrictions': ['vegetarian'],
        'foodsToAvoid': 'mushrooms',
        'cuisinePreferences': ['Italian', 'Mexican'],
    }

    put_response = client.put('/api/preferences', json=payload)
    get_response = client.get('/api/preferences')

    assert put_response.status_code == 200
    assert put_response.json() == payload
    assert get_response.status_code == 200
    assert get_response.json() == payload


# AC-3: POST /api/meals/generate-day returns a normalized 4-meal day plan.
def test_generate_day_returns_full_day_plan_with_required_meal_fields(client, monkeypatch):
    class DummyCompletions:
        def __init__(self):
            self.calls = []

        def create(self, **kwargs):
            self.calls.append(kwargs)
            return type(
                'Resp',
                (),
                {
                    'choices': [
                        type(
                            'Choice',
                            (),
                            {
                                'message': type(
                                    'Msg',
                                    (),
                                    {
                                        'content': '{"date":"2000-01-01","meals":[{"id":"m1","slot":"Breakfast","name":"Sunny Oatmeal","description":"Warm and fruity breakfast.","ingredients":["oats","berries"],"prepTimeMinutes":5,"difficulty":"Easy"},{"id":"m2","slot":"Lunch","name":"Rainbow Wrap","description":"Colorful and filling lunch.","ingredients":["tortilla","veggies"],"prepTimeMinutes":10,"difficulty":"Easy"},{"id":"m3","slot":"Snack","name":"Apple Boats","description":"Crisp and sweet snack.","ingredients":["apple","sunflower butter"],"prepTimeMinutes":4,"difficulty":"Easy"},{"id":"m4","slot":"Dinner","name":"Mini Pasta","description":"Cozy kid-friendly dinner.","ingredients":["pasta","sauce"],"prepTimeMinutes":15,"difficulty":"Medium"}]}',
                                    },
                                )
                            },
                        )
                    ]
                },
            )

    dummy = DummyCompletions()

    class DummyClient:
        def __init__(self):
            self.chat = type('Chat', (), {'completions': dummy})()

    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setattr('app.openai_service._openai_client', lambda: DummyClient())

    response = client.post('/api/meals/generate-day', json={'date': '2024-06-01', 'preferences': Preference().model_dump()})

    assert response.status_code == 200
    data = response.json()
    assert data['date'] == '2024-06-01'
    assert set(data['meals']) == {'breakfast', 'lunch', 'snack', 'dinner'}
    for meal in data['meals'].values():
        assert set(meal) == {'name', 'description', 'ingredients', 'prepTimeMinutes', 'difficulty'}


# AC-6: POST /api/meals/suggest-alternative changes only the requested slot.
def test_suggest_alternative_updates_only_requested_slot(client, monkeypatch):
    day = {
        'date': '2024-06-01',
        'meals': {
            'breakfast': {'name': 'B', 'description': 'b', 'ingredients': ['b'], 'prepTimeMinutes': 5, 'difficulty': 'Easy'},
            'lunch': {'name': 'L', 'description': 'l', 'ingredients': ['l'], 'prepTimeMinutes': 10, 'difficulty': 'Easy'},
            'snack': {'name': 'S', 'description': 's', 'ingredients': ['s'], 'prepTimeMinutes': 3, 'difficulty': 'Easy'},
            'dinner': {'name': 'D', 'description': 'd', 'ingredients': ['d'], 'prepTimeMinutes': 20, 'difficulty': 'Medium'},
        },
    }
    save_json(PLANS_FILE, {'2024-06-01': day})

    class DummyCompletions:
        def create(self, **kwargs):
            return type(
                'Resp',
                (),
                {
                    'choices': [
                        type('Choice', (), {'message': type('Msg', (), {'content': '{"id":"new-l","name":"New Lunch","description":"new","ingredients":["x"],"prepTimeMinutes":12,"difficulty":"Easy"}'})()})
                    ]
                },
            )

    class DummyClient:
        def __init__(self):
            self.chat = type('Chat', (), {'completions': DummyCompletions()})()

    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setattr('app.openai_service._openai_client', lambda: DummyClient())
    save_json(PLANS_FILE, {'2024-06-01': day})

    response = client.post('/api/meals/suggest-alternative', json={'date': '2024-06-01', 'slot': 'lunch', 'preferences': Preference().model_dump()})

    assert response.status_code == 200
    data = response.json()
    assert data['date'] == '2024-06-01'
    assert data['slot'] == 'lunch'
    assert data['meal']['name'] == 'New Lunch'
    assert data['meals']['breakfast'] == day['meals']['breakfast']
    assert data['meals']['snack'] == day['meals']['snack']
    assert data['meals']['dinner'] == day['meals']['dinner']
    assert data['meals']['lunch']['name'] == 'New Lunch'


# AC-8: Favorites endpoints work end-to-end.
def test_favorites_end_to_end_lists_adds_and_removes_meals(client):
    meal = {
        'name': 'Blueberry Pancakes',
        'description': 'Fluffy and fun.',
        'ingredients': ['flour', 'blueberries'],
        'prepTimeMinutes': 15,
        'difficulty': 'Easy',
    }

    empty = client.get('/api/favorites')
    added = client.post('/api/favorites', json={'meal': meal})
    favorite_id = added.json()['favorite']['id']
    listed = client.get('/api/favorites')
    deleted = client.delete('/api/favorites', json={'id': favorite_id})
    final_list = client.get('/api/favorites')

    assert empty.status_code == 200
    assert empty.json() == {'favorites': []}
    assert added.status_code == 200
    assert added.json()['favorite']['name'] == 'Blueberry Pancakes'
    assert listed.status_code == 200
    assert listed.json()['favorites'][0]['name'] == 'Blueberry Pancakes'
    assert deleted.status_code == 200
    assert deleted.json() == {'deleted': True, 'id': favorite_id}
    assert final_list.status_code == 200
    assert final_list.json() == {'favorites': []}


# AC-14: Missing OPENAI_API_KEY returns 503 and no fallback meal data.
@pytest.mark.parametrize('path,payload', [
    ('/api/meals/generate-day', {'date': '2024-06-01', 'preferences': Preference().model_dump()}),
    ('/api/meals/suggest-alternative', {'date': '2024-06-01', 'slot': 'lunch', 'preferences': Preference().model_dump()}),
])
def test_generation_endpoints_without_openai_key_return_503_without_fallback(client, path, payload, monkeypatch):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)

    response = client.post(path, json=payload)

    assert response.status_code == 503
    assert isinstance(response.json()['detail'], str)
    assert 'canned' not in response.text.lower()
