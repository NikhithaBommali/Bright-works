const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type Difficulty = 'Easy' | 'Medium';
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type Preferences = {
  number_of_kids: number;
  age_range: string;
  dietary_restrictions: string[];
  foods_to_avoid: string;
  cuisine_preferences: string[];
};

export type Meal = {
  name: string;
  description: string;
  ingredients: string[];
  prep_time_minutes: number;
  difficulty: Difficulty;
};

export type DayMeals = Record<MealSlot, Meal>;

export type DayPlanEnvelope = {
  date: string;
  meals: DayMeals;
};

export type DayPlan = DayPlanEnvelope;

export type WeekDay = {
  date: string;
  meals: DayMeals;
};

export type WeekPlan = {
  selected_date: string;
  days: WeekDay[];
};

export type Favorite = {
  id: string;
  meal: Meal;
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

export async function fetchPreferences(): Promise<Preferences> {
  return request<Preferences>('/api/preferences');
}

export async function savePreferences(payload: Preferences): Promise<Preferences> {
  return request<Preferences>('/api/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function generateDayPlan(payload: { date: string; preferences: Preferences }): Promise<DayPlanEnvelope> {
  return request<DayPlan>('/api/meals/generate-day', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function suggestAlternative(payload: {
  date: string;
  slot: MealSlot;
  preferences: Preferences;
  current_day_plan: DayPlanEnvelope;
}): Promise<DayPlanEnvelope> {
  return request<DayPlanEnvelope>('/api/meals/suggest-alternative', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchWeekPlan(date: string): Promise<WeekPlan> {
  return request<WeekPlan>(`/api/week/${date}`);
}

export async function fetchFavorites(): Promise<Favorite[]> {
  return request<Favorite[]>('/api/favorites');
}

export async function addFavorite(payload: { meal: Meal }): Promise<Favorite> {
  return request<Favorite>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteFavorite(payload: { id: string }): Promise<void> {
  return request<void>(`/api/favorites?id=${encodeURIComponent(payload.id)}`, {
    method: 'DELETE',
  });
}
