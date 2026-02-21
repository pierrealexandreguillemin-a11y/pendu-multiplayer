/**
 * E2E Tests - Coop Mode Lobby
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('Coop Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coop');
  });

  test('should display coop lobby with title', async ({ page }) => {
    await expect(page.getByText('Mode Coop')).toBeVisible();
  });

  test('should have player name input', async ({ page }) => {
    await expect(page.getByPlaceholder(/pseudo/i)).toBeVisible();
  });

  test('should have create and join buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /créer une partie/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /rejoindre/i })).toBeVisible();
  });

  test('should have join code input', async ({ page }) => {
    await expect(page.getByPlaceholder(/code/i)).toBeVisible();
  });

  test('should disable create button when no name entered', async ({ page }) => {
    // Clear any pre-filled name from localStorage
    await page.getByPlaceholder(/pseudo/i).clear();
    await expect(page.getByRole('button', { name: /créer une partie/i })).toBeDisabled();
  });

  test('should disable join button when no name or code', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).clear();
    await expect(page.getByRole('button', { name: /rejoindre/i })).toBeDisabled();
  });

  test('should disable join button when name filled but no code', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');
    await expect(page.getByRole('button', { name: /rejoindre/i })).toBeDisabled();
  });

  test('should enable create button when name is entered', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');
    await expect(page.getByRole('button', { name: /créer une partie/i })).toBeEnabled();
  });

  test('should enable join button when name and code are entered', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('TestPlayer');
    await page.getByPlaceholder(/code/i).fill('abc123');
    await expect(page.getByRole('button', { name: /rejoindre/i })).toBeEnabled();
  });

  test('should have back link to home', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /retour/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });
});
