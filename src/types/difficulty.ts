/**
 * Difficulty Types - Domain Layer
 * Type definitions for game difficulty system
 *
 * ISO/IEC 25010 - Maintainability: Type safety
 * ISO/IEC 5055 - Code Quality: Explicit interfaces
 */

/**
 * Available difficulty levels
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

/**
 * Configuration applied to game based on difficulty
 */
export interface DifficultyConfig {
  /** Difficulty level identifier */
  level: DifficultyLevel;

  /** Maximum errors before defeat */
  maxErrors: number;

  /** Show category hint to player */
  showCategory: boolean;

  /** Word length range [min, max] */
  wordLengthRange: readonly [min: number, max: number];

  /** Score multiplier for rankings */
  scoreMultiplier: number;

  /** UI label for display */
  label: string;

  /** Description for UI tooltip */
  description: string;
}

/**
 * Difficulty selection state (for persistence)
 */
export interface DifficultySelection {
  /** Selected difficulty level */
  level: DifficultyLevel;

  /** Timestamp of selection */
  selectedAt: number;
}

/**
 * Type guard for DifficultyLevel
 */
export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return value === 'easy' || value === 'normal' || value === 'hard';
}
