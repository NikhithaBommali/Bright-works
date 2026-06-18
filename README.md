# Bright-works (Rolodex)

This repository is a strict monorepo for a fullstack Rolodex contact book:

- `frontend/` — React + Vite (TypeScript)
- `backend/` — FastAPI (Python) + SQLite

## Repo layout

```text
./
  frontend/   # React/Vite app
  backend/    # FastAPI app + SQLAlchemy models/routers
```

## Requirements

- Node.js (for the frontend)
- Python 3.10+ (for the backend)

## Local development (backend + frontend)

### 1) Backend (FastAPI)

#### Install

```bash
# from repo root
cd backend
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
```

(You can also use the manual steps below if you prefer.)

#### Install

```bash
# from repo root
cd backend
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
```

#### Configure SQLite

The backend uses `SQLITE_URL`.

```bash
# backend/.env.example
SQLITE_URL=sqlite:///./rolodex.db
```

Notes on SQLite persistence:
- The SQLite DB is stored in a local file path derived from `SQLITE_URL` (for the default, `./rolodex.db` relative to the backend working directory).
- The backend initializes the schema on startup using the configured SQLite engine.
- In environments where the filesystem is ephemeral (e.g., preview deployments), durability is best-effort: the DB file may be reset between runs.

#### Run

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend base URL (typical): `http://localhost:8000`

### 2) Frontend (React/Vite)

#### Install

```bash
cd frontend
npm install
```

#### Configure API base URL

Frontend API calls use `fetch(`${API_BASE}${path}`)`, where:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
```

Create `frontend/.env` (or set env var in your shell):

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

If you leave `VITE_API_BASE_URL` empty, API calls will be sent to the same origin as the frontend.

#### Run (dev server)

```bash
cd frontend
npm run dev
```

Then open the URL printed by Vite (typically `http://localhost:5173`).

#### Browser preview / local preview

You can build and preview the frontend:

```bash
cd frontend
npm run build
npm run preview
```

Make sure `VITE_API_BASE_URL` still points at the running backend (e.g., `http://localhost:8000`) for local preview.

## API: contacts

All endpoints are under the prefix `/api/contacts`.

The backend exposes CRUD endpoints and supports name search.

### GET /api/contacts

Returns a list of contacts.

**Query**:
- `search` (optional, string) — filters contacts by case-insensitive substring match on `name`.

**Auth**: none (public)

**Response** `200 OK`

The backend returns a bare JSON array (not an envelope):

```json
[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "phone": null,
    "company": "Acme",
    "notes": null
  }
]
```

**Errors**
- `422 Unprocessable Entity` — invalid query params (FastAPI validation)

### GET /api/contacts/{contact_id}

Returns a single contact by id.

**Auth**: none (public)

**Response** `200 OK`

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "phone": null,
  "company": "Acme",
  "notes": null
}
```

**Errors**
- `404 Not Found`

```json
{
  "detail": {
    "error": "contact_not_found",
    "message": "Contact not found"
  }
}
```

### POST /api/contacts

Creates a new contact.

**Auth**: none (public)

**Request body**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "phone": null,
  "company": "Acme",
  "notes": null
}
```

Validation enforced by the backend:
- `name` is required and must be non-empty
- `email` uses email format validation when provided (FastAPI/Pydantic `EmailStr`)

**Response** `201 Created`

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "phone": null,
  "company": "Acme",
  "notes": null
}
```

**Errors**
- `422 Unprocessable Entity` — validation errors (e.g., empty name, invalid email)

### PUT /api/contacts/{contact_id}

Updates an existing contact.

**Auth**: none (public)

**Request body**

```json
{
  "name": "Alice Updated",
  "email": null,
  "phone": "123-456-7890",
  "company": "Acme",
  "notes": "Met at conference"
}
```

**Response** `200 OK`

```json
{
  "id": 1,
  "name": "Alice Updated",
  "email": null,
  "phone": "123-456-7890",
  "company": "Acme",
  "notes": "Met at conference"
}
```

**Errors**
- `404 Not Found` — contact id does not exist (same `contact_not_found` payload as above)
- `422 Unprocessable Entity` — validation errors

### DELETE /api/contacts/{contact_id}

Deletes a contact.

**Auth**: none (public)

**Response** `200 OK`

```json
{
  "ok": true
}
```

**Errors**
- `404 Not Found` — contact id does not exist

## Notes for frontend integration

The frontend API client calls relative paths like `/api/contacts` and prefixes them with `VITE_API_BASE_URL` via:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
```

So you can choose either:
- Development: set `VITE_API_BASE_URL=http://localhost:8000`
- Same-origin: leave it empty
