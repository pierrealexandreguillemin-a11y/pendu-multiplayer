/**
 * Word Difficulty Classification - Domain Layer
 * Classifies words by difficulty based on length
 *
 * ISO/IEC 25010 - Maintainability: Pure functions
 * ISO/IEC 5055 - Code Quality: Single responsibility
 *
 * Classification strategy:
 * - Easy: 3-6 letters (short, common words)
 * - Normal: 5-8 letters (medium length)
 * - Hard: 7+ letters (long, complex words)
 */

import type { DifficultyLevel } from '@/types/difficulty';
import type { WordEntry } from './words';
import { WORDS } from './words';
import { DIFFICULTY_CONFIGS } from './difficulty-config';

/**
 * Extended word entry with difficulty classification
 */
export interface ClassifiedWord extends WordEntry {
  difficulty: DifficultyLevel;
  letterCount: number;
}

/**
 * Normalize word and count letters (excluding spaces, hyphens, accents)
 */
function countLetters(word: string): number {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Za-z]/g, '').length; // Keep only letters
}

/**
 * Classify a word by difficulty based on letter count
 */
export function classifyWord(word: string): DifficultyLevel {
  const length = countLetters(word);

  // Use configured ranges
  const easyConfig = DIFFICULTY_CONFIGS.easy;
  const normalConfig = DIFFICULTY_CONFIGS.normal;

  if (length <= easyConfig.wordLengthRange[1]) {
    return 'easy';
  } else if (length <= normalConfig.wordLengthRange[1]) {
    return 'normal';
  } else {
    return 'hard';
  }
}

/**
 * Pre-classified word list
 */
export const CLASSIFIED_WORDS: ClassifiedWord[] = WORDS.map((entry) => ({
  ...entry,
  difficulty: classifyWord(entry.word),
  letterCount: countLetters(entry.word),
}));

/**
 * Get words filtered by difficulty
 */
export function getWordsByDifficulty(difficulty: DifficultyLevel): ClassifiedWord[] {
  return CLASSIFIED_WORDS.filter((w) => w.difficulty === difficulty);
}

/**
 * Get random word for a specific difficulty level
 *
 * @param difficulty - Target difficulty level
 * @param usedWords - Optional set of words to exclude
 * @returns WordEntry or null if none available
 */
export function getRandomWordByDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>
): WordEntry | null {
  let candidates = getWordsByDifficulty(difficulty);

  // Exclude used words if provided
  if (usedWords && usedWords.size > 0) {
    candidates = candidates.filter((w) => !usedWords.has(w.word.toUpperCase()));
  }

  if (candidates.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * candidates.length);
  const selected = candidates[index];

  return selected ? { word: selected.word, category: selected.category } : null;
}

/**
 * Get statistics about word distribution by difficulty
 */
export function getDifficultyStats(): Record<
  DifficultyLevel,
  { count: number; avgLength: number; examples: string[] }
> {
  const stats: Record<DifficultyLevel, { count: number; totalLength: number; words: string[] }> = {
    easy: { count: 0, totalLength: 0, words: [] },
    normal: { count: 0, totalLength: 0, words: [] },
    hard: { count: 0, totalLength: 0, words: [] },
  };

  for (const word of CLASSIFIED_WORDS) {
    const stat = stats[word.difficulty];
    stat.count++;
    stat.totalLength += word.letterCount;
    if (stat.words.length < 3) {
      stat.words.push(word.word);
    }
  }

  return {
    easy: {
      count: stats.easy.count,
      avgLength: stats.easy.count > 0 ? Math.round(stats.easy.totalLength / stats.easy.count) : 0,
      examples: stats.easy.words,
    },
    normal: {
      count: stats.normal.count,
      avgLength:
        stats.normal.count > 0 ? Math.round(stats.normal.totalLength / stats.normal.count) : 0,
      examples: stats.normal.words,
    },
    hard: {
      count: stats.hard.count,
      avgLength: stats.hard.count > 0 ? Math.round(stats.hard.totalLength / stats.hard.count) : 0,
      examples: stats.hard.words,
    },
  };
}

/**
 * Check if words are available for a difficulty level
 */
export function hasWordsForDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>
): boolean {
  const candidates = getWordsByDifficulty(difficulty);

  if (!usedWords || usedWords.size === 0) {
    return candidates.length > 0;
  }

  return candidates.some((w) => !usedWords.has(w.word.toUpperCase()));
}
