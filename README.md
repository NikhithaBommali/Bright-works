# Bright-works


Fullstack Kids Daily Meal Planner (React + FastAPI) using a strict monorepo layout.

## Repository structure
- `frontend/` — React (Vite) app
- `backend/` — FastAPI app exposing the `/api/*` routes

## Prerequisites
- Node.js (for `frontend/`)
- Python 3.10+ (for `backend/`)

## Environment variables
The browser preview does **not** use `OPENAI_API_KEY`.

All OpenAI configuration is provided to the **backend only**:
- `OPENAI_API_KEY` — OpenAI key used for meal generation (required for `/api/meals/*` endpoints)

See:
- `backend/.env.example`

## Local development
Open two terminals.

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# set OPENAI_API_KEY (e.g. from backend/.env.example)
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### Runtime wiring
- The frontend calls the backend using **relative** `'/api/*'` URLs.
- Run both processes together so browser requests to `'/api/*'` reach FastAPI.

## Dev entrypoints (exact)
- **Backend**: `backend/main.py` (FastAPI app)
- **Frontend**: `frontend/src/main.tsx` (React mount) and `frontend/src/App.tsx` (top-level app)

## Planner features (high level)
- Preferences panel: number of kids, age range, dietary restrictions, foods to avoid, and cuisine preferences.
- Daily plan: generate today’s meals and show Breakfast, Lunch, Snack, and Dinner.
- Weekly view: a 7-day picker where selecting a day displays that day’s meal plan.
- Per-slot regeneration: “Suggest alternative” regenerates only one slot (e.g., lunch) without changing the other meals.
- Favorites: save meals, list them, and remove saved favorites for reuse.

## Meal generation behavior (important)
- Meal suggestions are generated at request time by the backend using **`gpt-4o-mini`**.
- There is **no hardcoded meal catalog fallback** in the app.
- If `OPENAI_API_KEY` is missing on the backend, meal generation endpoints return **HTTP 503** with a clear error and do not return canned meals.

## API (backend routes used by the frontend)
The frontend calls these endpoints under `/api`:
- `GET /api/preferences`
- `PUT /api/preferences`
- `POST /api/meals/generate-day`
- `POST /api/meals/suggest-alternative`
- `GET /api/week/{date}`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites`

### Endpoint contracts (brief)
- `GET /api/preferences` returns `{ numberOfKids, ageRange, dietaryRestrictions, foodsToAvoid, cuisinePreferences }`.
- `PUT /api/preferences` saves and returns the same preference shape.
- `POST /api/meals/generate-day` takes `{ date, preferences }` and returns `{ date, meals: { breakfast, lunch, snack, dinner } }`.
- `POST /api/meals/suggest-alternative` takes `{ date, slot, preferences }` and returns `{ date, slot, meal, meals }` (updates only the requested slot).
- `GET /api/week/{date}` returns `{ selectedDate, days }` where `days` contains 7 items.
- `GET /api/favorites` returns `{ favorites: [...] }`.
- `POST /api/favorites` saves and returns `{ favorite }`.
- `DELETE /api/favorites` removes by `id` and returns `{ deleted, id }`.

## Tests
From repo root:
```bash
pytest -q
```

