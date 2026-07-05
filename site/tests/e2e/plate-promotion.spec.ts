import { expect, test } from '@playwright/test';

test('first open inlines; second open promotes to plate', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const input = page.getByLabel('terminal input');
  await input.click();
  await input.fill('cd work');
  await input.press('Enter');
  await input.fill('open oryzo');
  await input.press('Enter');
  await expect(page.locator('[data-inline-slug="oryzo"]')).toBeVisible();
  await input.fill('open oryzo');
  await input.press('Enter');
  await expect(page.getByRole('dialog', { name: /oryzo plate/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
