import { expect, test } from '@playwright/test';

test('loader completes and shows the terminal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('catalog')).toBeVisible();
  await expect(page.getByLabel('terminal input')).toBeVisible({ timeout: 6000 });
});
