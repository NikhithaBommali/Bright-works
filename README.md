# Bright-works

TaskFlow is a full-stack app with a React + Vite + TypeScript frontend and a FastAPI backend with SQLite persistence.

## Repository layout

- `backend/` — FastAPI app, tests, and backend dependencies
- `frontend/` — React app, Vite config, and frontend dependencies

## Local setup

### Backend

Install dependencies from the backend directory:

```bash
cd backend
pip install --no-cache-dir -r requirements.txt
```

Start the API server from `backend/`:

```bash
uvicorn main:app --host 0.0.0.0 --port 3000
```

The backend uses SQLite for local persistence. By default it stores data in a local SQLite file, and it reads `DATABASE_URL` if you want to override the database location.

### Frontend

Install dependencies from the frontend directory:

```bash
cd frontend
npm install
```

Start the Vite dev server from `frontend/`:

```bash
npm run dev
```

The frontend runs on port `5173` in local development.

## Frontend API configuration

The frontend API client uses:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
```

Requests are built as `${API_BASE}/api/tasks` and related task URLs. When `VITE_API_BASE_URL` is unset, the frontend sends requests to the same origin as the Vite app. When it is set, the frontend sends requests to that base URL.

For local development, leave `VITE_API_BASE_URL` unset when the frontend and backend run on the same machine and you want the browser to reach the API through the Vite origin. Set it explicitly only when the backend is hosted on a different origin.

## Environment configuration

Backend local startup uses the example env file:

```bash
cp backend/.env.example backend/.env
```

`backend/.env.example` documents the local `DATABASE_URL` value and notes that no API key is required.

If you need to point the backend at a different SQLite file, set `DATABASE_URL` before starting `uvicorn`.

## Exercising the CRUD flow locally

1. Start the backend from `backend/`.
2. Start the frontend from `frontend/`.
3. Open the Vite URL shown in the terminal.
4. Create a task with a title, description, and status.
5. Confirm it appears in the task list.
6. Edit the task and save the changes.
7. Delete the task and confirm it is removed from the list.

The backend supports these task operations under `/api/tasks`:

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
