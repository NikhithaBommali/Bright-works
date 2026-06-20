export type MealSlot = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';

export type Preferences = {
  numberOfKids: number;
  ageRange: string;
  dietaryRestrictions: string[];
  foodsToAvoid: string;
  cuisinePreferences: string[];
};

export type Meal = {
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

export type WeekDay = {
  date: string;
  meals: Meal[];
};

export type WeekPlanResponse = {
  selectedDate: string;
  days: WeekDay[];
};

export type Favorite = Meal & {
  id: string;
};

export type FavoritesResponse = {
  favorites: Favorite[];
};

export type GenerateDayRequest = {
  date: string;
  preferences: Preferences;
};

export type SuggestAlternativeRequest = {
  date: string;
  slot: MealSlot;
  preferences: Preferences;
  currentPlan: DayPlan;
};

export type WeekResponse = WeekPlanResponse;
