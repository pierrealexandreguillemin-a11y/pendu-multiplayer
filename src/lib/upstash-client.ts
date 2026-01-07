/**
 * Upstash Redis Client - Infrastructure Layer
 * Cloud leaderboard sync via Upstash Redis KV Store
 *
 * ISO/IEC 25010 - Reliability: Graceful fallback when offline
 * ISO/IEC 42010 - Architecture: Infrastructure layer for persistence
 *
 * Environment variables:
 * - NEXT_PUBLIC_UPSTASH_REDIS_REST_URL
 * - NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis';
import type { LeaderboardEntry, GameMode } from '@/types/game';

/** Upstash Redis key prefix */
const KEY_PREFIX = 'pendu:leaderboard';

/** Maximum entries per mode in cloud leaderboard */
const MAX_CLOUD_ENTRIES = 10;

/** Cache TTL for leaderboard data (1 hour) */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Last fetch timestamps per mode */
const lastFetchTime: Record<GameMode, number> = {
  solo: 0,
  coop: 0,
  pvp: 0,
};

/** Cached leaderboard data per mode */
const cachedData: Record<GameMode, LeaderboardEntry[]> = {
  solo: [],
  coop: [],
  pvp: [],
};

/**
 * Get Redis client instance
 * Returns null if environment variables are not configured
 */
function getRedisClient(): Redis | null {
  const url = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
  const token = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Upstash] Missing environment variables. Cloud sync disabled.');
    return null;
  }

  return new Redis({ url, token });
}

/**
 * Check if Upstash is configured
 */
export function isUpstashConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL &&
    !!process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Get leaderboard key for a game mode
 */
function getLeaderboardKey(mode: GameMode): string {
  return `${KEY_PREFIX}:${mode}`;
}

/**
 * Fetch cloud leaderboard for a specific mode
 *
 * @param mode - Game mode (solo, coop, pvp)
 * @param forceRefresh - Force refresh from server (bypass cache)
 * @returns Array of leaderboard entries (empty array on error)
 */
export async function getCloudLeaderboard(
  mode: GameMode,
  forceRefresh = false
): Promise<LeaderboardEntry[]> {
  // Check cache
  const now = Date.now();
  if (!forceRefresh && now - lastFetchTime[mode] < CACHE_TTL_MS && cachedData[mode].length > 0) {
    return cachedData[mode];
  }

  const redis = getRedisClient();
  if (!redis) {
    return [];
  }

  try {
    const data = await redis.get<LeaderboardEntry[]>(getLeaderboardKey(mode));
    const entries = data ?? [];

    // Update cache
    cachedData[mode] = entries;
    lastFetchTime[mode] = now;

    return entries;
  } catch (error) {
    console.error('[Upstash] Failed to fetch leaderboard:', error);
    return cachedData[mode]; // Return cached data on error
  }
}

/**
 * Add a score to the cloud leaderboard
 *
 * @param mode - Game mode (solo, coop, pvp)
 * @param entry - Leaderboard entry to add
 * @returns true if successfully added, false otherwise
 */
export async function addCloudScore(mode: GameMode, entry: LeaderboardEntry): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    return false;
  }

  try {
    // Fetch current leaderboard
    const current = await getCloudLeaderboard(mode, true);

    // Add new entry and sort by score (desc), then by errors (asc)
    const updated = [...current, entry]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.errors - b.errors;
      })
      .slice(0, MAX_CLOUD_ENTRIES);

    // Save to Redis
    await redis.set(getLeaderboardKey(mode), updated);

    // Update cache
    cachedData[mode] = updated;
    lastFetchTime[mode] = Date.now();

    return true;
  } catch (error) {
    console.error('[Upstash] Failed to add score:', error);
    return false;
  }
}

/**
 * Merge local and cloud leaderboards
 * Takes the best scores from both sources
 *
 * @param local - Local leaderboard entries
 * @param cloud - Cloud leaderboard entries
 * @returns Merged array with top entries
 */
export function mergeLeaderboards(
  local: LeaderboardEntry[],
  cloud: LeaderboardEntry[]
): LeaderboardEntry[] {
  // Combine and deduplicate by ID
  const byId = new Map<string, LeaderboardEntry>();

  for (const entry of [...local, ...cloud]) {
    const existing = byId.get(entry.id);
    // Keep entry with higher score (or lower errors if same score)
    if (
      !existing ||
      entry.score > existing.score ||
      (entry.score === existing.score && entry.errors < existing.errors)
    ) {
      byId.set(entry.id, entry);
    }
  }

  // Sort by score (desc), then errors (asc)
  return Array.from(byId.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.errors - b.errors;
    })
    .slice(0, MAX_CLOUD_ENTRIES);
}

/**
 * Sync local leaderboard with cloud
 * Fetches cloud data and merges with local
 *
 * @param mode - Game mode
 * @param localEntries - Local leaderboard entries for this mode
 * @returns Merged leaderboard entries
 */
export async function syncLeaderboard(
  mode: GameMode,
  localEntries: LeaderboardEntry[]
): Promise<LeaderboardEntry[]> {
  const cloudEntries = await getCloudLeaderboard(mode, true);
  return mergeLeaderboards(localEntries, cloudEntries);
}

/**
 * Clear cache for testing/debugging
 */
export function clearCache(): void {
  for (const mode of ['solo', 'coop', 'pvp'] as GameMode[]) {
    cachedData[mode] = [];
    lastFetchTime[mode] = 0;
  }
}
