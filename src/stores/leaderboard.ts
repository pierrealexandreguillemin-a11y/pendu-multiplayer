/**
 * Leaderboard Store - Zustand with localStorage persistence
 * APPLICATION LAYER (ISO/IEC 42010)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeaderboardEntry, GameMode } from '@/types/game';

/** Maximum entries per mode */
const MAX_ENTRIES_PER_MODE = 10;

interface LeaderboardState {
  /** Entries grouped by mode */
  entries: {
    solo: LeaderboardEntry[];
    coop: LeaderboardEntry[];
    pvp: LeaderboardEntry[];
  };
  /** Add a new entry to the leaderboard */
  addEntry: (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => void;
  /** Get top scores for a mode */
  getTopScores: (mode: GameMode, limit?: number) => LeaderboardEntry[];
  /** Clear all entries for a mode */
  clearMode: (mode: GameMode) => void;
  /** Clear all entries */
  clearAll: () => void;
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
    }),
    {
      name: 'pendu-leaderboard',
    }
  )
);
