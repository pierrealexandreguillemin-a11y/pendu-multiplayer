import { describe, it, expect } from 'vitest';
import { COMMON_BIGRAMS_FR, isBigramCommon } from '@/lib/bigram-frequencies';

describe('bigram-frequencies', () => {
  describe('COMMON_BIGRAMS_FR', () => {
    it('should contain at least 30 bigrams', () => {
      expect(COMMON_BIGRAMS_FR.size).toBeGreaterThanOrEqual(30);
    });

    it('should contain well-known French bigrams', () => {
      expect(COMMON_BIGRAMS_FR.has('ES')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('EN')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('OU')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('AN')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('RE')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('AI')).toBe(true);
    });

    it('should not contain rare bigrams', () => {
      expect(COMMON_BIGRAMS_FR.has('KW')).toBe(false);
      expect(COMMON_BIGRAMS_FR.has('ZX')).toBe(false);
    });
  });

  describe('isBigramCommon', () => {
    it('should be case-insensitive', () => {
      expect(isBigramCommon('es')).toBe(true);
      expect(isBigramCommon('ES')).toBe(true);
      expect(isBigramCommon('Es')).toBe(true);
    });

    it('should return false for rare bigrams', () => {
      expect(isBigramCommon('kw')).toBe(false);
    });
  });
});
