# Bright-works

TaskFlow is a full-stack app with a React + Vite + TypeScript frontend and a FastAPI backend with SQLite persistence.

## Repository layout

- `backend/` — FastAPI app, tests, and backend dependencies
- `frontend/` — React app, Vite config, and frontend dependencies

## TaskFlow

### Backend local run

From `backend/`:

```bash
cd backend
cp .env.example .env
pip install --no-cache-dir -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3000
```

The backend runs on port `3000` and uses SQLite persistence. `backend/.env.example` documents the local `DATABASE_URL` value; adjust it if you want to point at a different SQLite file.

### Frontend local run

From `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on port `5173`.

### Frontend API base URL

The frontend API client reads:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
```

Task requests are sent to `${API_BASE}/api/...` paths. With `VITE_API_BASE_URL` unset, the app uses the same origin as the Vite dev server. Set `VITE_API_BASE_URL` when the backend is served from a different origin.

### Local CRUD flow

1. Start the backend from `backend/`.
2. Start the frontend from `frontend/`.
3. Open the Vite URL shown in the terminal.
4. Create, edit, and delete tasks from the TaskFlow UI.

The backend exposes task CRUD under `/api/tasks`:

- `GET /api/tasks` returns a bare JSON array of tasks.
- `POST /api/tasks` creates a task.
- `GET /api/tasks/{id}` returns one task or `404`.
- `PUT /api/tasks/{id}` updates one task or `404`.
- `DELETE /api/tasks/{id}` deletes one task and returns `204`.

Accepted task status values are `todo`, `in-progress`, and `done`.

## Reviewer checklist

- Files changed: `README.md`
- How to run tests: backend tests were run with `cd backend && pytest tests/test_tasks_api.py -q`
- Manual checks to verify: frontend starts, backend starts, the frontend reaches the API using `VITE_API_BASE_URL` when set or same-origin when unset, and the CRUD flow works end to end for create, edit, and delete.

## Persistence notes

- Local development uses SQLite.
- Preview persistence is best-effort only and may not survive container resets.

## Running TaskFlow

1. Start the backend from `backend/`.
2. Start the frontend from `frontend/`.
3. Open the Vite URL shown in the terminal.

The app uses the `/api/tasks` endpoints for listing, creating, updating, and deleting tasks.
