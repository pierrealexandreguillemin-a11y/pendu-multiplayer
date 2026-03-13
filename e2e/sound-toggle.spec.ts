/**
 * E2E Tests - Sound Toggle
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('Sound Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo');
    const nameInput = page.getByRole('textbox');
    await nameInput.fill('TestSon');
    await page.getByRole('button', { name: /commencer/i }).click();
  });

  test('should display sound toggle button in game', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /son/i });
    await expect(toggle).toBeVisible();
  });

  test('should have correct aria-label for sound state', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /son/i });
    const label = await toggle.getAttribute('aria-label');
    expect(label).toMatch(/activer le son|désactiver le son/i);
  });

  test('should have aria-pressed attribute', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /son/i });
    const pressed = await toggle.getAttribute('aria-pressed');
    expect(['true', 'false']).toContain(pressed);
  });

  test('should toggle aria-pressed on click', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /son/i });
    const before = await toggle.getAttribute('aria-pressed');
    await toggle.click();
    const after = await toggle.getAttribute('aria-pressed');
    expect(after).not.toBe(before);
  });
});
