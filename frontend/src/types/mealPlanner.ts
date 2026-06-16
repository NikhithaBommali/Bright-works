export type MealSlot = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';

export type Preference = {
  numberOfKids: number;
  ageRange: string;
  dietaryRestrictions: string[];
  foodsToAvoid: string;
  cuisinePreferences: string[];
};

export type Meal = {
  id: string;
  slot: MealSlot;
  name: string;
  description: string;
  ingredients: string[];
  prepTimeMinutes: number;
  difficulty: 'Easy' | 'Medium';
};

export type DayPlan = {
  date: string;
  meals: Meal[];
};

export type PreferencesResponse = {
  preferences: Preference;
};

export type DayPlanResponse = {
  plan: DayPlan;
};

export type WeekEntry = {
  date: string;
  plan: DayPlan | null;
};

export type WeekResponse = {
  week: WeekEntry[];
};

export type FavoritesResponse = {
  favorites: Meal[];
};

export type GenerateDayRequest = {
  date: string;
  preferences: Preference;
};

export type SuggestAlternativeRequest = {
  date: string;
  slot: MealSlot;
  preferences: Preference;
};
