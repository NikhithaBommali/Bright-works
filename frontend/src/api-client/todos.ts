const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateTodoInput = {
  title: string;
};

export type UpdateTodoInput = {
  completed: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null && 'detail' in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === 'string') message = detail;
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function fetchTodos() {
  return request<Todo[]>('/api/todos');
}

export function createTodo(input: CreateTodoInput) {
  return request<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTodo(id: number, input: UpdateTodoInput) {
  return request<Todo>(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTodo(id: number) {
  return request<{ ok: true }>(`/api/todos/${id}`, {
    method: 'DELETE',
  });
}
