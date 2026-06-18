import type { DayPlan, DayPlanEnvelope, DayMeals, Favorite, Meal, MealSlot, Preferences, WeekPlan } from '../api-client/mealPlanner';

export const DEFAULT_PREFERENCES: Preferences = {
  number_of_kids: 1,
  age_range: '2-5',
  dietary_restrictions: ['none'],
  foods_to_avoid: '',
  cuisine_preferences: [],
};

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeMeal(meal: Meal): Meal {
  return {
    ...meal,
    prep_time_minutes: Number(meal.prep_time_minutes ?? 0),
  };
}

export function normalizeDayMeals(meals: DayMeals): DayMeals {
  return {
    breakfast: normalizeMeal(meals.breakfast),
    lunch: normalizeMeal(meals.lunch),
    snack: normalizeMeal(meals.snack),
    dinner: normalizeMeal(meals.dinner),
  };
}

export function normalizeDayPlan(plan: DayPlanEnvelope): DayPlan {
  return {
    date: plan.date,
    meals: normalizeDayMeals(plan.meals),
  };
}

export function normalizeWeekPlan(week: WeekPlan): WeekPlan {
  return {
    selected_date: week.selected_date,
    days: week.days.map((day) => ({
      date: day.date,
      meals: normalizeDayMeals(day.meals),
    })),
  };
}

export function normalizeFavorites(favorites: Favorite[]): Favorite[] {
  return favorites.map((favorite) => ({
    ...favorite,
    meal: normalizeMeal(favorite.meal),
  }));
}

export function normalizePreferences(preferences: Preferences): Preferences {
  return {
    ...preferences,
    number_of_kids: Number(preferences.number_of_kids ?? 1),
    dietary_restrictions: preferences.dietary_restrictions.length ? preferences.dietary_restrictions : ['none'],
  };
}

export function mergeSlot(currentMeals: DayMeals | null, nextMeals: DayMeals, slot: MealSlot): DayMeals {
  if (!currentMeals) {
    return nextMeals;
  }

  return {
    ...currentMeals,
    [slot]: nextMeals[slot],
  };
}
