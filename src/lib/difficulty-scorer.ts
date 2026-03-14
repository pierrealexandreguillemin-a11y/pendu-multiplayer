/**
 * Difficulty Score Computation
 *
 * Pure functions for computing composite difficulty scores.
 * 6 weighted criteria:
 * 1. Letter rarity (30%)
 * 2. Unique letters (20%)
 * 3. Word frequency (15%)
 * 4. Consonant ratio (15%)
 * 5. Length (10%)
 * 6. Bigram rarity (10%)
 */

import type { DifficultyLevel, DifficultyScoreBreakdown } from '@/types/difficulty';
import { getLetterRarityScore } from './letter-frequencies';
import { isBigramCommon } from './bigram-frequencies';
import { getWordFrequencyScore } from './word-frequencies';
import { DIFFICULTY_CONFIGS } from './difficulty-config';
import { normalizeWord as _normalizeWord } from './normalize';

export { normalizeWord } from './normalize';

const WEIGHTS = {
  letterRarity: 0.3,
  uniqueLetters: 0.2,
  wordFrequency: 0.15,
  consonantRatio: 0.15,
  length: 0.1,
  bigramRarity: 0.1,
} as const;

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const MIN_LENGTH = 3;
const MAX_LENGTH = 15;

export function computeDifficultyScore(word: string): DifficultyScoreBreakdown {
  const normalized = _normalizeWord(word);
  const letters = [...normalized];
  const wordLength = letters.length;
  const uniqueLettersSet = new Set(letters);

  // 1. Letter rarity (30%) — mean rarity of unique letters
  const raritySum = [...uniqueLettersSet].reduce((sum, l) => sum + getLetterRarityScore(l), 0);
  const letterRarity = uniqueLettersSet.size > 0 ? raritySum / uniqueLettersSet.size : 0;

  // 2. Unique letters ratio (20%)
  const uniqueLetters = wordLength > 0 ? uniqueLettersSet.size / wordLength : 0;

  // 3. Word frequency (15%)
  const wordFrequency = getWordFrequencyScore(word);

  // 4. Consonant ratio (15%)
  const vowelCount = letters.filter((l) => VOWELS.has(l)).length;
  const consonantRatio = wordLength > 0 ? 1 - vowelCount / wordLength : 0;

  // 5. Length (10%)
  const lengthScore = Math.min(
    1,
    Math.max(0, (wordLength - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH))
  );

  // 6. Bigram rarity (10%)
  const bigrams: string[] = [];
  for (let i = 0; i < letters.length - 1; i++) {
    bigrams.push(letters[i]! + letters[i + 1]!);
  }
  const uncommonCount = bigrams.filter((b) => !isBigramCommon(b)).length;
  const bigramRarity = bigrams.length > 0 ? uncommonCount / bigrams.length : 0;

  // Weighted sum
  const rawScore =
    letterRarity * WEIGHTS.letterRarity +
    uniqueLetters * WEIGHTS.uniqueLetters +
    wordFrequency * WEIGHTS.wordFrequency +
    consonantRatio * WEIGHTS.consonantRatio +
    lengthScore * WEIGHTS.length +
    bigramRarity * WEIGHTS.bigramRarity;

  const total = Math.round(rawScore * 100);

  let level: DifficultyLevel = 'hard';
  if (total <= DIFFICULTY_CONFIGS.easy.scoreThreshold) {
    level = 'easy';
  } else if (total <= DIFFICULTY_CONFIGS.normal.scoreThreshold) {
    level = 'normal';
  }

  return {
    letterRarity,
    uniqueLetters,
    wordFrequency,
    consonantRatio,
    length: lengthScore,
    bigramRarity,
    total,
    level,
  };
}
