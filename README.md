# Bright-works

TaskFlow is a full-stack app with a React + Vite + TypeScript frontend and a FastAPI + SQLite backend.

## Repository layout

- `backend/` — FastAPI app and SQLite persistence
- `frontend/` — Vite app and frontend source
- `main.py` / `requirements.txt` / `src/` — legacy root files kept in the repository; use the `backend/` and `frontend/` apps for local development

## Local development

Run the backend and frontend from their own directories.

### Backend

Requirements:

- Python 3
- `pip`

Install dependencies:

```bash
cd backend
pip install --no-cache-dir -r requirements.txt
```

Start the FastAPI app:

```bash
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

The API is available at `http://localhost:3000`.

### Frontend

Requirements:

- Node.js
- `npm`

Install dependencies:

```bash
cd frontend
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

The frontend runs on the Vite dev server, typically `http://localhost:5173`.

## Frontend API client configuration

The frontend API client is preview-safe and local-dev friendly. It defines:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
```

All task requests are built as:

```ts
`${API_BASE}/api/...`
```

With no `VITE_API_BASE_URL` set, the frontend uses relative `/api/...` paths and targets the same origin. In preview or any environment where the frontend and backend are hosted separately, set `VITE_API_BASE_URL` to the backend origin.

## API overview

TaskFlow exposes CRUD endpoints under `/api/tasks`:

- `GET /api/tasks` — returns a bare JSON array of task objects
- `POST /api/tasks` — creates a task from `title`, `description`, and `status`
- `GET /api/tasks/{id}` — returns one task by id
- `PUT /api/tasks/{id}` — updates an existing task
- `DELETE /api/tasks/{id}` — deletes an existing task

Task objects use the exact fields `id`, `title`, `description`, and `status`.

Allowed task status values are `todo`, `in-progress`, and `done`.

## SQLite persistence

The backend stores tasks in SQLite for local development. The database file is created in the app data directory as `taskflow.db` and is persisted across backend restarts as long as that file remains in place.

## Run the app

1. Start the backend from `backend/`.
2. Start the frontend from `frontend/`.
3. Open the Vite URL shown in the terminal.

The frontend uses the backend `/api/tasks` endpoints for listing, creating, updating, and deleting tasks.
