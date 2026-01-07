/**
 * Session Memory Tests
 * ISO/IEC 29119 - Test Cases for pure functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSessionMemory,
  getNextWord,
  recordWordUsed,
  hasWordsRemaining,
  getSessionStats,
  resetSessionMemory,
  type SessionMemoryState,
} from '@/lib/session-memory';

describe('session-memory', () => {
  let state: SessionMemoryState;

  beforeEach(() => {
    state = createSessionMemory();
  });

  describe('createSessionMemory', () => {
    it('should create empty state', () => {
      expect(state.usedWords.size).toBe(0);
      expect(state.totalWords).toBeGreaterThan(0);
    });

    it('should have immutable default', () => {
      const state1 = createSessionMemory();
      const state2 = createSessionMemory();
      expect(state1).not.toBe(state2);
      expect(state1.usedWords).not.toBe(state2.usedWords);
    });
  });

  describe('getNextWord', () => {
    it('should return a word entry', () => {
      const word = getNextWord(state);
      expect(word).not.toBeNull();
      expect(word?.word).toBeDefined();
      expect(word?.category).toBeDefined();
    });

    it('should not return used words', () => {
      // Get first word
      const word1 = getNextWord(state);
      expect(word1).not.toBeNull();

      // Record it as used
      const newState = recordWordUsed(state, word1!.word);

      // Get 100 more words and verify none match
      for (let i = 0; i < 100; i++) {
        const word2 = getNextWord(newState);
        if (word2) {
          expect(word2.word.toUpperCase()).not.toBe(word1!.word.toUpperCase());
        }
      }
    });

    it('should return null when all words used', () => {
      // Mark all words as used (simulate full session)
      let currentState = state;
      let word = getNextWord(currentState);

      while (word) {
        currentState = recordWordUsed(currentState, word.word);
        word = getNextWord(currentState);
      }

      expect(getNextWord(currentState)).toBeNull();
    });
  });

  describe('recordWordUsed', () => {
    it('should add word to usedWords set', () => {
      const newState = recordWordUsed(state, 'TEST');
      expect(newState.usedWords.has('TEST')).toBe(true);
    });

    it('should normalize to uppercase', () => {
      const newState = recordWordUsed(state, 'test');
      expect(newState.usedWords.has('TEST')).toBe(true);
    });

    it('should return same state if word already used', () => {
      const state1 = recordWordUsed(state, 'TEST');
      const state2 = recordWordUsed(state1, 'TEST');
      expect(state1).toBe(state2);
    });

    it('should not mutate original state', () => {
      const originalSize = state.usedWords.size;
      recordWordUsed(state, 'TEST');
      expect(state.usedWords.size).toBe(originalSize);
    });
  });

  describe('hasWordsRemaining', () => {
    it('should return true for fresh state', () => {
      expect(hasWordsRemaining(state)).toBe(true);
    });

    it('should return false when all words used', () => {
      // Use all words
      let currentState = state;
      let word = getNextWord(currentState);

      while (word) {
        currentState = recordWordUsed(currentState, word.word);
        word = getNextWord(currentState);
      }

      expect(hasWordsRemaining(currentState)).toBe(false);
    });
  });

  describe('getSessionStats', () => {
    it('should return correct initial stats', () => {
      const stats = getSessionStats(state);
      expect(stats.wordsUsed).toBe(0);
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.wordsRemaining).toBe(stats.totalWords);
    });

    it('should update stats after recording words', () => {
      let currentState = recordWordUsed(state, 'TEST1');
      currentState = recordWordUsed(currentState, 'TEST2');
      currentState = recordWordUsed(currentState, 'TEST3');

      const stats = getSessionStats(currentState);
      expect(stats.wordsUsed).toBe(3);
      expect(stats.wordsRemaining).toBe(stats.totalWords - 3);
    });
  });

  describe('resetSessionMemory', () => {
    it('should return fresh state', () => {
      const usedState = recordWordUsed(state, 'TEST');
      const resetState = resetSessionMemory();

      expect(resetState.usedWords.size).toBe(0);
      expect(usedState.usedWords.size).toBe(1);
    });
  });
});
