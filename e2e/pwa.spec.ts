/**
 * E2E Tests - PWA Manifest & Installability
 * ISO/IEC 29119 - Software Testing Standards
 */

import { test, expect } from '@playwright/test';

test.describe('PWA', () => {
  test('should serve manifest.json with correct content', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toContain('Pendu');
    expect(manifest.short_name).toBe('Pendu');
    expect(manifest.lang).toBe('fr');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.id).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.theme_color).toBe('#1f2937');
    expect(manifest.background_color).toBe('#111827');
  });

  test('should have all required icons in manifest', async ({ request }) => {
    const response = await request.get('/manifest.json');
    const manifest = await response.json();

    expect(manifest.icons).toHaveLength(3);

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(sizes).toContain('180x180');
  });

  test('should serve icon-192x192.png', async ({ request }) => {
    const response = await request.get('/icons/icon-192x192.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('should serve icon-512x512.png', async ({ request }) => {
    const response = await request.get('/icons/icon-512x512.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('should serve apple-touch-icon.png', async ({ request }) => {
    const response = await request.get('/icons/apple-touch-icon.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('should have manifest link in HTML head', async ({ page }) => {
    await page.goto('/');
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  });

  test('should have apple-touch-icon link in HTML head', async ({ page }) => {
    await page.goto('/');
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveCount(1);
  });

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto('/');
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#1f2937');
  });

  test('should have lang="fr" on html element', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'fr');
  });
});
