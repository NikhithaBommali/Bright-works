import { apiDelete, apiGet, apiPost, apiPut, ApiError } from './base';
import type {
  DayMeals,
  DayPlanResponse,
  DeleteFavoriteResponse,
  FavoriteEntry,
  FavoritesResponse,
  Meal,
  MealSlot,
  Preferences,
  WeekPlanResponse,
} from '../types/mealPlanner';

export type {
  DayMeals,
  DayPlanResponse,
  DeleteFavoriteResponse,
  FavoriteEntry,
  FavoritesResponse,
  Meal,
  MealSlot,
  Preferences,
  WeekPlanResponse,
};
export { ApiError };

export async function fetchPreferences(): Promise<Preferences> {
  return apiGet<Preferences>('/api/preferences');
}

export async function savePreferences(payload: Preferences): Promise<Preferences> {
  return apiPut<Preferences, Preferences>('/api/preferences', payload);
}

export async function generateDayPlan(payload: { date: string; preferences: Preferences }): Promise<DayPlanResponse> {
  return apiPost<DayPlanResponse, { date: string; preferences: Preferences }>('/api/meals/generate-day', payload);
}

export async function suggestAlternative(payload: {
  date: string;
  slot: MealSlot;
  preferences: Preferences;
  current_plan: DayMeals;
}): Promise<DayPlanResponse> {
  return apiPost<DayPlanResponse, typeof payload>('/api/meals/suggest-alternative', payload);
}

export async function fetchWeekPlan(date: string): Promise<WeekPlanResponse> {
  return apiGet<WeekPlanResponse>(`/api/week/${date}`);
}

export async function fetchFavorites(): Promise<FavoritesResponse> {
  return apiGet<FavoritesResponse>('/api/favorites');
}

export async function addFavorite(payload: { meal: Meal }): Promise<FavoriteEntry> {
  return apiPost<FavoriteEntry, { meal: Meal }>('/api/favorites', payload);
}

export async function deleteFavorite(payload: { favorite_id: string }): Promise<DeleteFavoriteResponse> {
  return apiDelete<DeleteFavoriteResponse, { favorite_id: string }>('/api/favorites', payload);
}
