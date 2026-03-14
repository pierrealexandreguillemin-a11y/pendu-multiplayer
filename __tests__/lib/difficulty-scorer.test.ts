import { describe, it, expect } from 'vitest';
import { computeDifficultyScore, normalizeWord } from '@/lib/difficulty-scorer';

describe('difficulty-scorer', () => {
  describe('normalizeWord', () => {
    it('should remove accents', () => {
      expect(normalizeWord('éléphant')).toBe('ELEPHANT');
    });

    it('should remove hyphens and spaces', () => {
      expect(normalizeWord('arc-en-ciel')).toBe('ARCENCIEL');
    });

    it('should uppercase', () => {
      expect(normalizeWord('pomme')).toBe('POMME');
    });
  });

  describe('computeDifficultyScore', () => {
    it('should return a breakdown with all 6 criteria between 0 and 1', () => {
      const result = computeDifficultyScore('pomme');
      expect(result.letterRarity).toBeGreaterThanOrEqual(0);
      expect(result.letterRarity).toBeLessThanOrEqual(1);
      expect(result.uniqueLetters).toBeGreaterThanOrEqual(0);
      expect(result.uniqueLetters).toBeLessThanOrEqual(1);
      expect(result.wordFrequency).toBeGreaterThanOrEqual(0);
      expect(result.wordFrequency).toBeLessThanOrEqual(1);
      expect(result.consonantRatio).toBeGreaterThanOrEqual(0);
      expect(result.consonantRatio).toBeLessThanOrEqual(1);
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(result.length).toBeLessThanOrEqual(1);
      expect(result.bigramRarity).toBeGreaterThanOrEqual(0);
      expect(result.bigramRarity).toBeLessThanOrEqual(1);
    });

    it('should return total between 0 and 100', () => {
      const result = computeDifficultyScore('pomme');
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('should assign a difficulty level', () => {
      const result = computeDifficultyScore('pomme');
      expect(['easy', 'normal', 'hard']).toContain(result.level);
    });

    it('should score words with rare letters higher', () => {
      const common = computeDifficultyScore('pomme');
      const rare = computeDifficultyScore('kiwi');
      expect(rare.letterRarity).toBeGreaterThan(common.letterRarity);
      expect(rare.total).toBeGreaterThan(common.total);
    });

    it('should handle accented words', () => {
      const result = computeDifficultyScore('éléphant');
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('should handle hyphenated words', () => {
      const result = computeDifficultyScore('arc-en-ciel');
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should use Math.round for total', () => {
      const result = computeDifficultyScore('pomme');
      expect(result.total).toBe(Math.round(result.total));
    });

    it('should handle single-letter word', () => {
      const result = computeDifficultyScore('a');
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.uniqueLetters).toBe(1);
    });

    it('should handle all-vowel word', () => {
      const result = computeDifficultyScore('eau');
      expect(result.consonantRatio).toBe(0);
    });

    it('should handle word with no common bigrams', () => {
      const result = computeDifficultyScore('kiwi');
      expect(result.bigramRarity).toBeGreaterThan(0.5);
    });

    it('should produce scores that match spec weight distribution', () => {
      const result = computeDifficultyScore('test');
      const reconstructed =
        result.letterRarity * 0.3 +
        result.uniqueLetters * 0.2 +
        result.wordFrequency * 0.15 +
        result.consonantRatio * 0.15 +
        result.length * 0.1 +
        result.bigramRarity * 0.1;
      expect(result.total).toBe(Math.round(reconstructed * 100));
    });

    it('should classify according to scoreThreshold from config', async () => {
      // Import actual thresholds to avoid hardcoding stale values
      const { DIFFICULTY_CONFIGS } = await import('@/lib/difficulty-config');
      const result = computeDifficultyScore('pomme');
      if (result.total <= DIFFICULTY_CONFIGS.easy.scoreThreshold) expect(result.level).toBe('easy');
      else if (result.total <= DIFFICULTY_CONFIGS.normal.scoreThreshold)
        expect(result.level).toBe('normal');
      else expect(result.level).toBe('hard');
    });
  });
});
