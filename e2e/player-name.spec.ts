/**
 * E2E Tests - Player Name Persistence
 * ISO/IEC 29119 - Software Testing Standards
 * ISO/IEC 25010 - Usability: Remember user preferences
 */

import { test, expect } from '@playwright/test';

test.describe('Player Name Persistence', () => {
  test('should persist player name across page navigations', async ({ page }) => {
    await page.goto('/solo');
    const nameInput = page.getByRole('textbox');
    await nameInput.fill('Joueur42');
    await page.getByRole('button', { name: /commencer/i }).click();

    // Navigate back to solo — name should be auto-filled
    await page.goto('/solo');
    const restoredInput = page.getByRole('textbox');
    await expect(restoredInput).toHaveValue('Joueur42');
  });

  test('should persist player name across different modes', async ({ page }) => {
    await page.goto('/solo');
    const nameInput = page.getByRole('textbox');
    await nameInput.fill('Joueur42');
    await page.getByRole('button', { name: /commencer/i }).click();

    // Navigate to coop — name should be auto-filled
    await page.goto('/coop');
    const coopInput = page.getByRole('textbox').first();
    await expect(coopInput).toHaveValue('Joueur42');
  });

  test('should allow clearing the player name field', async ({ page }) => {
    // Pre-fill localStorage
    await page.goto('/solo');
    await page.evaluate(() => localStorage.setItem('pendu-player-name', 'OldName'));
    await page.reload();

    const nameInput = page.getByRole('textbox');
    await expect(nameInput).toHaveValue('OldName');

    await nameInput.clear();
    await expect(nameInput).toHaveValue('');
  });

  test('should disable start button when name is empty', async ({ page }) => {
    await page.goto('/solo');
    // Clear any persisted name
    await page.evaluate(() => localStorage.removeItem('pendu-player-name'));
    await page.reload();

    const nameInput = page.getByRole('textbox');
    await nameInput.clear();
    const startButton = page.getByRole('button', { name: /commencer/i });
    await expect(startButton).toBeDisabled();
  });
});
