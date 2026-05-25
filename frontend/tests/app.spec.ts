import { test, expect } from '@playwright/test';

test('has title SpecFlowAI', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.saas-logo-container')).toContainText('SpecFlowAI');
});
