/**
 * Difficulty Store - Zustand
 * State management for difficulty selection
 *
 * ISO/IEC 25010 - Maintainability: Centralized state
 * ISO/IEC 42010 - Architecture: Persistence layer
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DifficultyLevel, DifficultyConfig } from '@/types/difficulty';
import { DIFFICULTY_CONFIGS, getDefaultDifficulty } from '@/lib/difficulty-config';

/**
 * Safe localStorage wrapper for SSR compatibility
 */
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(name);
    } catch {
      console.warn('[Difficulty Store] localStorage read error');
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch {
      console.warn('[Difficulty Store] localStorage write error');
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {
      console.warn('[Difficulty Store] localStorage remove error');
    }
  },
};

interface DifficultyState {
  /** Current difficulty level */
  level: DifficultyLevel;

  /** Set difficulty level */
  setLevel: (level: DifficultyLevel) => void;

  /** Get current config */
  getConfig: () => DifficultyConfig;

  /** Get max errors for current difficulty */
  getMaxErrors: () => number;

  /** Should show category hint */
  shouldShowCategory: () => boolean;

  /** Reset to default */
  reset: () => void;
}

/**
 * Difficulty store with localStorage persistence
 */
export const useDifficultyStore = create<DifficultyState>()(
  persist(
    (set, get) => ({
      level: getDefaultDifficulty(),

      setLevel: (level) => set({ level }),

      getConfig: () => {
        const currentLevel = get().level;
        return DIFFICULTY_CONFIGS[currentLevel];
      },

      getMaxErrors: () => {
        return get().getConfig().maxErrors;
      },

      shouldShowCategory: () => {
        return get().getConfig().showCategory;
      },

      reset: () => set({ level: getDefaultDifficulty() }),
    }),
    {
      name: 'pendu-difficulty',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ level: state.level }),
    }
  )
);

/**
 * Hook to get difficulty config directly
 * Convenience wrapper for components
 */
export function useDifficultyConfig(): DifficultyConfig {
  const level = useDifficultyStore((state) => state.level);
  return DIFFICULTY_CONFIGS[level];
}
