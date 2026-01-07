/**
 * Session Memory - Domain Layer
 * Pure functions for tracking used words within a session
 *
 * ISO/IEC 25010 - Maintainability: Single Responsibility Principle
 * ISO/IEC 5055 - Code Quality: Pure functions, no side effects
 */

import type { WordEntry } from './words';
import { WORDS } from './words';

/**
 * Session memory state tracking used words
 */
export interface SessionMemoryState {
  /** Set of normalized words already used in this session */
  usedWords: Set<string>;
  /** Total available words for selection */
  totalWords: number;
}

/**
 * Create a new session memory (for start/reset)
 */
export function createSessionMemory(): SessionMemoryState {
  return {
    usedWords: new Set(),
    totalWords: WORDS.length,
  };
}

/**
 * Get next word that hasn't been used in this session
 *
 * @param state - Current session memory state
 * @param category - Optional category filter
 * @returns WordEntry or null if all words used
 */
export function getNextWord(state: SessionMemoryState, category?: string): WordEntry | null {
  // Filter by category if provided
  let candidates = category
    ? WORDS.filter((w) => w.category.toLowerCase() === category.toLowerCase())
    : WORDS;

  // Exclude already-used words (compare normalized uppercase)
  candidates = candidates.filter((w) => !state.usedWords.has(w.word.toUpperCase()));

  if (candidates.length === 0) {
    return null; // All words used
  }

  // Select random from remaining candidates
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] ?? null;
}

/**
 * Record a word as used in the current session
 *
 * @param state - Current session memory state
 * @param word - Word to mark as used
 * @returns New state with word recorded
 */
export function recordWordUsed(state: SessionMemoryState, word: string): SessionMemoryState {
  const normalizedWord = word.toUpperCase();
  if (state.usedWords.has(normalizedWord)) {
    return state; // Already recorded, return same state
  }

  return {
    ...state,
    usedWords: new Set([...state.usedWords, normalizedWord]),
  };
}

/**
 * Check if there are words remaining to play
 *
 * @param state - Current session memory state
 * @param category - Optional category filter
 * @returns true if words are available
 */
export function hasWordsRemaining(state: SessionMemoryState, category?: string): boolean {
  const candidates = category
    ? WORDS.filter((w) => w.category.toLowerCase() === category.toLowerCase())
    : WORDS;

  return candidates.some((w) => !state.usedWords.has(w.word.toUpperCase()));
}

/**
 * Get session statistics
 *
 * @param state - Current session memory state
 * @returns Stats object
 */
export function getSessionStats(state: SessionMemoryState): {
  wordsUsed: number;
  totalWords: number;
  wordsRemaining: number;
} {
  return {
    wordsUsed: state.usedWords.size,
    totalWords: state.totalWords,
    wordsRemaining: state.totalWords - state.usedWords.size,
  };
}

/**
 * Reset session memory for a new session
 * Alias for createSessionMemory for semantic clarity
 */
export function resetSessionMemory(): SessionMemoryState {
  return createSessionMemory();
}
