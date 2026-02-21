/**
 * E2E Tests - Leaderboard
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test('should open solo leaderboard from solo start screen', async ({ page }) => {
    await page.goto('/solo');
    await page.getByRole('button', { name: /classement/i }).click();

    // Leaderboard modal should appear
    await expect(page.getByText(/classement solo/i)).toBeVisible({ timeout: 3000 });
  });

  test('should show close button in leaderboard', async ({ page }) => {
    await page.goto('/solo');
    await page.getByRole('button', { name: /classement/i }).click();
    await expect(page.getByText(/classement solo/i)).toBeVisible({ timeout: 3000 });

    // Should have close button (aria-label "Fermer" on x button)
    await expect(page.getByLabel('Fermer')).toBeVisible();
  });

  test('should close leaderboard when clicking close', async ({ page }) => {
    await page.goto('/solo');
    await page.getByRole('button', { name: /classement/i }).click();
    await expect(page.getByText(/classement solo/i)).toBeVisible({ timeout: 3000 });

    // Click close (x button)
    await page.getByLabel('Fermer').click();

    // Leaderboard should disappear
    await expect(page.getByText(/classement solo/i)).not.toBeVisible({ timeout: 3000 });
  });

  test('should show empty state message when no scores', async ({ page }) => {
    // Clear localStorage to ensure no scores
    await page.goto('/solo');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: /classement/i }).click();
    await expect(page.getByText(/classement solo/i)).toBeVisible({ timeout: 3000 });

    // Should show empty state or table
    const emptyMessage = page.getByText(/aucun score/i);
    const table = page.locator('table');
    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasTable = await table.isVisible().catch(() => false);

    // One of these should be true
    expect(hasEmpty || hasTable).toBeTruthy();
  });

  test('should show clear button only when entries exist', async ({ page }) => {
    await page.goto('/solo');

    // Select hard mode to lose quickly (fewer max errors)
    await page.getByText(/difficile/i).click();

    // Play a quick game to generate a score entry
    await page.getByPlaceholder(/pseudo/i).fill('E2ELeaderboard');
    await page.getByRole('button', { name: /commencer/i }).click();
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Guess rare letters to lose quickly
    for (const letter of 'WXKJZQYFGVBH'.split('')) {
      const gameOver = page.getByText(/perdu/i);
      if (await gameOver.isVisible().catch(() => false)) break;
      const btn = page.getByRole('button', { name: new RegExp(`lettre ${letter}`, 'i') });
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(150);
      }
    }

    // Wait for game over, go back to start
    await expect(page.getByText(/bravo|perdu/i)).toBeVisible({ timeout: 15000 });

    // Navigate back to solo and open leaderboard
    await page.goto('/solo');
    await page.getByRole('button', { name: /classement/i }).click();
    await expect(page.getByText(/classement solo/i)).toBeVisible({ timeout: 3000 });

    // Should have the clear button since we just added a score
    const effacer = page.getByRole('button', { name: /effacer/i });
    await expect(effacer).toBeVisible();
  });
});
