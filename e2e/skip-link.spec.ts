/**
 * E2E Tests - Skip Link (Accessibility)
 * ISO/IEC 29119 - Software Testing Standards
 * WCAG 2.1 AA - 2.4.1 Bypass Blocks
 */

import { test, expect } from '@playwright/test';

test.describe('Skip Link', () => {
  test('should have skip link in DOM on home page', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
    await expect(skipLink).toHaveText('Aller au contenu principal');
  });

  test('should be visually hidden by default', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main-content"]');
    const box = await skipLink.boundingBox();
    // sr-only makes it 1x1px or off-screen
    expect(box === null || box.width <= 1 || box.height <= 1).toBeTruthy();
  });

  test('should become visible on focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    const box = await skipLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(1);
    expect(box!.height).toBeGreaterThan(1);
  });

  test('should target existing main-content element on home', async ({ page }) => {
    await page.goto('/');
    const target = page.locator('#main-content');
    await expect(target).toHaveCount(1);
  });

  test('should target existing main-content element on solo', async ({ page }) => {
    await page.goto('/solo');
    const target = page.locator('#main-content');
    await expect(target).toHaveCount(1);
  });

  test('should target existing main-content element on coop', async ({ page }) => {
    await page.goto('/coop');
    const target = page.locator('#main-content');
    await expect(target).toHaveCount(1);
  });

  test('should target existing main-content element on pvp', async ({ page }) => {
    await page.goto('/pvp');
    const target = page.locator('#main-content');
    await expect(target).toHaveCount(1);
  });
});
