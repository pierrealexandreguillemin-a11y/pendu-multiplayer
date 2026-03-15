import { describe, it, expect } from 'vitest';
import { normalizeWord } from '@/lib/normalize';
import {
  CLASSIFIED_WORDS,
  getWordsByDifficulty,
  getRandomWordByDifficulty,
  getDifficultyStats,
  hasWordsForDifficulty,
  getWordCountByCategory,
} from '@/lib/words-difficulty';
import { VALID_CATEGORIES } from '@/lib/categories';
import { computeDifficultyScore } from '@/lib/difficulty-scorer';
import type { DifficultyLevel } from '@/types/difficulty';

describe('words-difficulty', () => {
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
        const expectedCount = normalizeWord(word.word).length;
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

    it('should filter by category when provided', () => {
      const animals = getWordsByDifficulty('easy', 'Animal');
      expect(animals.length).toBeGreaterThan(0);
      expect(animals.every((w) => w.category === 'Animal')).toBe(true);
    });

    it('should return all categories when category is null', () => {
      const all = getWordsByDifficulty('easy', null);
      const categories = new Set(all.map((w) => w.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('should return all categories when category is undefined', () => {
      const all = getWordsByDifficulty('easy');
      const withNull = getWordsByDifficulty('easy', null);
      expect(all.length).toBe(withNull.length);
    });

    it('should return non-empty arrays for each difficulty', () => {
      expect(getWordsByDifficulty('easy').length).toBeGreaterThan(0);
      expect(getWordsByDifficulty('normal').length).toBeGreaterThan(0);
      expect(getWordsByDifficulty('hard').length).toBeGreaterThan(0);
    });

    it('should sum to total word count', () => {
      const total =
        getWordsByDifficulty('easy').length +
        getWordsByDifficulty('normal').length +
        getWordsByDifficulty('hard').length;
      expect(total).toBe(CLASSIFIED_WORDS.length);
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
      const firstWord = getRandomWordByDifficulty('easy');
      expect(firstWord).not.toBeNull();
      usedWords.add(firstWord!.word.toUpperCase());
      for (let i = 0; i < 50; i++) {
        const word = getRandomWordByDifficulty('easy', usedWords);
        if (word) expect(word.word.toUpperCase()).not.toBe(firstWord!.word.toUpperCase());
      }
    });

    it('should return null when all words are used', () => {
      const easyWords = getWordsByDifficulty('easy');
      const usedWords = new Set<string>(easyWords.map((w) => w.word.toUpperCase()));
      expect(getRandomWordByDifficulty('easy', usedWords)).toBeNull();
    });

    it('should handle empty usedWords set', () => {
      expect(getRandomWordByDifficulty('normal', new Set())).not.toBeNull();
    });

    it('should return different words (randomness)', () => {
      const words = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const word = getRandomWordByDifficulty('easy');
        if (word) words.add(word.word);
      }
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
      const total = stats.easy.count + stats.normal.count + stats.hard.count;
      expect(total).toBe(CLASSIFIED_WORDS.length);
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
      const usedWords = new Set(easyWords.slice(0, -1).map((w) => w.word.toUpperCase()));
      expect(hasWordsForDifficulty('easy', usedWords)).toBe(true);
    });
  });

  describe('getRandomWordByDifficulty with category', () => {
    it('should return word from specified category', () => {
      const word = getRandomWordByDifficulty('normal', new Set(), 'Sport');
      expect(word).not.toBeNull();
      expect(word!.category).toBe('Sport');
    });

    it('should return any word when category is null', () => {
      const word = getRandomWordByDifficulty('normal', new Set(), null);
      expect(word).not.toBeNull();
    });

    it('should be backward compatible without category', () => {
      const word = getRandomWordByDifficulty('easy');
      expect(word).not.toBeNull();
    });
  });

  describe('hasWordsForDifficulty with category', () => {
    it('should return true for populated category', () => {
      expect(hasWordsForDifficulty('easy', new Set(), 'Animal')).toBe(true);
    });

    it('should be backward compatible without category', () => {
      expect(hasWordsForDifficulty('easy')).toBe(true);
    });
  });

  describe('getWordCountByCategory', () => {
    it('should return counts for all 15 categories', () => {
      const counts = getWordCountByCategory();
      expect(Object.keys(counts).length).toBe(15);
      for (const cat of VALID_CATEGORIES) {
        expect(counts[cat]).toBeGreaterThan(0);
      }
    });

    it('should return filtered counts when difficulty provided', () => {
      const allCounts = getWordCountByCategory();
      const easyCounts = getWordCountByCategory('easy');
      for (const cat of VALID_CATEGORIES) {
        expect(easyCounts[cat]).toBeLessThanOrEqual(allCounts[cat]);
      }
    });

    it('should have total matching CLASSIFIED_WORDS length', () => {
      const counts = getWordCountByCategory();
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      expect(total).toBe(CLASSIFIED_WORDS.length);
    });
  });

  describe('computeDifficultyScore (via difficulty-scorer)', () => {
    it('should return breakdown with all criteria', () => {
      const b = computeDifficultyScore('pomme');
      expect(b.letterRarity).toBeGreaterThanOrEqual(0);
      expect(b.letterRarity).toBeLessThanOrEqual(1);
      expect(b.uniqueLetters).toBeGreaterThanOrEqual(0);
      expect(b.uniqueLetters).toBeLessThanOrEqual(1);
      expect(b.wordFrequency).toBeGreaterThanOrEqual(0);
      expect(b.wordFrequency).toBeLessThanOrEqual(1);
      expect(b.consonantRatio).toBeGreaterThanOrEqual(0);
      expect(b.consonantRatio).toBeLessThanOrEqual(1);
      expect(b.length).toBeGreaterThanOrEqual(0);
      expect(b.length).toBeLessThanOrEqual(1);
      expect(b.bigramRarity).toBeGreaterThanOrEqual(0);
      expect(b.bigramRarity).toBeLessThanOrEqual(1);
      expect(b.total).toBeGreaterThanOrEqual(0);
      expect(b.total).toBeLessThanOrEqual(100);
      expect(['easy', 'normal', 'hard']).toContain(b.level);
    });

    it('should score kiwi harder than pomme', () => {
      expect(computeDifficultyScore('kiwi').total).toBeGreaterThan(
        computeDifficultyScore('pomme').total
      );
    });
  });
});
