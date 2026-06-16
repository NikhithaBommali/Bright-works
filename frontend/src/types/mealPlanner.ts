export type MealDifficulty = 'Easy' | 'Medium';

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type Meal = {
  name: string;
  description: string;
  ingredients: string[];
  prepTimeMinutes: number;
  difficulty: MealDifficulty;
};

export type Preferences = {
  numberOfKids: number;
  ageRange: string;
  dietaryRestrictions: string[];
  foodsToAvoid: string;
  cuisinePreferences: string[];
};

export type DayPlan = {
  date: string;
  meals: Record<MealSlot, Meal>;
};

export type WeekDay = {
  date: string;
  planned: boolean;
  meals: {
    breakfast: Meal | null;
    lunch: Meal | null;
    snack: Meal | null;
    dinner: Meal | null;
  };
};

export type WeekPlanResponse = {
  weekStartDate: string;
  days: WeekDay[];
};

export type Favorite = {
  id: string;
  meal: Meal;
};

export type DeleteFavoriteResponse = {
  deleted: true;
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
