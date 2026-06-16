import { apiDelete, apiGet, apiPost, apiPut } from './base';
import type {
  DayPlanResponse,
  Favorite,
  FavoriteDeleteResponse,
  FavoritesResponse,
  GenerateDayRequest,
  Meal,
  Preferences,
  SuggestAlternativeRequest,
  SuggestAlternativeResponse,
  WeekPlanResponse,
} from '../types/mealPlanner';

export type { Favorite, FavoriteDeleteResponse, Meal, Preferences, SuggestAlternativeResponse, WeekPlanResponse } from '../types/mealPlanner';
export type { MealSlot } from '../types/mealPlanner';

export function fetchPreferences(): Promise<Preferences> {
  return apiGet<Preferences>('/api/preferences');
}

export function savePreferences(body: Preferences): Promise<Preferences> {
  return apiPut<Preferences, Preferences>('/api/preferences', body);
}

export function generateDayPlan(body: GenerateDayRequest): Promise<DayPlanResponse> {
  return apiPost<DayPlanResponse, GenerateDayRequest>('/api/meals/generate-day', body);
}

export function suggestAlternative(body: SuggestAlternativeRequest): Promise<SuggestAlternativeResponse> {
  return apiPost<SuggestAlternativeResponse, SuggestAlternativeRequest>('/api/meals/suggest-alternative', body);
}

export function fetchWeekPlan(date: string): Promise<WeekPlanResponse> {
  return apiGet<WeekPlanResponse>(`/api/week/${date}`);
}

export function fetchFavorites(): Promise<FavoritesResponse> {
  return apiGet<FavoritesResponse>('/api/favorites');
}

export function addFavorite(body: { meal: Meal }): Promise<{ favorite: Favorite }> {
  return apiPost<{ favorite: Favorite }, { meal: Meal }>('/api/favorites', body);
}

export function removeFavorite(id: string): Promise<FavoriteDeleteResponse> {
  return apiDelete<FavoriteDeleteResponse, { id: string }>('/api/favorites', { id });
}
