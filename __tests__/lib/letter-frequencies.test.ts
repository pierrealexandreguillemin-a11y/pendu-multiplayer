import { describe, it, expect } from 'vitest';
import { LETTER_RARITY_SCORES, getLetterRarityScore } from '@/lib/letter-frequencies';

describe('letter-frequencies', () => {
  describe('LETTER_RARITY_SCORES', () => {
    it('should have scores for all 26 letters', () => {
      expect(Object.keys(LETTER_RARITY_SCORES)).toHaveLength(26);
      for (let i = 65; i <= 90; i++) {
        expect(LETTER_RARITY_SCORES[String.fromCharCode(i)]).toBeDefined();
      }
    });

    it('should have all scores between 0 and 1', () => {
      for (const [letter, score] of Object.entries(LETTER_RARITY_SCORES)) {
        expect(score, `${letter} score out of range`).toBeGreaterThanOrEqual(0);
        expect(score, `${letter} score out of range`).toBeLessThanOrEqual(1);
      }
    });

    it('should have E as most common (lowest rarity)', () => {
      const minEntry = Object.entries(LETTER_RARITY_SCORES).reduce(
        (min, [k, v]) => (v < min[1] ? [k, v] : min),
        ['', 1]
      );
      expect(minEntry[0]).toBe('E');
      expect(LETTER_RARITY_SCORES.E).toBeLessThan(0.1);
    });

    it('should have rare letters with high scores', () => {
      expect(LETTER_RARITY_SCORES.W).toBeGreaterThan(0.9);
      expect(LETTER_RARITY_SCORES.K).toBeGreaterThan(0.9);
      expect(LETTER_RARITY_SCORES.X).toBeGreaterThan(0.8);
      expect(LETTER_RARITY_SCORES.Z).toBeGreaterThan(0.8);
      expect(LETTER_RARITY_SCORES.Q).toBeGreaterThan(0.8);
    });

    it('should have common letters ordered correctly', () => {
      expect(LETTER_RARITY_SCORES.E).toBeLessThan(LETTER_RARITY_SCORES.A!);
      expect(LETTER_RARITY_SCORES.A).toBeLessThan(LETTER_RARITY_SCORES.S!);
    });
  });

  describe('getLetterRarityScore', () => {
    it('should return rarity for uppercase letters', () => {
      expect(getLetterRarityScore('E')).toBeLessThan(0.1);
      expect(getLetterRarityScore('W')).toBeGreaterThan(0.9);
    });

    it('should return rarity for lowercase letters (case-insensitive)', () => {
      expect(getLetterRarityScore('e')).toBe(getLetterRarityScore('E'));
      expect(getLetterRarityScore('w')).toBe(getLetterRarityScore('W'));
    });

    it('should return 1 for non-letter characters', () => {
      expect(getLetterRarityScore('-')).toBe(1);
      expect(getLetterRarityScore(' ')).toBe(1);
      expect(getLetterRarityScore('1')).toBe(1);
      expect(getLetterRarityScore('é')).toBe(1);
    });

    it('should return 1 for empty string', () => {
      expect(getLetterRarityScore('')).toBe(1);
    });
  });
});
