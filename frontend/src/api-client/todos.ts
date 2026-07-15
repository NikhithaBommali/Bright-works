const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type TodoCreate = {
  title: string;
};

type TodoUpdate = {
  completed: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function fetchTodos() {
  return request<Todo[]>('/api/todos');
}

export function createTodo(payload: TodoCreate) {
  return request<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTodo(id: string, payload: TodoUpdate) {
  return request<Todo>(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTodo(id: string) {
  return request<void>(`/api/todos/${id}`, {
    method: 'DELETE',
  });
}
