/**
 * E2E Tests - Home Page
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display game title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pendu/i })).toBeVisible();
  });

  test('should have navigation to Solo mode', async ({ page }) => {
    const soloLink = page.getByRole('link', { name: /solo/i });
    await expect(soloLink).toBeVisible();
    await soloLink.click();
    await expect(page).toHaveURL('/solo');
  });

  test('should have navigation to Coop mode', async ({ page }) => {
    const coopLink = page.getByRole('link', { name: /coop/i });
    await expect(coopLink).toBeVisible();
    await coopLink.click();
    await expect(page).toHaveURL('/coop');
  });

  test('should have navigation to PvP mode', async ({ page }) => {
    const pvpLink = page.getByRole('link', { name: /pvp/i });
    await expect(pvpLink).toBeVisible();
    await pvpLink.click();
    await expect(page).toHaveURL('/pvp');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: /pendu/i })).toBeVisible();
  });
});
