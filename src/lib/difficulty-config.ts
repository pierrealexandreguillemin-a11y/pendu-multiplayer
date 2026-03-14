/**
 * Difficulty Configuration - Domain Layer
 * Immutable configurations for each difficulty level
 *
 * ISO/IEC 25010 - Maintainability: Centralized configuration
 * ISO/IEC 5055 - Code Quality: Immutable data structures
 *
 * Industry standard: Based on casual game design best practices
 * @see https://gamedesignskills.com/game-design/casual/
 */

import type { DifficultyLevel, DifficultyConfig } from '@/types/difficulty';

/**
 * Difficulty configurations
 *
 * Easy: For beginners and casual players
 * - More attempts (10 errors)
 * - Category hint visible
 * - Score ≤ 42
 *
 * Normal: Standard gameplay
 * - Standard attempts (7 errors)
 * - Category hint visible
 * - Score ≤ 50
 *
 * Hard: For experienced players
 * - Fewer attempts (5 errors)
 * - No category hint
 * - Score ≤ 100
 */
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    maxErrors: 10,
    showCategory: true,
    scoreThresholds: 42,
    scoreMultiplier: 1,
    label: 'Facile',
    description: '10 essais, mots faciles, catégorie visible',
  },
  normal: {
    level: 'normal',
    maxErrors: 7,
    showCategory: true,
    scoreThresholds: 50,
    scoreMultiplier: 1.5,
    label: 'Normal',
    description: '7 essais, mots intermédiaires, catégorie visible',
  },
  hard: {
    level: 'hard',
    maxErrors: 5,
    showCategory: false,
    scoreThresholds: 100,
    scoreMultiplier: 2,
    label: 'Difficile',
    description: '5 essais, mots difficiles, catégorie cachée',
  },
} as const;

/**
 * Get configuration for a difficulty level
 */
export function getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
  return DIFFICULTY_CONFIGS[level];
}

/**
 * Get default difficulty level
 */
export function getDefaultDifficulty(): DifficultyLevel {
  return 'normal';
}

/**
 * Get all difficulty levels in order
 */
export function getAllDifficultyLevels(): readonly DifficultyLevel[] {
  return ['easy', 'normal', 'hard'] as const;
}

/**
 * Calculate final score with difficulty multiplier
 */
export function calculateDifficultyScore(baseScore: number, level: DifficultyLevel): number {
  const config = DIFFICULTY_CONFIGS[level];
  return Math.round(baseScore * config.scoreMultiplier);
}
