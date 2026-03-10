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
import type { GameMode } from '@/types/game';
import { syncLeaderboard } from '@/lib/upstash-client';

const VALID_MODES: GameMode[] = ['solo', 'coop', 'pvp'];

/**
 * POST /api/leaderboard/sync
 * Merges provided local entries with the current cloud leaderboard
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

  const { mode, localEntries } = body as Record<string, unknown>;

  if (!mode || typeof mode !== 'string' || !VALID_MODES.includes(mode as GameMode)) {
    return NextResponse.json(
      { error: 'Invalid or missing mode. Expected: solo | coop | pvp' },
      { status: 400 }
    );
  }

  if (!Array.isArray(localEntries)) {
    return NextResponse.json({ error: 'localEntries must be an array' }, { status: 400 });
  }

  const merged = await syncLeaderboard(mode as GameMode, localEntries);
  return NextResponse.json(merged);
}
