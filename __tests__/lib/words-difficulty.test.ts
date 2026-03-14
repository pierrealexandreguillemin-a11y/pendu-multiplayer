import { describe, it, expect } from 'vitest';
import {
  CLASSIFIED_WORDS,
  getWordsByDifficulty,
  getRandomWordByDifficulty,
  getDifficultyStats,
  hasWordsForDifficulty,
  getScoreBreakdown,
} from '@/lib/words-difficulty';
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

  describe('getScoreBreakdown', () => {
    it('should return breakdown with all criteria', () => {
      const b = getScoreBreakdown('pomme');
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
      expect(getScoreBreakdown('kiwi').total).toBeGreaterThan(getScoreBreakdown('pomme').total);
    });
  });
});
