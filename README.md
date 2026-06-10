# Bright-works

TaskFlow is a small FastAPI + React/Vite app for managing tasks.

## Local setup

### Backend

Install Python dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend uses SQLite for local persistence. On startup, the app creates the database file at `taskflow.db` inside `BW_DATA_DIR` and initializes the `tasks` table if it does not already exist. If `BW_DATA_DIR` is not set, the default is `/app/data`.

### Frontend

Install Node dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

To preview a built frontend locally, run:

```bash
npm run build
npm run preview
```

## Frontend API configuration

The frontend API client uses:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
```

All requests go to `${API_BASE}/api/...`.

For local development against a separately running backend, set `VITE_API_BASE_URL` to the backend origin, for example:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

With that value set, the frontend calls `http://localhost:8000/api/...`.

If `VITE_API_BASE_URL` is not set, the empty-string fallback keeps requests relative, which supports preview deployments where `/api/...` is served from the same origin.
