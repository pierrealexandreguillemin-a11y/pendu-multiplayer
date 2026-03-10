/**
 * API Route: /api/leaderboard/status
 * Reports whether cloud leaderboard (Upstash Redis) is configured
 *
 * ISO/IEC 42010 - Architecture: Server-side boundary for configuration check
 * ISO/IEC 25010 - Security: env var names never exposed to client bundle
 *
 * GET /api/leaderboard/status -> returns { configured: boolean }
 */

import { NextResponse } from 'next/server';
import { isUpstashConfigured } from '@/lib/upstash-client';

/**
 * GET /api/leaderboard/status
 * Returns whether the Upstash Redis cloud leaderboard is configured
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ configured: isUpstashConfigured() });
}
