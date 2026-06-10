# Bright-works

TaskFlow is a full-stack app with a React + Vite + TypeScript frontend and a FastAPI + SQLite backend.

## Repository layout

- `main.py` — FastAPI backend with SQLite persistence
- `requirements.txt` — Python dependencies for the backend
- `src/` — React frontend source
- `package.json` — frontend scripts and dependencies

## Local setup

### Backend

Install the Python dependencies:

```bash
pip install --no-cache-dir -r requirements.txt
```

Run the API server:

```bash
uvicorn main:app --host 0.0.0.0 --port 3000
```

The backend creates its SQLite database at `taskflow.db` under the data directory used by the app.

### Frontend

Install the frontend dependencies:

```bash
npm install
```

Run the Vite dev server:

```bash
npm run dev
```

The frontend dev server runs on port `5173`.

## Frontend environment configuration

Set `VITE_API_BASE_URL` in the frontend environment when the UI should target a backend origin other than the Vite dev server origin. The frontend API client reads:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
```

Requests are built as:

```ts
`${API_BASE}/api/...`
```

If `VITE_API_BASE_URL` is not set, the frontend sends requests to the same origin.

## Running the app

1. Start the backend.
2. Start the frontend.
3. Open the frontend URL shown by Vite.

The frontend uses the backend `/api/tasks` endpoints for listing, creating, updating, and deleting tasks.
