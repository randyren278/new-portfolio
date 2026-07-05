import { expect, test } from '@playwright/test';

test('ls, cd, help commands echo to the transcript', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const input = page.getByLabel('terminal input');
  await input.click();
  await input.fill('ls');
  await input.press('Enter');
  await expect(page.getByText('work  about  contact')).toBeVisible();
  await input.fill('cd work');
  await input.press('Enter');
  await input.fill('ls');
  await input.press('Enter');
  await expect(page.getByText('oryzo  halcyon  paperlane  atlas  koinu  linen')).toBeVisible();
});
