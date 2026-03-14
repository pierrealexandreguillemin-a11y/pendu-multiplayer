/**
 * API Route: /api/leaderboard/sync
 * Merges local entries with cloud leaderboard via Upstash Redis
 *
 * ISO/IEC 42010 - Architecture: Server-side boundary for Redis access
 * ISO/IEC 25010 - Security: credentials never exposed to client bundle
 *
 * POST /api/leaderboard/sync -> body: { mode, localEntries } -> returns merged LeaderboardEntry[]
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncLeaderboard } from '@/lib/upstash-client';
import { parseJsonBody, validateMode } from '../shared';

/**
 * POST /api/leaderboard/sync
 * Merges provided local entries with the current cloud leaderboard
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { body, error: bodyError } = await parseJsonBody(request);
  if (bodyError) return bodyError;

  const { mode: modeRaw, localEntries } = body;
  const { mode, error: modeError } = validateMode(modeRaw);
  if (modeError) return modeError;

  if (!Array.isArray(localEntries)) {
    return NextResponse.json({ error: 'localEntries must be an array' }, { status: 400 });
  }

  const merged = await syncLeaderboard(mode, localEntries);
  return NextResponse.json(merged);
}
