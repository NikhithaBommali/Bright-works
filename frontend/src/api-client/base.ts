const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ValidationDetail = {
  msg?: string;
  message?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const details: string[] = [];

    if (typeof data === 'object' && data !== null) {
      const detail = (data as { detail?: unknown }).detail;
      if (Array.isArray(detail)) {
        detail.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            const typedItem = item as ValidationDetail;
            if (typedItem.msg) details.push(typedItem.msg);
            else if (typedItem.message) details.push(typedItem.message);
          }
        });
      } else if (typeof detail === 'object' && detail !== null) {
        const typedDetail = detail as { message?: string; error?: string };
        if (typedDetail.message) details.push(typedDetail.message);
        else if (typedDetail.error) details.push(typedDetail.error);
      } else if (typeof detail === 'string') {
        details.push(detail);
      }
    }

    throw new ApiError(details[0] ?? 'Request failed', response.status, details);
  }

  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
}
