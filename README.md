# Bright-works


Fullstack Kids Daily Meal Planner (React + FastAPI) using a strict monorepo layout.

## Repository structure
- `frontend/` — React (Vite) app
- `backend/` — FastAPI app exposing the `/api/*` routes

## Prerequisites
- Node.js (for `frontend/`)
- Python 3.10+ (for `backend/`)

## Environment variables
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

# set OPENAI_API_KEY (see backend/.env.example)
export OPENAI_API_KEY="your-key-here"
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### Runtime wiring
- The frontend calls the backend using relative `'/api/*'` URLs.
- Start **both** the frontend (Vite dev server) and backend (FastAPI) so browser requests to `'/api/*'` reach FastAPI (typically via Vite proxy / matching host setup).

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
- There is **no static meal catalog fallback** in the app—meal/plan data comes only from backend `/api/*` routes.
- If `OPENAI_API_KEY` is missing on the backend, the generation endpoints return **HTTP 503** with a clear error and do not return canned meals.

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
- `POST /api/meals/generate-day` takes `{ date, preferences }` and returns `{ date, meals: { Breakfast, Lunch, Snack, Dinner } }`.
- `POST /api/meals/suggest-alternative` takes `{ date, slot, preferences, currentPlan }` and returns an updated `{ date, meals: { Breakfast, Lunch, Snack, Dinner } }` while preserving the other slots.
- `GET /api/week/{date}` returns `{ selectedDate, days }` where `days` contains 7 items.
- `GET /api/favorites` returns `{ favorites: [...] }`.
- `POST /api/favorites` saves and returns `{ favorites: [...] }`.
- `DELETE /api/favorites` removes a favorite and returns `{ favorites: [...] }`.

## Preview-session persistence
This app uses backend persistence to keep preferences, generated plans, and favorites across interactions **within the preview/session**. If the preview environment/container is restarted, you should expect persistence to reset (best-effort retention).

## Tests
From repo root:
```bash
pytest -q
```

