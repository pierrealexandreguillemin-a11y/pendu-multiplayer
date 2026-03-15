/**
 * Word Difficulty Classification - Domain Layer
 *
 * Consumes pre-computed word classifications from the generation script.
 * Zero computation at runtime.
 */

import type { DifficultyLevel } from '@/types/difficulty';
import type { WordEntry } from '@/types/word';
import type { WordCategory } from './categories';
import { WORD_CLASSIFICATIONS, type ClassifiedWordEntry } from './word-classifications';

export interface ClassifiedWord extends WordEntry {
  difficulty: DifficultyLevel;
  letterCount: number;
}

export const CLASSIFIED_WORDS: ClassifiedWord[] = WORD_CLASSIFICATIONS.map(
  (entry: ClassifiedWordEntry) => ({
    word: entry.word,
    category: entry.category,
    difficulty: entry.difficulty,
    letterCount: entry.letterCount,
  })
);

export function getWordsByDifficulty(
  difficulty: DifficultyLevel,
  category?: WordCategory | null
): ClassifiedWord[] {
  let words = CLASSIFIED_WORDS.filter((w) => w.difficulty === difficulty);
  if (category) {
    words = words.filter((w) => w.category === category);
  }
  return words;
}

export function getRandomWordByDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>,
  category?: WordCategory | null
): WordEntry | null {
  let candidates = getWordsByDifficulty(difficulty, category);
  if (usedWords && usedWords.size > 0) {
    candidates = candidates.filter((w) => !usedWords.has(w.word.toUpperCase()));
  }
  if (candidates.length === 0) return null;
  const index = Math.floor(Math.random() * candidates.length);
  const selected = candidates[index];
  return selected ? { word: selected.word, category: selected.category } : null;
}

export function getDifficultyStats(): Record<
  DifficultyLevel,
  { count: number; avgLength: number; examples: string[] }
> {
  const levels: DifficultyLevel[] = ['easy', 'normal', 'hard'];
  const stats = Object.fromEntries(
    levels.map((level) => {
      const words = getWordsByDifficulty(level);
      const totalLength = words.reduce((sum, w) => sum + w.letterCount, 0);
      return [
        level,
        {
          count: words.length,
          avgLength: words.length > 0 ? Math.round(totalLength / words.length) : 0,
          examples: words.slice(0, 3).map((w) => w.word),
        },
      ];
    })
  ) as Record<DifficultyLevel, { count: number; avgLength: number; examples: string[] }>;
  return stats;
}

export function hasWordsForDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>,
  category?: WordCategory | null
): boolean {
  const candidates = getWordsByDifficulty(difficulty, category);
  if (!usedWords || usedWords.size === 0) return candidates.length > 0;
  return candidates.some((w) => !usedWords.has(w.word.toUpperCase()));
}
