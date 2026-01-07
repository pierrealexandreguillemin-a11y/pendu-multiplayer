/**
 * Leaderboard Store - Zustand with localStorage + Cloud persistence
 * APPLICATION LAYER (ISO/IEC 42010)
 *
 * Handles localStorage errors gracefully (quota exceeded, disabled, etc.)
 * Supports Upstash Redis cloud sync for multi-device leaderboards
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { LeaderboardEntry, GameMode } from '@/types/game';
import {
  isUpstashConfigured,
  addCloudScore,
  syncLeaderboard,
  getCloudLeaderboard,
} from '@/lib/upstash-client';

/**
 * Safe localStorage wrapper - handles errors gracefully
 * ISO/IEC 5055 - Error handling at system boundaries
 */
const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn('[Leaderboard] localStorage read error:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      // QuotaExceededError or SecurityError
      console.warn('[Leaderboard] localStorage write error:', error);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('[Leaderboard] localStorage remove error:', error);
    }
  },
};

/** Maximum entries per mode */
const MAX_ENTRIES_PER_MODE = 10;

/** Cloud sync status */
export type CloudSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface LeaderboardState {
  /** Entries grouped by mode */
  entries: {
    solo: LeaderboardEntry[];
    coop: LeaderboardEntry[];
    pvp: LeaderboardEntry[];
  };
  /** Cloud sync status */
  cloudStatus: CloudSyncStatus;
  /** Whether cloud is configured */
  isCloudEnabled: boolean;
  /** Add a new entry to the leaderboard */
  addEntry: (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => void;
  /** Get top scores for a mode */
  getTopScores: (mode: GameMode, limit?: number) => LeaderboardEntry[];
  /** Clear all entries for a mode */
  clearMode: (mode: GameMode) => void;
  /** Clear all entries */
  clearAll: () => void;
  /** Sync with cloud for a specific mode */
  syncWithCloud: (mode: GameMode) => Promise<void>;
  /** Sync all modes with cloud */
  syncAllWithCloud: () => Promise<void>;
  /** Fetch cloud scores for a mode (read-only) */
  fetchCloudScores: (mode: GameMode) => Promise<LeaderboardEntry[]>;
}

/** Generate unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      entries: {
        solo: [],
        coop: [],
        pvp: [],
      },
      cloudStatus: 'idle' as CloudSyncStatus,
      isCloudEnabled: isUpstashConfigured(),

      addEntry: (entryData) => {
        const entry: LeaderboardEntry = {
          ...entryData,
          id: generateId(),
          timestamp: Date.now(),
        };

        set((state) => {
          const modeEntries = [...state.entries[entry.mode], entry];

          // Sort by score descending, then by errors ascending (fewer errors = better)
          modeEntries.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.errors - b.errors;
          });

          // Keep only top entries
          const trimmedEntries = modeEntries.slice(0, MAX_ENTRIES_PER_MODE);

          return {
            entries: {
              ...state.entries,
              [entry.mode]: trimmedEntries,
            },
          };
        });

        // Async cloud sync (fire and forget)
        if (isUpstashConfigured()) {
          addCloudScore(entry.mode, entry).catch((err) => {
            console.warn('[Leaderboard] Cloud sync failed:', err);
          });
        }
      },

      getTopScores: (mode, limit = MAX_ENTRIES_PER_MODE) => {
        return get().entries[mode].slice(0, limit);
      },

      clearMode: (mode) => {
        set((state) => ({
          entries: {
            ...state.entries,
            [mode]: [],
          },
        }));
      },

      clearAll: () => {
        set({
          entries: {
            solo: [],
            coop: [],
            pvp: [],
          },
        });
      },

      syncWithCloud: async (mode) => {
        if (!isUpstashConfigured()) return;

        set({ cloudStatus: 'syncing' });

        try {
          const localEntries = get().entries[mode];
          const mergedEntries = await syncLeaderboard(mode, localEntries);

          set((state) => ({
            entries: {
              ...state.entries,
              [mode]: mergedEntries,
            },
            cloudStatus: 'success',
          }));
        } catch (error) {
          console.error('[Leaderboard] Cloud sync error:', error);
          set({ cloudStatus: 'error' });
        }
      },

      syncAllWithCloud: async () => {
        if (!isUpstashConfigured()) return;

        set({ cloudStatus: 'syncing' });

        try {
          const modes: GameMode[] = ['solo', 'coop', 'pvp'];
          const state = get();

          const results = await Promise.all(
            modes.map(async (mode) => {
              const merged = await syncLeaderboard(mode, state.entries[mode]);
              return { mode, entries: merged };
            })
          );

          const newEntries = { ...state.entries };
          for (const result of results) {
            newEntries[result.mode] = result.entries;
          }

          set({
            entries: newEntries,
            cloudStatus: 'success',
          });
        } catch (error) {
          console.error('[Leaderboard] Cloud sync all error:', error);
          set({ cloudStatus: 'error' });
        }
      },

      fetchCloudScores: async (mode) => {
        if (!isUpstashConfigured()) return [];

        try {
          return await getCloudLeaderboard(mode, true);
        } catch (error) {
          console.error('[Leaderboard] Cloud fetch error:', error);
          return [];
        }
      },
    }),
    {
      name: 'pendu-leaderboard',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        entries: state.entries,
        // Don't persist cloudStatus or isCloudEnabled
      }),
    }
  )
);
