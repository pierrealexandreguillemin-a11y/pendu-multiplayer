/**
 * Words Difficulty Classification Tests
 * ISO/IEC 29119 - Test Cases for word classification
 */

import { describe, it, expect } from 'vitest';
import {
  classifyWord,
  CLASSIFIED_WORDS,
  getWordsByDifficulty,
  getRandomWordByDifficulty,
  getDifficultyStats,
  hasWordsForDifficulty,
} from '@/lib/words-difficulty';
import type { DifficultyLevel } from '@/types/difficulty';

describe('words-difficulty', () => {
  describe('classifyWord', () => {
    it('should classify short words as easy (3-6 letters)', () => {
      expect(classifyWord('CHAT')).toBe('easy'); // 4 letters
      expect(classifyWord('SOLEIL')).toBe('easy'); // 6 letters
      expect(classifyWord('EAU')).toBe('easy'); // 3 letters
    });

    it('should classify medium words as normal (7-8 letters)', () => {
      expect(classifyWord('COURAGE')).toBe('normal'); // 7 letters
      expect(classifyWord('MONTAGNE')).toBe('normal'); // 8 letters
    });

    it('should classify long words as hard (9+ letters)', () => {
      expect(classifyWord('BIBLIOTHEQUE')).toBe('hard'); // 12 letters
      expect(classifyWord('EXTRAORDINAIRE')).toBe('hard'); // 14 letters
    });

    it('should handle accented characters', () => {
      // "Éléphant" has 8 letters when accents removed
      expect(classifyWord('ÉLÉPHANT')).toBe('normal');
    });

    it('should ignore spaces and hyphens', () => {
      // "Peut-être" = "Peutetre" = 8 letters
      expect(classifyWord('PEUT-ÊTRE')).toBe('normal');
      // "Arc en ciel" = "Arcenciel" = 9 letters
      expect(classifyWord('ARC EN CIEL')).toBe('hard');
    });
  });

  describe('CLASSIFIED_WORDS', () => {
    it('should have all words classified', () => {
      expect(CLASSIFIED_WORDS.length).toBeGreaterThan(0);

      for (const word of CLASSIFIED_WORDS) {
        expect(word.word).toBeDefined();
        expect(word.category).toBeDefined();
        expect(word.difficulty).toBeDefined();
        expect(word.letterCount).toBeGreaterThan(0);
        expect(['easy', 'normal', 'hard']).toContain(word.difficulty);
      }
    });

    it('should have consistent letterCount', () => {
      for (const word of CLASSIFIED_WORDS.slice(0, 20)) {
        // Verify letterCount is accurate
        const expectedCount = word.word
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Za-z]/g, '').length;

        expect(word.letterCount).toBe(expectedCount);
      }
    });
  });

  describe('getWordsByDifficulty', () => {
    it('should return only words of specified difficulty', () => {
      const easyWords = getWordsByDifficulty('easy');
      const normalWords = getWordsByDifficulty('normal');
      const hardWords = getWordsByDifficulty('hard');

      expect(easyWords.every((w) => w.difficulty === 'easy')).toBe(true);
      expect(normalWords.every((w) => w.difficulty === 'normal')).toBe(true);
      expect(hardWords.every((w) => w.difficulty === 'hard')).toBe(true);
    });

    it('should return non-empty arrays for each difficulty', () => {
      expect(getWordsByDifficulty('easy').length).toBeGreaterThan(0);
      expect(getWordsByDifficulty('normal').length).toBeGreaterThan(0);
      expect(getWordsByDifficulty('hard').length).toBeGreaterThan(0);
    });

    it('should sum to total word count', () => {
      const easyCount = getWordsByDifficulty('easy').length;
      const normalCount = getWordsByDifficulty('normal').length;
      const hardCount = getWordsByDifficulty('hard').length;

      expect(easyCount + normalCount + hardCount).toBe(CLASSIFIED_WORDS.length);
    });
  });

  describe('getRandomWordByDifficulty', () => {
    it('should return word of correct difficulty', () => {
      const levels: DifficultyLevel[] = ['easy', 'normal', 'hard'];

      for (const level of levels) {
        const word = getRandomWordByDifficulty(level);
        expect(word).not.toBeNull();
        expect(word?.word).toBeDefined();
        expect(word?.category).toBeDefined();
      }
    });

    it('should exclude used words', () => {
      const usedWords = new Set<string>();

      // Get a word first
      const firstWord = getRandomWordByDifficulty('easy');
      expect(firstWord).not.toBeNull();

      // Mark it as used
      usedWords.add(firstWord!.word.toUpperCase());

      // Get 50 more words and verify first word is never returned
      for (let i = 0; i < 50; i++) {
        const word = getRandomWordByDifficulty('easy', usedWords);
        if (word) {
          expect(word.word.toUpperCase()).not.toBe(firstWord!.word.toUpperCase());
        }
      }
    });

    it('should return null when all words are used', () => {
      // Get all easy words and mark them as used
      const easyWords = getWordsByDifficulty('easy');
      const usedWords = new Set<string>(easyWords.map((w) => w.word.toUpperCase()));

      const result = getRandomWordByDifficulty('easy', usedWords);
      expect(result).toBeNull();
    });

    it('should handle empty usedWords set', () => {
      const result = getRandomWordByDifficulty('normal', new Set());
      expect(result).not.toBeNull();
    });

    it('should return different words (randomness)', () => {
      const words = new Set<string>();

      for (let i = 0; i < 20; i++) {
        const word = getRandomWordByDifficulty('easy');
        if (word) {
          words.add(word.word);
        }
      }

      // Should have at least some variety (probabilistic test)
      expect(words.size).toBeGreaterThan(1);
    });
  });

  describe('getDifficultyStats', () => {
    it('should return stats for all difficulties', () => {
      const stats = getDifficultyStats();

      expect(stats.easy).toBeDefined();
      expect(stats.normal).toBeDefined();
      expect(stats.hard).toBeDefined();
    });

    it('should have valid counts', () => {
      const stats = getDifficultyStats();

      expect(stats.easy.count).toBeGreaterThan(0);
      expect(stats.normal.count).toBeGreaterThan(0);
      expect(stats.hard.count).toBeGreaterThan(0);

      const totalCount = stats.easy.count + stats.normal.count + stats.hard.count;
      expect(totalCount).toBe(CLASSIFIED_WORDS.length);
    });

    it('should have increasing avgLength by difficulty', () => {
      const stats = getDifficultyStats();

      expect(stats.easy.avgLength).toBeLessThan(stats.normal.avgLength);
      expect(stats.normal.avgLength).toBeLessThan(stats.hard.avgLength);
    });

    it('should have up to 3 examples per difficulty', () => {
      const stats = getDifficultyStats();

      expect(stats.easy.examples.length).toBeLessThanOrEqual(3);
      expect(stats.normal.examples.length).toBeLessThanOrEqual(3);
      expect(stats.hard.examples.length).toBeLessThanOrEqual(3);
    });
  });

  describe('hasWordsForDifficulty', () => {
    it('should return true when words are available', () => {
      expect(hasWordsForDifficulty('easy')).toBe(true);
      expect(hasWordsForDifficulty('normal')).toBe(true);
      expect(hasWordsForDifficulty('hard')).toBe(true);
    });

    it('should return true with empty usedWords', () => {
      expect(hasWordsForDifficulty('easy', new Set())).toBe(true);
    });

    it('should return false when all words of difficulty are used', () => {
      const easyWords = getWordsByDifficulty('easy');
      const usedWords = new Set(easyWords.map((w) => w.word.toUpperCase()));

      expect(hasWordsForDifficulty('easy', usedWords)).toBe(false);
    });

    it('should return true when some words remain', () => {
      const easyWords = getWordsByDifficulty('easy');
      // Use all but one
      const usedWords = new Set(easyWords.slice(0, -1).map((w) => w.word.toUpperCase()));

      expect(hasWordsForDifficulty('easy', usedWords)).toBe(true);
    });
  });
});
