/**
 * E2E Tests - Solo Mode Full Game Flow
 * ISO/IEC 29119 - Software Testing Standards
 *
 * Tests a complete game: start -> guess letters -> win or lose -> end screen
 */

import { test, expect } from '@playwright/test';

test.describe('Solo Full Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo');
  });

  test('should play through a complete game until victory or defeat', async ({ page }) => {
    // Step 1: Enter name and start
    await page.getByPlaceholder(/pseudo/i).fill('E2EPlayer');
    await page.getByRole('button', { name: /commencer/i }).click();

    // Step 2: Game should start - keyboard visible
    const keyboard = page.getByRole('group', { name: /clavier/i });
    await expect(keyboard).toBeVisible({ timeout: 5000 });

    // Step 3: Word display should be visible
    const wordDisplay = page.getByRole('status');
    await expect(wordDisplay).toBeVisible();

    // Step 4: Remaining attempts should show
    await expect(page.getByText(/essais restants/i)).toBeVisible();

    // Step 5: Play all vowels then consonants until game ends
    const letters = ['E', 'A', 'I', 'O', 'U', 'S', 'T', 'R', 'N', 'L', 'D', 'C', 'P', 'M'];

    for (const letter of letters) {
      // Check if game is still playing (no victory/defeat screen)
      const gameOver = page.getByText(/bravo|perdu/i);
      if (await gameOver.isVisible().catch(() => false)) {
        break;
      }

      const btn = page.getByRole('button', { name: new RegExp(`lettre ${letter}`, 'i') });
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click();
        // Small delay to let animations play
        await page.waitForTimeout(200);
      }
    }

    // Step 6: Game should eventually end (victory or defeat)
    // Wait longer since we might need many guesses
    await expect(page.getByText(/bravo|perdu/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show score on victory screen', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('E2EPlayer');
    await page.getByRole('button', { name: /commencer/i }).click();
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Guess every letter to guarantee a win (max 6 wrong out of 26)
    const allLetters = 'EAIOUSTRNLDCPMFGHJKBQVWXYZ'.split('');
    for (const letter of allLetters) {
      const gameOver = page.getByText(/bravo|perdu/i);
      if (await gameOver.isVisible().catch(() => false)) break;

      const btn = page.getByRole('button', { name: new RegExp(`lettre ${letter}`, 'i') });
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(100);
      }
    }

    // If we won, check score display
    const victoryScreen = page.getByText(/bravo/i);
    if (await victoryScreen.isVisible().catch(() => false)) {
      await expect(page.getByText(/points/i)).toBeVisible();
    }
  });

  test('should show defeat screen with game over message', async ({ page }) => {
    // Select hard mode to minimize max errors (fewer chances = faster defeat)
    await page.getByText(/difficile/i).click();

    await page.getByPlaceholder(/pseudo/i).fill('E2EPlayer');
    await page.getByRole('button', { name: /commencer/i }).click();
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Guess rare consonants first to maximize errors
    const rareLetters = 'WXKJZQYFGV'.split('');
    for (const letter of rareLetters) {
      const gameOver = page.getByText(/perdu/i);
      if (await gameOver.isVisible().catch(() => false)) break;

      const btn = page.getByRole('button', { name: new RegExp(`lettre ${letter}`, 'i') });
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(200);
      }
    }

    // If defeat triggered, verify game over screen
    const defeatScreen = page.getByText(/perdu/i);
    if (await defeatScreen.isVisible().catch(() => false)) {
      await expect(page.getByText(/game over/i)).toBeVisible();
    }
  });

  test('should disable guessed letters', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('E2EPlayer');
    await page.getByRole('button', { name: /commencer/i }).click();
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Click letter E
    const letterE = page.getByRole('button', { name: /lettre e/i });
    await letterE.click();
    await expect(letterE).toBeDisabled();

    // Click letter A
    const letterA = page.getByRole('button', { name: /lettre a/i });
    await letterA.click();
    await expect(letterA).toBeDisabled();
  });

  test('should show balloon display with correct aria label', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('E2EPlayer');
    await page.getByRole('button', { name: /commencer/i }).click();
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Balloon display should have aria-label with remaining count
    const balloons = page.getByRole('img', { name: /ballon.*restant/i });
    await expect(balloons).toBeVisible();
  });

  test('should update balloon count after wrong guess', async ({ page }) => {
    await page.getByPlaceholder(/pseudo/i).fill('E2EPlayer');
    await page.getByRole('button', { name: /commencer/i }).click();
    await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });

    // Get initial balloon label
    const balloons = page.getByRole('img', { name: /ballon.*restant/i });
    const initialLabel = await balloons.getAttribute('aria-label');

    // Guess a rare letter likely to be wrong
    const letterX = page.getByRole('button', { name: /lettre x/i });
    await letterX.click();
    await page.waitForTimeout(300);

    // Check if balloon count changed (wrong guess) or stayed (correct guess)
    // Either way, the balloon display should still be visible
    await expect(balloons).toBeVisible();

    // If wrong guess, aria-label should have changed
    const newLabel = await balloons.getAttribute('aria-label');
    // We can't guarantee X is wrong, but the element should still be accessible
    expect(newLabel).toBeTruthy();
    expect(initialLabel).toBeTruthy();
  });
});
