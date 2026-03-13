/**
 * E2E Tests - Console Banner Easter Egg
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('Console Banner', () => {
  test('should display ASCII banner and branding in console', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    const allLogs = logs.join('\n');
    expect(allLogs).toContain('██████');
    expect(allLogs).toContain('P-A.G');
    expect(allLogs).toContain('open-source');
  });

  test('should reference the correct GitHub repository', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    const allLogs = logs.join('\n');
    expect(allLogs).toContain('pierrealexandreguillemin-a11y/pendu-multiplayer');
  });
});
