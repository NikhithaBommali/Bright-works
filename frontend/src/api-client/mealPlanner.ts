import { apiDelete, apiGet, apiPost, apiPut } from './base';
import type {
  DayPlan,
  Favorite,
  FavoritesResponse,
  GenerateDayRequest,
  Meal,
  MealSlot,
  Preferences,
  SuggestAlternativeRequest,
  WeekResponse,
} from '../types/mealPlanner';

export type { DayPlan, Favorite, Meal, MealSlot, Preferences, WeekResponse } from '../types/mealPlanner';

export function fetchPreferences(): Promise<Preferences> {
  return apiGet<Preferences>('/api/preferences');
}

export function savePreferences(body: Preferences): Promise<Preferences> {
  return apiPut<Preferences, Preferences>('/api/preferences', body);
}

export function generateDayPlan(body: GenerateDayRequest): Promise<DayPlan> {
  return apiPost<DayPlan, GenerateDayRequest>('/api/meals/generate-day', body);
}

export function suggestAlternative(body: SuggestAlternativeRequest): Promise<DayPlan> {
  return apiPost<DayPlan, SuggestAlternativeRequest>('/api/meals/suggest-alternative', body);
}

export function fetchWeekPlan(date: string): Promise<WeekResponse> {
  return apiGet<WeekResponse>(`/api/meals/week/${date}`);
}

export function fetchFavorites(): Promise<FavoritesResponse> {
  return apiGet<FavoritesResponse>('/api/favorites');
}

export function addFavorite(body: { meal: Meal }): Promise<FavoritesResponse> {
  return apiPost<FavoritesResponse, { meal: Meal }>('/api/favorites', body);
}

export function removeFavorite(body: { mealName: string; slot: MealSlot }): Promise<FavoritesResponse> {
  return apiDelete<FavoritesResponse, { mealName: string; slot: MealSlot }>('/api/favorites', body);
}
