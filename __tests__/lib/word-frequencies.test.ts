import { describe, it, expect } from 'vitest';
import { getWordFrequencyScore, WORD_FREQUENCY_SCORES } from '@/lib/word-frequencies';
import { WORDS } from '@/lib/words';

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

    it('should cover all 120 words from the word list', () => {
      for (const entry of WORDS) {
        const score = getWordFrequencyScore(entry.word);
        expect(score, `Missing frequency for "${entry.word}" — got default ${score}`).toBeLessThan(
          0.8
        );
      }
    });
  });
});
