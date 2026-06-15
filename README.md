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

It builds every request as:

```ts
`${API_BASE}/api/...`
```

Behavior for `VITE_API_BASE_URL`:

- Local development: leave it unset to send requests to the same origin as the frontend.
- Preview or a separate backend origin: set it to the backend base URL so requests resolve to that host.

## Persistence notes

- Local development uses SQLite.
- Preview persistence is best-effort only and may not survive container resets.

## Running TaskFlow

1. Start the backend from `backend/`.
2. Start the frontend from `frontend/`.
3. Open the Vite URL shown in the terminal.

The app uses the `/api/tasks` endpoints for listing, creating, updating, and deleting tasks.
