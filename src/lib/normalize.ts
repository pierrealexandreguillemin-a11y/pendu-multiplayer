/**
 * Word normalization utilities for French text.
 * Single source of truth for accent stripping and case normalization.
 */

/**
 * Strip accents from a string using NFD decomposition.
 */
export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize a word for scoring: strip accents, remove non-alpha, uppercase.
 */
export function normalizeWord(word: string): string {
  return stripAccents(word)
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

/**
 * Normalize a word for frequency lookup: strip accents, lowercase.
 */
export function normalizeForLookup(word: string): string {
  return stripAccents(word).toLowerCase();
}
