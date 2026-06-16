# Bright-works


Fullstack Kids Daily Meal Planner (React + FastAPI) using a strict monorepo layout.

## Repo layout (required)
- `frontend/` — React (Vite) app
- `backend/` — FastAPI app serving the `/api/*` routes

## Prerequisites
- Node.js (for `frontend/`)
- Python 3.10+ (for `backend/`)

## Environment variables
The backend requires:
- `OPENAI_API_KEY` — OpenAI key used for meal generation (required for `/api/meals/*` generation endpoints).

See:
- `backend/.env.example`

Example:
```env
OPENAI_API_KEY=your-key-here
```

## Local development
### Start backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Start frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

### Preview wiring expectation
- The frontend calls backend functionality using **relative** `'/api/*'` URLs only.
- Run frontend + backend together so browser requests to `'/api/*'` reach the FastAPI server.

## Dev entrypoints (exact)
- **Backend**: `backend/main.py` (FastAPI app)
- **Frontend**: `frontend/src/main.tsx` (React mount) and `frontend/src/App.tsx` (top-level app)

## Backend generation + persistence expectations
### Model used for generation
- The backend uses **`gpt-4o-mini`** for meal generation.

### File-based persistence
The backend persists planner state to files (not a database) for:
- preferences
- plans/week data
- favorites

## Key preview expectations (important)
- **No static meal catalog fallback**: there is no hardcoded meal list the UI can display when generation fails.
- If `OPENAI_API_KEY` is **missing** on the backend, meal generation endpoints return **HTTP 503**, and the backend does **not** fall back to canned meals.

## Endpoints used by the frontend
The frontend depends on these backend routes under `/api`:
- `GET /api/preferences`
- `PUT /api/preferences`
- `POST /api/meals/generate-day`
- `POST /api/meals/suggest-alternative`
- `GET /api/week/{date}`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites`

## Tests
From repo root:
```bash
pytest -q
```

