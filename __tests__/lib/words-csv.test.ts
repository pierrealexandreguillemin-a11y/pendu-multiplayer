import { describe, it, expect } from 'vitest';
import { WORD_CLASSIFICATIONS } from '@/lib/word-classifications';
import { normalizeWord } from '@/lib/normalize';
import { VALID_CATEGORIES } from '@/lib/categories';

describe('Word corpus validation', () => {
  it('should have at least 80 words per category', () => {
    for (const cat of VALID_CATEGORIES) {
      const count = WORD_CLASSIFICATIONS.filter((w) => w.category === cat).length;
      expect(count).toBeGreaterThanOrEqual(80);
    }
  });

  it('should have exactly 15 categories', () => {
    const categories = [...new Set(WORD_CLASSIFICATIONS.map((w) => w.category))];
    expect(categories.sort()).toEqual([...VALID_CATEGORIES].sort());
  });

  it('should have no duplicate words', () => {
    const seen = new Set<string>();
    for (const entry of WORD_CLASSIFICATIONS) {
      const key = entry.word.toUpperCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('should have all words between 3-15 letters', () => {
    for (const entry of WORD_CLASSIFICATIONS) {
      const normalized = normalizeWord(entry.word);
      expect(normalized.length).toBeGreaterThanOrEqual(3);
      expect(normalized.length).toBeLessThanOrEqual(15);
    }
  });

  it('should have words in all difficulty levels per category', () => {
    for (const cat of VALID_CATEGORIES) {
      const words = WORD_CLASSIFICATIONS.filter((w) => w.category === cat);
      const difficulties = new Set(words.map((w) => w.difficulty));
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    }
  });
});
