# SpendLog (Bright-works)

Local-development-only FastAPI + React/Vite expense tracker.

**No Docker, deployment configuration, or authentication is required** to run this locally.

## Quick Start (single machine)

### 1) Start the FastAPI backend

Install backend dependencies:

```bash
cd backend
python -m pip install -r requirements.txt
```

Run the FastAPI app:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

SQLite persistence (local):

- The backend stores data in `spendlog.db`.
- The directory is controlled by `BW_DATA_DIR`.
- Default `BW_DATA_DIR`: `./data`.

See `backend/.env.example` for the default value.

### 2) Start the Vite frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run the Vite dev server:

```bash
npm run dev
```

### 3) Optional: set `VITE_API_BASE_URL`

The frontend resolves its API base URL from:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
```

It sends requests to `${API_BASE}/api/...`.

- If `VITE_API_BASE_URL` is **set** (recommended when backend and frontend are on different origins), requests go to `${VITE_API_BASE_URL}/api/...`.
- If it is **not set**, the frontend uses `""` and keeps requests relative (requests go to `/api/...` on the same origin).

Example (Linux/macOS):

```bash
# from the frontend/ directory
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Example (Windows PowerShell):

```powershell
$env:VITE_API_BASE_URL="http://localhost:8000"; npm run dev
```

## Run tests (backend)

From the repository root:

```bash
pytest -q
```
