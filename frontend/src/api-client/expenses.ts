const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'other';

export type Expense = {
  id: number;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string;
};

export type ExpensePayload = {
  amount: number;
  category: string;
  note: string;
  date: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = 'Request failed.';

    try {
      const data = (await response.json()) as { detail?: string | { msg?: string }[] };
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        message = data.detail[0].msg;
      }
    } catch {
      message = 'Request failed.';
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    amount: Number(expense.amount ?? 0)
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await request<Expense[]>('/api/expenses');
  return data.map(normalizeExpense);
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const data = await request<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return normalizeExpense(data);
}

export async function updateExpense(expenseId: number, payload: ExpensePayload): Promise<Expense> {
  const data = await request<Expense>(`/api/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return normalizeExpense(data);
}

export async function deleteExpense(expenseId: number): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: {}
  });
}
