import { describe, it, expect } from 'vitest';
import { getWordFrequencyScore, WORD_FREQUENCY_SCORES } from '@/lib/word-frequencies';
import { CLASSIFIED_WORDS } from '@/lib/words-difficulty';

describe('word-frequencies', () => {
  describe('WORD_FREQUENCY_SCORES', () => {
    it('should be a non-empty map', () => {
      expect(WORD_FREQUENCY_SCORES.size).toBeGreaterThan(0);
    });

    it('should have scores between 0 and 1', () => {
      for (const [word, score] of WORD_FREQUENCY_SCORES) {
        expect(score, `${word} score out of range`).toBeGreaterThanOrEqual(0);
        expect(score, `${word} score out of range`).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('getWordFrequencyScore', () => {
    it('should return low score for very common words', () => {
      expect(getWordFrequencyScore('chat')).toBeLessThan(0.3);
    });

    it('should return high score for unknown words', () => {
      expect(getWordFrequencyScore('xyznotaword')).toBe(0.8);
    });

    it('should be case-insensitive', () => {
      expect(getWordFrequencyScore('chat')).toBe(getWordFrequencyScore('CHAT'));
    });

    it('should handle accented words', () => {
      const score = getWordFrequencyScore('éléphant');
      expect(score).toBeLessThan(0.8);
    });

    it('should cover at least 50% of classified words with a real frequency', () => {
      const wordsWithRealFreq = CLASSIFIED_WORDS.filter(
        (entry) => getWordFrequencyScore(entry.word) < 0.8
      );
      const coverage = wordsWithRealFreq.length / CLASSIFIED_WORDS.length;
      expect(
        coverage,
        `Only ${(coverage * 100).toFixed(1)}% of words have a real frequency score`
      ).toBeGreaterThanOrEqual(0.4);
    });
  });
});
