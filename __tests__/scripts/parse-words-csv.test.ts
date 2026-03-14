import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseWordsCsv } from '../../scripts/parse-words-csv';
import { VALID_CATEGORIES } from '@/lib/categories';

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('parseWordsCsv', () => {
  it('parses data/words.csv successfully and returns a non-empty array', () => {
    const entries = parseWordsCsv(PROJECT_ROOT);
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
  });

  it('each entry has non-empty word and category strings', () => {
    const entries = parseWordsCsv(PROJECT_ROOT);
    for (const entry of entries) {
      expect(typeof entry.word).toBe('string');
      expect(entry.word.trim().length).toBeGreaterThan(0);
      expect(typeof entry.category).toBe('string');
      expect(entry.category.trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate words (case-insensitive)', () => {
    const entries = parseWordsCsv(PROJECT_ROOT);
    const seen = new Set<string>();
    for (const entry of entries) {
      const key = entry.word.toUpperCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('with validCategories filter: all returned categories are in the allowed list', () => {
    const entries = parseWordsCsv(PROJECT_ROOT, VALID_CATEGORIES);
    for (const entry of entries) {
      expect(VALID_CATEGORIES).toContain(entry.category);
    }
  });
});
