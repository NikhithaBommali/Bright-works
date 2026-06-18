export type Difficulty = 'Easy' | 'Medium';
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type Preferences = {
  number_of_kids: number;
  age_range: string;
  dietary_restrictions: string;
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

export type DayMeals = {
  breakfast: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
};

export type DayPlanResponse = {
  date: string;
  meals: DayMeals;
};

export type WeekDay = {
  date: string;
  meals: DayMeals | null;
};

export type WeekPlanResponse = {
  selected_date: string;
  days: WeekDay[];
};

export type FavoriteEntry = {
  favorite_id: string;
  meal: Meal;
};

export type FavoritesResponse = {
  favorites: FavoriteEntry[];
};

export type DeleteFavoriteResponse = {
  deleted: boolean;
  favorite_id: string;
};
