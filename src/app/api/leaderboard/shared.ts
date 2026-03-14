/**
 * Shared utilities for leaderboard API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import type { GameMode } from '@/types/game';

export const VALID_MODES: GameMode[] = ['solo', 'coop', 'pvp'];

/**
 * Parses the JSON body of a request and validates it is an object.
 * Returns { body } on success or { error: NextResponse } on failure.
 */
export async function parseJsonBody(
  request: NextRequest
): Promise<
  { body: Record<string, unknown>; error?: never } | { body?: never; error: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: NextResponse.json({ error: 'Body must be an object' }, { status: 400 }) };
  }

  return { body: raw as Record<string, unknown> };
}

/**
 * Validates that `mode` is a known GameMode.
 * Returns the typed GameMode or a NextResponse error.
 */
export function validateMode(
  mode: unknown
): { mode: GameMode; error?: never } | { mode?: never; error: NextResponse } {
  if (!mode || typeof mode !== 'string' || !VALID_MODES.includes(mode as GameMode)) {
    return {
      error: NextResponse.json(
        { error: 'Invalid or missing mode. Expected: solo | coop | pvp' },
        { status: 400 }
      ),
    };
  }
  return { mode: mode as GameMode };
}
