const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type Contact = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
};

export type ContactPayload = {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
};

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
  const response = await fetch(path, {
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

export async function fetchContacts(search?: string): Promise<Contact[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<Contact[]>(`${API_BASE}/api/contacts${query}`);
}

export async function fetchContact(contactId: number): Promise<Contact> {
  return request<Contact>(`${API_BASE}/api/contacts/${contactId}`);
}

export async function createContact(payload: ContactPayload): Promise<Contact> {
  return request<Contact>(`${API_BASE}/api/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateContact(contactId: number, payload: ContactPayload): Promise<Contact> {
  return request<Contact>(`${API_BASE}/api/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteContact(contactId: number): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`${API_BASE}/api/contacts/${contactId}`, {
    method: 'DELETE',
  });
}
