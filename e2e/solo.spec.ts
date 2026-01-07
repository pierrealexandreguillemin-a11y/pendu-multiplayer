/**
 * E2E Tests - Solo Mode
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('Solo Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo');
  });

  test('should display difficulty selector', async ({ page }) => {
    await expect(page.getByText(/facile|normal|difficile/i)).toBeVisible();
  });

  test('should display player name input', async ({ page }) => {
    await expect(page.getByPlaceholder(/pseudo/i)).toBeVisible();
  });

  test('should start game after entering name and clicking play', async ({ page }) => {
    // Enter player name
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');

    // Click play button
    await page.getByRole('button', { name: /jouer/i }).click();

    // Should show game elements
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });
  });

  test('should show AZERTY keyboard layout', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');
    await page.getByRole('button', { name: /jouer/i }).click();

    // AZERTY first row starts with A, Z, E, R, T, Y
    const keyboard = page.getByRole('group', { name: /clavier/i });
    await expect(keyboard).toBeVisible({ timeout: 5000 });

    // Check AZERTY layout (first row should have A, Z, E, R, T, Y)
    await expect(page.getByRole('button', { name: /lettre a/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /lettre z/i })).toBeVisible();
  });

  test('should update keyboard on letter click', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');
    await page.getByRole('button', { name: /jouer/i }).click();

    // Wait for keyboard
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Click a letter
    const letterE = page.getByRole('button', { name: /lettre e/i });
    await letterE.click();

    // Letter should be disabled after click
    await expect(letterE).toBeDisabled();
  });

  test('should support physical keyboard input', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');
    await page.getByRole('button', { name: /jouer/i }).click();

    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Press 'E' key
    await page.keyboard.press('e');

    // Letter E should be disabled
    await expect(page.getByRole('button', { name: /lettre e/i })).toBeDisabled();
  });

  test('should show balloon display', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');
    await page.getByRole('button', { name: /jouer/i }).click();

    // Balloons should be visible (SVG elements)
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 5000 });
  });
});
