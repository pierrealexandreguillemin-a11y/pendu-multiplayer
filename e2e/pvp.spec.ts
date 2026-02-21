/**
 * E2E Tests - PvP Mode Lobby
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('PvP Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pvp');
  });

  test('should display pvp lobby with title and description', async ({ page }) => {
    await expect(page.getByText('Mode PvP')).toBeVisible();
    await expect(page.getByText(/choisit le mot/i)).toBeVisible();
  });

  test('should have player name input', async ({ page }) => {
    await expect(page.getByPlaceholder(/pseudo/i)).toBeVisible();
  });

  test('should have host and guest buttons with distinct labels', async ({ page }) => {
    await expect(page.getByRole('button', { name: /je choisis le mot/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /je devine/i })).toBeVisible();
  });

  test('should have join code input', async ({ page }) => {
    await expect(page.getByPlaceholder(/code/i)).toBeVisible();
  });

  test('should disable host button when no name entered', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).clear();
    await expect(page.getByRole('button', { name: /je choisis le mot/i })).toBeDisabled();
  });

  test('should disable guest button when no name or code', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).clear();
    await expect(page.getByRole('button', { name: /je devine/i })).toBeDisabled();
  });

  test('should enable host button when name is entered', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('Maitre');
    await expect(page.getByRole('button', { name: /je choisis le mot/i })).toBeEnabled();
  });

  test('should enable guest button when name and code are entered', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('Devineur');
    await page.getByPlaceholder(/code/i).fill('abc123');
    await expect(page.getByRole('button', { name: /je devine/i })).toBeEnabled();
  });

  test('should have back link to home', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /retour/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });
});
