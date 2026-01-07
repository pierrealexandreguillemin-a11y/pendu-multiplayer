/**
 * useSessionMemory - Application Layer Hook
 * Manages session memory state for tracking used words
 *
 * ISO/IEC 25010 - Maintainability: Single Responsibility
 * Wraps domain functions with React state management
 */

import { useState, useCallback, useMemo } from 'react';
import {
  createSessionMemory,
  getNextWord,
  recordWordUsed,
  hasWordsRemaining,
  getSessionStats,
  resetSessionMemory,
  type SessionMemoryState,
} from '@/lib/session-memory';
import type { WordEntry } from '@/lib/words';

interface UseSessionMemoryReturn {
  /** Select next word and mark it as used */
  selectWord: (category?: string) => WordEntry | null;
  /** Reset session memory for new session */
  reset: () => void;
  /** Check if words are available */
  hasWordsRemaining: (category?: string) => boolean;
  /** Current session statistics */
  stats: {
    wordsUsed: number;
    totalWords: number;
    wordsRemaining: number;
  };
  /** Set of used words (for debugging) */
  usedWords: ReadonlySet<string>;
}

/**
 * Hook for managing session word memory
 * Ensures no word repetition within a session
 */
export function useSessionMemory(): UseSessionMemoryReturn {
  const [memory, setMemory] = useState<SessionMemoryState>(() => createSessionMemory());

  /**
   * Select next word and automatically mark it as used
   */
  const selectWord = useCallback(
    (category?: string): WordEntry | null => {
      const word = getNextWord(memory, category);
      if (word) {
        setMemory((prev) => recordWordUsed(prev, word.word));
      }
      return word;
    },
    [memory]
  );

  /**
   * Reset memory for a new session
   */
  const reset = useCallback(() => {
    setMemory(resetSessionMemory());
  }, []);

  /**
   * Check if words are available (optionally by category)
   */
  const checkWordsRemaining = useCallback(
    (category?: string): boolean => {
      return hasWordsRemaining(memory, category);
    },
    [memory]
  );

  /**
   * Current stats
   */
  const stats = useMemo(() => getSessionStats(memory), [memory]);

  return {
    selectWord,
    reset,
    hasWordsRemaining: checkWordsRemaining,
    stats,
    usedWords: memory.usedWords,
  };
}
