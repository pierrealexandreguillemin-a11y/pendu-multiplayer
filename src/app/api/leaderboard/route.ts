/**
 * API Route: /api/leaderboard
 * Cloud leaderboard read and write via Upstash Redis
 *
 * ISO/IEC 42010 - Architecture: Server-side boundary for Redis access
 * ISO/IEC 25010 - Security: credentials never exposed to client bundle
 *
 * GET  /api/leaderboard?mode=solo  -> returns LeaderboardEntry[]
 * POST /api/leaderboard            -> body: { mode, entry } -> returns { success: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { GameMode } from '@/types/game';
import { getCloudLeaderboard, addCloudScore } from '@/lib/upstash-client';
import { parseJsonBody, validateMode } from './shared';

/**
 * GET /api/leaderboard?mode=solo
 * Returns the cloud leaderboard entries for the given mode
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get('mode');
  const { mode, error: modeError } = validateMode(modeParam);
  if (modeError) return modeError;

  const entries = await getCloudLeaderboard(mode);
  return NextResponse.json(entries);
}

/**
 * POST /api/leaderboard
 * Adds a new score entry to the cloud leaderboard
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { body, error: bodyError } = await parseJsonBody(request);
  if (bodyError) return bodyError;

  const { mode: modeRaw, entry } = body;
  const { mode, error: modeError } = validateMode(modeRaw);
  if (modeError) return modeError;

  if (!entry || typeof entry !== 'object') {
    return NextResponse.json({ error: 'Missing or invalid entry' }, { status: 400 });
  }

  const success = await addCloudScore(
    mode as GameMode,
    entry as Parameters<typeof addCloudScore>[1]
  );
  return NextResponse.json({ success });
}
