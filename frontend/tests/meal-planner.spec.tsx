import { test, expect } from '@playwright/test';

const defaultPreferences = {
  number_of_kids: 1,
  age_range: '1-3 years',
  dietary_restriction: 'None',
  foods_to_avoid: '',
  cuisine_preferences: [],
};

const meal = {
  name: 'Berry Oat Bowl',
  description: 'A sweet and creamy breakfast bowl kids can enjoy.',
  ingredients: ['oats', 'berries'],
  prep_time_minutes: 10,
  difficulty: 'Easy',
} as const;

const fullDayPlan = {
  date: '2026-01-01',
  meals: {
    breakfast: meal,
    lunch: {
      name: 'Mini Pita Pockets',
      description: 'Colorful pita pockets with simple fillings.',
      ingredients: ['pita', 'hummus'],
      prep_time_minutes: 15,
      difficulty: 'Easy',
    },
    snack: {
      name: 'Yogurt Parfait',
      description: 'A crunchy, fruity snack with layers.',
      ingredients: ['yogurt', 'granola'],
      prep_time_minutes: 5,
      difficulty: 'Easy',
    },
    dinner: {
      name: 'Cheesy Pasta',
      description: 'A warm dinner with familiar flavors.',
      ingredients: ['pasta', 'cheese'],
      prep_time_minutes: 20,
      difficulty: 'Medium',
    },
  },
};

const weekPlan = {
  week_start: '2026-01-01',
  days: [
    { date: '2026-01-01', meals: fullDayPlan.meals },
    { date: '2026-01-02', meals: null },
    { date: '2026-01-03', meals: null },
    { date: '2026-01-04', meals: null },
    { date: '2026-01-05', meals: null },
    { date: '2026-01-06', meals: null },
    { date: '2026-01-07', meals: null },
  ],
};

async function mockPlannerApi(page, overrides: Partial<Record<string, unknown>> = {}) {
  await page.route('**/api/preferences', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(defaultPreferences) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(defaultPreferences) });
  });
  await page.route('**/api/favorites', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(overrides.favorites ?? []) });
      return;
    }
    if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'fav-1', meal }) });
      return;
    }
    if (method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'fav-1', deleted: true }) });
      return;
    }
  });
  await page.route('**/api/week/*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(weekPlan) });
  });
  await page.route('**/api/meals/generate-day', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fullDayPlan) });
  });
  await page.route('**/api/meals/suggest-alternative', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2026-01-01',
        meals: { ...fullDayPlan.meals, lunch: { ...fullDayPlan.meals.lunch, name: 'Sunshine Wrap' } },
      }),
    });
  });
}

test('empty state shows exact plan today CTA', async ({ page }) => {
  await mockPlannerApi(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: "Plan today's meals" })).toBeVisible();
});

test('loading feedback appears during generate and suggest alternative requests', async ({ page }) => {
  await mockPlannerApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: "Plan today's meals" }).click();
  await expect(page.getByRole('button', { name: /generating meals/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /suggest alternative/i }).first()).toBeVisible();
  await page.getByRole('button', { name: /suggest alternative/i }).first().click();
  await expect(page.getByRole('button', { name: /refreshing this slot/i })).toBeVisible();
});

test('weekly day selection renders the selected day plan', async ({ page }) => {
  await mockPlannerApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: "Plan today's meals" }).click();
  await page.getByRole('button', { name: /2026-01-01/i }).click();
  await expect(page.getByText('Meals for 2026-01-01')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Berry Oat Bowl' })).toBeVisible();
});

test('saving and displaying a favorite follows the API contract', async ({ page }) => {
  await mockPlannerApi(page, { favorites: [] });
  await page.goto('/');
  await page.getByRole('button', { name: "Plan today's meals" }).click();
  await page.getByRole('button', { name: 'Save Berry Oat Bowl to favorites' }).click();
  await expect(page.getByText('Berry Oat Bowl')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove Berry Oat Bowl from favorites' })).toBeVisible();
});
