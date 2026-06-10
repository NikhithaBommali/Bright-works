# TaskFlow

TaskFlow is a small FastAPI + Vite app for managing tasks.

## Local setup

### Backend

Install the Python dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the FastAPI server from the project root:

```bash
uvicorn main:app --reload
```

The API is available at:

```text
http://127.0.0.1:8000/api/tasks
```

### Frontend

Install the frontend dependencies:

```bash
npm install
```

Configure the frontend API base URL before running the app. The client reads `VITE_API_BASE_URL` and builds requests as `${API_BASE}/api/...`.

Example `.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the Vite dev server:

```bash
npm run dev
```

To preview a production build locally, use the same `VITE_API_BASE_URL` value so preview requests still resolve through `${API_BASE}/api/...`.

```bash
npm run build
npm run preview
```

## API

The backend exposes task endpoints under `/api/tasks`.

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/{task_id}`
- `PUT /api/tasks/{task_id}`
- `DELETE /api/tasks/{task_id}`
