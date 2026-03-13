/**
 * E2E Tests - Security Headers
 * ISO/IEC 29119 - Software Testing Standards
 * OWASP Secure Headers
 */

import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('should return X-Content-Type-Options: nosniff', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('should return X-Frame-Options: DENY', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-frame-options']).toBe('DENY');
  });

  test('should return X-XSS-Protection header', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-xss-protection']).toBe('1; mode=block');
  });

  test('should return Referrer-Policy header', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
