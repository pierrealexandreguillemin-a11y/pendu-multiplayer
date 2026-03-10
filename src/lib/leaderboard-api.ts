/**
 * Leaderboard API Client - Application Layer
 * Client-side wrapper for cloud leaderboard API routes
 *
 * ISO/IEC 42010 - Architecture: Client-facing API boundary, delegates to server routes
 * ISO/IEC 25010 - Security: Redis credentials remain server-side only
 */

import type { LeaderboardEntry, GameMode } from '@/types/game';

/**
 * Check if the cloud leaderboard is configured (via server status route)
 *
 * @returns true if Upstash Redis is configured on the server
 */
export async function isCloudConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/leaderboard/status');
    if (!res.ok) return false;
    const data = (await res.json()) as { configured: boolean };
    return data.configured;
  } catch {
    return false;
  }
}

/**
 * Fetch cloud leaderboard entries for a specific mode
 *
 * @param mode - Game mode (solo, coop, pvp)
 * @returns Array of leaderboard entries (empty array on error)
 */
export async function fetchCloudLeaderboard(mode: GameMode): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard?mode=${mode}`);
    if (!res.ok) return [];
    return (await res.json()) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

/**
 * Submit a new score to the cloud leaderboard
 *
 * @param mode - Game mode (solo, coop, pvp)
 * @param entry - Leaderboard entry to add
 * @returns true if successfully added, false otherwise
 */
export async function submitCloudScore(mode: GameMode, entry: LeaderboardEntry): Promise<boolean> {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, entry }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}

/**
 * Sync local leaderboard entries with the cloud
 * Returns merged result of local and cloud entries
 *
 * @param mode - Game mode (solo, coop, pvp)
 * @param localEntries - Local leaderboard entries for this mode
 * @returns Merged leaderboard entries (empty array on error)
 */
export async function syncWithCloud(
  mode: GameMode,
  localEntries: LeaderboardEntry[]
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/leaderboard/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, localEntries }),
    });
    if (!res.ok) return localEntries;
    return (await res.json()) as LeaderboardEntry[];
  } catch {
    return localEntries;
  }
}
