/**
 * Word Difficulty Classification - Domain Layer
 *
 * Consumes pre-computed word classifications from the generation script.
 * Zero computation at runtime.
 */

import type { DifficultyLevel, DifficultyScoreBreakdown } from '@/types/difficulty';
import type { WordEntry } from './words';
import { WORD_CLASSIFICATIONS, type ClassifiedWordEntry } from './word-classifications';
import { computeDifficultyScore } from './difficulty-scorer';

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

export function getWordsByDifficulty(difficulty: DifficultyLevel): ClassifiedWord[] {
  return CLASSIFIED_WORDS.filter((w) => w.difficulty === difficulty);
}

export function getRandomWordByDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>
): WordEntry | null {
  let candidates = getWordsByDifficulty(difficulty);
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
  const stats: Record<DifficultyLevel, { count: number; totalLength: number; words: string[] }> = {
    easy: { count: 0, totalLength: 0, words: [] },
    normal: { count: 0, totalLength: 0, words: [] },
    hard: { count: 0, totalLength: 0, words: [] },
  };
  for (const word of CLASSIFIED_WORDS) {
    const stat = stats[word.difficulty];
    stat.count++;
    stat.totalLength += word.letterCount;
    if (stat.words.length < 3) stat.words.push(word.word);
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

export function hasWordsForDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>
): boolean {
  const candidates = getWordsByDifficulty(difficulty);
  if (!usedWords || usedWords.size === 0) return candidates.length > 0;
  return candidates.some((w) => !usedWords.has(w.word.toUpperCase()));
}

export function getScoreBreakdown(word: string): DifficultyScoreBreakdown {
  return computeDifficultyScore(word);
}
