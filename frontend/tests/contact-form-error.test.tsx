import { test, expect } from '@playwright/test';

test('contact form surfaces backend invalid email errors in the UI', async ({ page }) => {
  await page.route('**/api/contacts', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: [
            {
              loc: ['body', 'email'],
              msg: 'value is not a valid email address',
              type: 'value_error.email',
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/');

  await page.getByLabel('Name').fill('Bad Email');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.getByText(/value is not a valid email address/i)).toBeVisible();
});
