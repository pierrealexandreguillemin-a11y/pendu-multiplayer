/**
 * French Letter Rarity Scores
 *
 * Rarity score from 0 (very common) to 1 (very rare).
 * Based on letter frequency analysis of French text corpora.
 * Source: French language letter frequency data
 * (E ~17.4%, A ~8.2%, S ~8.1%, ... W ~0.04%, K ~0.05%)
 */

/** Rarity scores per letter (0 = very common, 1 = very rare) */
export const LETTER_RARITY_SCORES: Record<string, number> = {
  E: 0.0,
  A: 0.04,
  S: 0.05,
  I: 0.08,
  N: 0.08,
  T: 0.08,
  R: 0.1,
  L: 0.25,
  O: 0.3,
  U: 0.3,
  D: 0.32,
  C: 0.33,
  P: 0.35,
  M: 0.55,
  V: 0.6,
  G: 0.62,
  F: 0.65,
  B: 0.67,
  H: 0.7,
  Q: 0.85,
  J: 0.88,
  X: 0.9,
  Y: 0.92,
  Z: 0.93,
  K: 0.96,
  W: 0.98,
};

/**
 * Get rarity score for a letter (case-insensitive).
 * Returns 1 (max rarity) for unknown characters.
 */
export function getLetterRarityScore(letter: string): number {
  return LETTER_RARITY_SCORES[letter.toUpperCase()] ?? 1;
}
