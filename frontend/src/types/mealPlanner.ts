export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type Preferences = {
  numberOfKids: number;
  ageRange: string;
  dietaryRestrictions: string[];
  foodsToAvoid: string;
  cuisinePreferences: string[];
};

export type Meal = {
  name: string;
  description: string;
  ingredients: string[];
  prepTimeMinutes: number;
  difficulty: 'Easy' | 'Medium';
};

export type DayMeals = Record<MealSlot, Meal>;

export type NullableDayMeals = Record<MealSlot, Meal | null>;

export type DayPlanResponse = {
  date: string;
  meals: DayMeals;
};

export type WeekPlanDay = {
  date: string;
  meals: NullableDayMeals;
};

export type WeekPlanResponse = {
  selectedDate: string;
  days: WeekPlanDay[];
};

export type Favorite = {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  prepTimeMinutes: number;
  difficulty: 'Easy' | 'Medium';
};

export type FavoritesResponse = {
  favorites: Favorite[];
};

export type FavoriteDeleteResponse = {
  deleted: boolean;
  id: string;
};

export type GenerateDayRequest = {
  date: string;
  preferences: Preferences;
};

export type SuggestAlternativeRequest = {
  date: string;
  slot: MealSlot;
  preferences: Preferences;
};

export type SuggestAlternativeResponse = {
  date: string;
  slot: MealSlot;
  meal: Meal;
  meals: DayMeals;
};
