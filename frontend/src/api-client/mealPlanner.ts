import { apiDelete, apiGet, apiPost, apiPut } from './base';
import type {
  DayPlan,
  DeleteFavoriteResponse,
  Favorite,
  GenerateDayRequest,
  Meal,
  Preferences,
  SuggestAlternativeRequest,
  WeekPlanResponse,
} from '../types/mealPlanner';

export function fetchPreferences(): Promise<Preferences> {
  return apiGet<Preferences>('/api/preferences');
}

export function updatePreferences(body: Preferences): Promise<Preferences> {
  return apiPut<Preferences, Preferences>('/api/preferences', body);
}

export function generateDayPlan(body: GenerateDayRequest): Promise<DayPlan> {
  return apiPost<DayPlan, GenerateDayRequest>('/api/meals/generate-day', body);
}

export function suggestAlternative(body: SuggestAlternativeRequest): Promise<DayPlan> {
  return apiPost<DayPlan, SuggestAlternativeRequest>('/api/meals/suggest-alternative', body);
}

export function fetchWeekPlan(date: string): Promise<WeekPlanResponse> {
  return apiGet<WeekPlanResponse>(`/api/week/${date}`);
}

export function fetchFavorites(): Promise<Favorite[]> {
  return apiGet<Favorite[]>('/api/favorites');
}

export function createFavorite(body: { meal: Meal }): Promise<Favorite> {
  return apiPost<Favorite, { meal: Meal }>('/api/favorites', body);
}

export function deleteFavorite(body: { id: string }): Promise<DeleteFavoriteResponse> {
  return apiDelete<DeleteFavoriteResponse, { id: string }>('/api/favorites', body);
}
