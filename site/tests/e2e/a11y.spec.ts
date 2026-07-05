import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home has no serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

test('plate viewer has no serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const input = page.getByLabel('terminal input');
  await input.click();
  await input.fill('cd work');
  await input.press('Enter');
  await input.fill('open oryzo');
  await input.press('Enter');
  await input.fill('open oryzo');
  await input.press('Enter');
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});
