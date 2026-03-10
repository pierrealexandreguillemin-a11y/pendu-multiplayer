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

const VALID_MODES: GameMode[] = ['solo', 'coop', 'pvp'];

/**
 * GET /api/leaderboard?mode=solo
 * Returns the cloud leaderboard entries for the given mode
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') as GameMode | null;

  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json(
      { error: 'Invalid or missing mode. Expected: solo | coop | pvp' },
      { status: 400 }
    );
  }

  const entries = await getCloudLeaderboard(mode);
  return NextResponse.json(entries);
}

/**
 * POST /api/leaderboard
 * Adds a new score entry to the cloud leaderboard
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
  }

  const { mode, entry } = body as Record<string, unknown>;

  if (!mode || typeof mode !== 'string' || !VALID_MODES.includes(mode as GameMode)) {
    return NextResponse.json(
      { error: 'Invalid or missing mode. Expected: solo | coop | pvp' },
      { status: 400 }
    );
  }

  if (!entry || typeof entry !== 'object') {
    return NextResponse.json({ error: 'Missing or invalid entry' }, { status: 400 });
  }

  const success = await addCloudScore(
    mode as GameMode,
    entry as Parameters<typeof addCloudScore>[1]
  );
  return NextResponse.json({ success });
}
