export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
};

export type TaskPayload = {
  title: string;
  description: string;
  status: TaskStatus;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/api/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let message = 'Request failed.';
    try {
      const data = (await response.json()) as { detail?: string | Array<{ msg?: string }> };
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        message = data.detail[0].msg;
      }
    } catch {
      message = response.status === 404 ? 'The requested task could not be found.' : 'Unable to reach TaskFlow right now.';
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function fetchTasks(): Promise<Task[]> {
  return request<Task[]>('tasks');
}

export function createTask(payload: TaskPayload): Promise<Task> {
  return request<Task>('tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTask(id: number, payload: TaskPayload): Promise<Task> {
  return request<Task>(`tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`tasks/${id}`, {
    method: 'DELETE'
  });
}
