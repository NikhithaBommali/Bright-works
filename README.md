# Bright-works (Rolodex)

This repository is a strict monorepo for a fullstack Rolodex contact book plus a small React/Vite + FastAPI todo backend used for CRUD testing.

- `frontend/` — React + Vite (TypeScript)
- `backend/` — FastAPI (Python)

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

This monorepo includes the kids daily meal planner app (React frontend + FastAPI backend) in addition to the Rolodex contacts app.

The frontend calls backend endpoints using relative `/api/*` requests (see `frontend/src/api-client/*`).

The backend also exposes a todo CRUD API (`/api/todos`) backed by `DATABASE_URL`.

## Root env vars

- Backend required: `DATABASE_URL`
- Frontend optional: `VITE_API_BASE_URL`

### 1) Backend (FastAPI)

#### Install

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
```

#### Configure `DATABASE_URL`

The backend uses `DATABASE_URL` (see `backend/.env.example`).

For example:

```bash
DATABASE_URL=postgresql://localhost/brightworks
```

For local SQLite-based development (as in the existing example):

```bash
DATABASE_URL=sqlite:///./rolodex.db
```

It also requires `OPENAI_API_KEY` to generate meal plans (no canned fallback). See `backend/.env.example` below.

```bash
# backend/.env.example
DATABASE_URL=sqlite:///./rolodex.db
OPENAI_API_KEY=your-key-here
```

> For the todo CRUD API, the backend persists data using `DATABASE_URL`.

Notes on SQLite persistence:
- The database file is created/used at the path implied by `DATABASE_URL` (by default `backend/rolodex.db`).
- On startup, the backend initializes the schema with `Base.metadata.create_all(bind=engine)`.
- In environments where filesystem persistence is ephemeral (e.g., some preview/browser preview setups), the database may reset between runs; this is best-effort persistence.

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

## API: kids daily meal planner

Meal planner endpoints are served under `/api/` by the FastAPI backend.

> Frontend integration note: the React app uses relative requests like `/api/preferences`, `/api/meals/generate-day`, and `/api/week/{date}` (prefixed by `VITE_API_BASE_URL`).

### GET /api/preferences

Returns the current kid meal preferences.

**Auth**: none (public)

**Response** `200 OK`

```json
{
  "number_of_kids": 1,
  "age_range": "6-8",
  "dietary_restriction": "none",
  "foods_to_avoid": "",
  "cuisine_preferences": []
}
```

### PUT /api/preferences

Saves kid meal preferences.

**Auth**: none (public)

**Request body**

```json
{
  "number_of_kids": 2,
  "age_range": "6-8",
  "dietary_restriction": "vegetarian",
  "foods_to_avoid": "mushrooms, olives",
  "cuisine_preferences": ["Italian"]
}
```

**Response** `200 OK`

```json
{
  "number_of_kids": 2,
  "age_range": "6-8",
  "dietary_restriction": "vegetarian",
  "foods_to_avoid": "mushrooms, olives",
  "cuisine_preferences": ["Italian"]
}
```

### POST /api/meals/generate-day

Generates a complete meal plan for a day (Breakfast, Lunch, Snack, Dinner).

**Auth**: none (public)

**Request body**

```json
{
  "date": "2026-06-18",
  "preferences": {
    "number_of_kids": 2,
    "age_range": "6-8",
    "dietary_restriction": "vegetarian",
    "foods_to_avoid": "mushrooms",
    "cuisine_preferences": ["Italian"]
  }
}
```

**Response** `200 OK`

```json
{
  "date": "2026-06-18",
  "meals": {
    "breakfast": {
      "name": "string",
      "description": "string",
      "ingredients": ["string"],
      "prep_time_minutes": 10,
      "difficulty": "Easy"
    },
    "lunch": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
    "snack": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
    "dinner": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"}
  }
}
```

**Errors**
- `503 Service Unavailable` — when `OPENAI_API_KEY` is missing


### POST /api/meals/suggest-alternative

Regenerates only one meal slot inside a previously stored day plan.

**Auth**: none (public)

**Request body**

```json
{
  "date": "2026-06-18",
  "slot": "lunch",
  "preferences": {
    "number_of_kids": 2,
    "age_range": "6-8",
    "dietary_restriction": "vegetarian",
    "foods_to_avoid": "mushrooms",
    "cuisine_preferences": ["Italian"]
  }
}
```

**Response** `200 OK`

```json
{
  "date": "2026-06-18",
  "meals": {
    "breakfast": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
    "lunch": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
    "snack": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"},
    "dinner": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"}
  }
}
```

**Errors**
- `503 Service Unavailable` — when `OPENAI_API_KEY` is missing
- `404 Not Found` — no stored plan exists for the requested date

### GET /api/week/{date}

Returns a 7-day structure for the week containing `date`. Each day includes meals or `null` if no plan has been generated yet.

**Auth**: none (public)

**Response** `200 OK`

```json
{
  "week_start": "2026-06-15",
  "days": [
    {"date": "2026-06-15", "meals": null},
    {"date": "2026-06-16", "meals": null},
    {"date": "2026-06-17", "meals": null},
    {"date": "2026-06-18", "meals": {"breakfast": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"}, "lunch": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"}, "snack": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"}, "dinner": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"}},
    {"date": "2026-06-19", "meals": null},
    {"date": "2026-06-20", "meals": null},
    {"date": "2026-06-21", "meals": null}
  ]
}
```

### Favorites

Favorites let you save meals for later reuse.

#### GET /api/favorites

**Auth**: none (public)

**Response** `200 OK`

```json
[
  {
    "id": "string",
    "meal": {
      "name": "string",
      "description": "string",
      "ingredients": ["string"],
      "prep_time_minutes": 10,
      "difficulty": "Easy"
    }
  }
]
```

#### POST /api/favorites

**Auth**: none (public)

**Request body**

```json
{ "meal": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"} }
```

**Response** `200 OK`

```json
{ "id": "string", "meal": {"name": "string", "description": "string", "ingredients": ["string"], "prep_time_minutes": 10, "difficulty": "Easy"} }
```

#### DELETE /api/favorites

**Auth**: none (public)

**Request body**

```json
{ "id": "string" }
```

**Response** `200 OK`

```json
{ "id": "string", "deleted": true }
```

## API: contacts

All endpoints are under the prefix `/api/contacts`.

The backend exposes CRUD endpoints and supports name search.

### GET /api/contacts

Returns a list of contacts.

**Query**:
- `search` (optional, string) — filters contacts by case-insensitive substring match on `name`.

**Auth**: none (public)

**Response** `200 OK`

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

**Response** `204 No Content`

No response body.

**Errors**
- `404 Not Found` — contact id does not exist

## Quality checks (CI)

### Quality commands

**Backend**
- Lint: `flake8` (configured by `backend/pyproject.toml`)
- Tests: `pytest` (from `backend/`)

**Frontend**
- Lint: `npm run lint` (from `frontend/`)
- Tests: `npm test` (from `frontend/`)

### GitHub Actions workflow

This repo is expected to have a workflow at:

- `.github/workflows/ci.yml`

That workflow should run lint + tests on every `push` and `pull_request`.

**Contributor expectation:** CI must pass for both lint and tests before merging.

## Kids daily meal planner UI flows

### Key flows

### Run / preview steps

- Start the backend (FastAPI) from `backend/` (see **Local development** above) with `OPENAI_API_KEY` set.
- Start the frontend from `frontend/`:

```bash
cd frontend
npm run dev
```

The frontend makes relative `/api/*` requests to the backend (it does not embed meal data locally).

The meal planner page supports these flows:

- **Preferences**: edit kid settings (number of kids, age range, dietary restriction, foods to avoid, cuisine preferences) and save them via `/api/preferences`.
- **Generate day**: click **“Generate today’s plan”** to call `/api/meals/generate-day` and render Breakfast/Lunch/Snack/Dinner meal cards.
- **Suggest alternative**: each meal card has **“Suggest alternative”** that calls `/api/meals/suggest-alternative` and updates only the selected slot.
- **Weekly view**: a 7-day calendar uses `/api/week/{date}`; selecting a day shows that day’s stored plan (or empty if not generated).
- **Favorites**: save a meal via `POST /api/favorites`, list via `GET /api/favorites`, and remove via `DELETE /api/favorites`.

If `OPENAI_API_KEY` is missing, generation endpoints return `503` with a clear error and **do not fall back to canned meals**.

## API: contacts

The frontend API client calls relative paths like `/api/contacts` and prefixes them with `VITE_API_BASE_URL` via:

For the kids meal planner, the same relative `/api/*` pattern is used (e.g., `/api/preferences`, `/api/meals/generate-day`, `/api/week/{date}`, and `/api/favorites`).

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
```

So you can choose either:
- Development: set `VITE_API_BASE_URL=http://localhost:8000`
- Same-origin: leave it empty
