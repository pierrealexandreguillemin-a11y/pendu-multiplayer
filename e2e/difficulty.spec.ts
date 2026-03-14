/**
 * E2E Tests - Difficulty Selector
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('Difficulty Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo');
  });

  test('should display difficulty label', async ({ page }) => {
    await expect(page.getByText(/difficulté/i)).toBeVisible();
  });

  test('should have three difficulty options', async ({ page }) => {
    await expect(page.getByText(/facile/i)).toBeVisible();
    await expect(page.getByText(/normal/i)).toBeVisible();
    await expect(page.getByText(/difficile/i)).toBeVisible();
  });

  test('should show max errors info for selected difficulty', async ({ page }) => {
    await expect(page.getByText(/erreurs max/i)).toBeVisible();
  });

  test('should switch difficulty on click', async ({ page }) => {
    // Click "Facile"
    await page.getByText(/facile/i).click();
    await expect(page.getByText(/erreurs max/i)).toBeVisible();

    // Click "Difficile"
    await page.getByText(/difficile/i).click();
    await expect(page.getByText(/erreurs max/i)).toBeVisible();
  });

  test('should show "sans indice" for hard mode', async ({ page }) => {
    await page.getByText(/difficile/i).click();
    await expect(page.getByText(/sans indice/i)).toBeVisible();
  });

  test('should preserve difficulty choice when starting game', async ({ page }) => {
    // Select hard mode
    await page.getByText(/difficile/i).click();

    // Start game
    await page.getByPlaceholder(/ex.*marie/i).fill('DiffTest');
    await page.getByRole('button', { name: /commencer/i }).click();

    // Game should start
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });
  });
});
