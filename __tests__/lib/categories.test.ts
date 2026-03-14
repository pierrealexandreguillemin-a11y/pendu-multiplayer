import { describe, it, expect } from 'vitest';
import { VALID_CATEGORIES } from '@/lib/categories';
import type { WordCategory } from '@/lib/categories';

describe('VALID_CATEGORIES', () => {
  it('exports a non-empty readonly array', () => {
    expect(Array.isArray(VALID_CATEGORIES)).toBe(true);
    expect(VALID_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('contains exactly 15 entries', () => {
    expect(VALID_CATEGORIES).toHaveLength(15);
  });

  it('contains all expected categories', () => {
    const expected = [
      'Animal',
      'Nourriture',
      'Métier',
      'Sport',
      'Géographie',
      'Nature',
      'Science',
      'Musique',
      'Véhicule',
      'Vêtement',
      'Corps humain',
      'Art',
      'Histoire',
      'Maison',
      'Technologie',
    ];
    for (const cat of expected) {
      expect(VALID_CATEGORIES).toContain(cat);
    }
  });

  it('WordCategory type is usable for a valid category', () => {
    const cat: WordCategory = 'Animal';
    expect(cat).toBe('Animal');
  });
});
