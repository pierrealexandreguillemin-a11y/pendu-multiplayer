/**
 * Difficulty Configuration Tests
 * ISO/IEC 29119 - Test Cases for difficulty system
 */

import { describe, it, expect } from 'vitest';
import {
  DIFFICULTY_CONFIGS,
  getDifficultyConfig,
  getDefaultDifficulty,
  getAllDifficultyLevels,
  calculateDifficultyScore,
} from '@/lib/difficulty-config';
import type { DifficultyLevel } from '@/types/difficulty';

describe('difficulty-config', () => {
  describe('DIFFICULTY_CONFIGS', () => {
    it('should have all three difficulty levels', () => {
      expect(DIFFICULTY_CONFIGS.easy).toBeDefined();
      expect(DIFFICULTY_CONFIGS.normal).toBeDefined();
      expect(DIFFICULTY_CONFIGS.hard).toBeDefined();
    });

    it('should have decreasing maxErrors as difficulty increases', () => {
      expect(DIFFICULTY_CONFIGS.easy.maxErrors).toBeGreaterThan(
        DIFFICULTY_CONFIGS.normal.maxErrors
      );
      expect(DIFFICULTY_CONFIGS.normal.maxErrors).toBeGreaterThan(
        DIFFICULTY_CONFIGS.hard.maxErrors
      );
    });

    it('should have increasing scoreMultiplier as difficulty increases', () => {
      expect(DIFFICULTY_CONFIGS.easy.scoreMultiplier).toBeLessThan(
        DIFFICULTY_CONFIGS.normal.scoreMultiplier
      );
      expect(DIFFICULTY_CONFIGS.normal.scoreMultiplier).toBeLessThan(
        DIFFICULTY_CONFIGS.hard.scoreMultiplier
      );
    });

    it('should have valid wordLengthRange for each level', () => {
      const levels: DifficultyLevel[] = ['easy', 'normal', 'hard'];

      for (const level of levels) {
        const config = DIFFICULTY_CONFIGS[level];
        expect(config.wordLengthRange).toHaveLength(2);
        expect(config.wordLengthRange[0]).toBeLessThanOrEqual(config.wordLengthRange[1]);
        expect(config.wordLengthRange[0]).toBeGreaterThan(0);
      }
    });

    it('should have French labels', () => {
      expect(DIFFICULTY_CONFIGS.easy.label).toBe('Facile');
      expect(DIFFICULTY_CONFIGS.normal.label).toBe('Normal');
      expect(DIFFICULTY_CONFIGS.hard.label).toBe('Difficile');
    });

    it('should hide category only for hard mode', () => {
      expect(DIFFICULTY_CONFIGS.easy.showCategory).toBe(true);
      expect(DIFFICULTY_CONFIGS.normal.showCategory).toBe(true);
      expect(DIFFICULTY_CONFIGS.hard.showCategory).toBe(false);
    });
  });

  describe('getDifficultyConfig', () => {
    it('should return correct config for each level', () => {
      expect(getDifficultyConfig('easy')).toBe(DIFFICULTY_CONFIGS.easy);
      expect(getDifficultyConfig('normal')).toBe(DIFFICULTY_CONFIGS.normal);
      expect(getDifficultyConfig('hard')).toBe(DIFFICULTY_CONFIGS.hard);
    });

    it('should return config with all required properties', () => {
      const config = getDifficultyConfig('normal');

      expect(config).toHaveProperty('level');
      expect(config).toHaveProperty('maxErrors');
      expect(config).toHaveProperty('showCategory');
      expect(config).toHaveProperty('wordLengthRange');
      expect(config).toHaveProperty('scoreMultiplier');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('description');
    });
  });

  describe('getDefaultDifficulty', () => {
    it('should return normal as default', () => {
      expect(getDefaultDifficulty()).toBe('normal');
    });

    it('should return a valid difficulty level', () => {
      const defaultLevel = getDefaultDifficulty();
      expect(['easy', 'normal', 'hard']).toContain(defaultLevel);
    });
  });

  describe('getAllDifficultyLevels', () => {
    it('should return all three levels', () => {
      const levels = getAllDifficultyLevels();
      expect(levels).toHaveLength(3);
      expect(levels).toContain('easy');
      expect(levels).toContain('normal');
      expect(levels).toContain('hard');
    });

    it('should return levels in order: easy, normal, hard', () => {
      const levels = getAllDifficultyLevels();
      expect(levels[0]).toBe('easy');
      expect(levels[1]).toBe('normal');
      expect(levels[2]).toBe('hard');
    });

    it('should return readonly array', () => {
      const levels = getAllDifficultyLevels();
      // Type check - readonly array
      expect(Array.isArray(levels)).toBe(true);
    });
  });

  describe('calculateDifficultyScore', () => {
    it('should return base score for easy difficulty', () => {
      const baseScore = 100;
      const result = calculateDifficultyScore(baseScore, 'easy');
      expect(result).toBe(100); // Multiplier 1.0
    });

    it('should apply 1.5x multiplier for normal difficulty', () => {
      const baseScore = 100;
      const result = calculateDifficultyScore(baseScore, 'normal');
      expect(result).toBe(150); // Multiplier 1.5
    });

    it('should apply 2x multiplier for hard difficulty', () => {
      const baseScore = 100;
      const result = calculateDifficultyScore(baseScore, 'hard');
      expect(result).toBe(200); // Multiplier 2.0
    });

    it('should round to nearest integer', () => {
      const baseScore = 33;
      const normalResult = calculateDifficultyScore(baseScore, 'normal');
      // 33 * 1.5 = 49.5, rounded = 50
      expect(normalResult).toBe(50);
    });

    it('should handle zero score', () => {
      expect(calculateDifficultyScore(0, 'easy')).toBe(0);
      expect(calculateDifficultyScore(0, 'normal')).toBe(0);
      expect(calculateDifficultyScore(0, 'hard')).toBe(0);
    });

    it('should handle large scores', () => {
      const largeScore = 10000;
      expect(calculateDifficultyScore(largeScore, 'hard')).toBe(20000);
    });
  });
});
