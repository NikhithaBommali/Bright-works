import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as mealPlanner from './api-client/mealPlanner';

vi.mock('./api-client/mealPlanner');
vi.mock('./hooks/useDarkMode', () => ({
  useDarkMode: () => ({ isDark: false, toggleTheme: vi.fn() }),
}));

const mockedMealPlanner = vi.mocked(mealPlanner);

const preferences = {
  number_of_kids: 2,
  age_range: '4-6 years',
  dietary_restriction: 'None',
  foods_to_avoid: 'mushrooms',
  cuisine_preferences: ['Italian'],
};

const breakfast = {
  name: 'Berry Oat Parfait',
  description: 'A bright breakfast with creamy yogurt, oats, and berries.',
  ingredients: ['Greek yogurt', 'Rolled oats', 'Fresh berries'],
  prep_time_minutes: 10,
  difficulty: 'Easy' as const,
};

const lunch = {
  name: 'Mini Veggie Wraps',
  description: 'Quick lunch wraps with colorful vegetables.',
  ingredients: ['Tortillas', 'Hummus', 'Cucumber'],
  prep_time_minutes: 12,
  difficulty: 'Easy' as const,
};

const snack = {
  name: 'Apple Slices & Dip',
  description: 'Snack board with fruit and yogurt dip.',
  ingredients: ['Apples', 'Yogurt', 'Cinnamon'],
  prep_time_minutes: 5,
  difficulty: 'Easy' as const,
};

const dinner = {
  name: 'Cheesy Pasta Bake',
  description: 'Comforting pasta bake with hidden vegetables.',
  ingredients: ['Pasta', 'Tomato sauce', 'Cheese'],
  prep_time_minutes: 25,
  difficulty: 'Medium' as const,
};

const dayPlan = {
  date: '2026-01-15',
  meals: { breakfast, lunch, snack, dinner },
};

const weekPlan = {
  week_start: '2026-01-12',
  days: [{ date: '2026-01-15', meals: null }],
};

beforeEach(() => {
  vi.resetAllMocks();
  mockedMealPlanner.fetchPreferences.mockResolvedValue(preferences);
  mockedMealPlanner.fetchFavorites.mockResolvedValue([]);
  mockedMealPlanner.fetchWeekPlan.mockResolvedValue(weekPlan);
  mockedMealPlanner.savePreferences.mockResolvedValue(preferences);
  mockedMealPlanner.generateDayPlan.mockResolvedValue(dayPlan);
  mockedMealPlanner.suggestAlternative.mockResolvedValue({ ...dayPlan, meals: { ...dayPlan.meals, breakfast: { ...breakfast, name: 'Alt Berry Oat Parfait' } } });
  mockedMealPlanner.addFavorite.mockResolvedValue({ id: 'fav-1', meal: breakfast });
  mockedMealPlanner.deleteFavorite.mockResolvedValue({ id: 'fav-1', deleted: true });
});

describe('App todo-style meal flows', () => {
  it('creates a plan from the existing API contract', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/Ready to plan/i);
    await user.click(screen.getByRole('button', { name: /plan today's meals/i }));

    await waitFor(() => expect(mockedMealPlanner.generateDayPlan).toHaveBeenCalledWith({ date: '2026-01-15', preferences }));
    expect(await screen.findByRole('heading', { name: /Berry Oat Parfait/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Cheesy Pasta Bake/i })).toBeInTheDocument();
  });

  it('toggles a meal as favorite via create and delete API calls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('button', { name: /plan today's meals/i });
    await user.click(screen.getByRole('button', { name: /plan today's meals/i }));
    await screen.findByRole('heading', { name: /Berry Oat Parfait/i });

    const breakfastCard = screen.getByRole('heading', { name: /Berry Oat Parfait/i }).closest('article') ?? screen.getByText(/Berry Oat Parfait/i).closest('div');
    const favoriteButton = within(breakfastCard as HTMLElement).getByRole('button', { name: /save berry oat parfait to favorites/i });

    await user.click(favoriteButton);
    await waitFor(() => expect(mockedMealPlanner.addFavorite).toHaveBeenCalledWith({ meal: breakfast }));

    await user.click(within(breakfastCard as HTMLElement).getByRole('button', { name: /remove berry oat parfait from favorites/i }));
    await waitFor(() => expect(mockedMealPlanner.deleteFavorite).toHaveBeenCalledWith({ id: 'fav-1' }));
  });

  it('deletes a favorite from the sidebar', async () => {
    mockedMealPlanner.fetchFavorites.mockResolvedValueOnce([{ id: 'fav-1', meal: breakfast }]);
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/Favorites/i);
    const removeButton = screen.getByRole('button', { name: /remove berry oat parfait from favorites/i });
    await user.click(removeButton);

    await waitFor(() => expect(mockedMealPlanner.deleteFavorite).toHaveBeenCalledWith({ id: 'fav-1' }));
  });
});
