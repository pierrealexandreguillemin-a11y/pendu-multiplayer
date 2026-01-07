/**
 * Game Engine - Pure functions for Hangman logic
 * NO external dependencies (React, Socket, etc.)
 * 100% testable, pure functions only
 *
 * ISO/IEC 25010 - Reliability: Pure functions, deterministic behavior
 * ISO/IEC 5055 - Code Quality: No side effects
 */

import type { GameState, GameConfig, GuessResult, Letter, DisplayChar } from '@/types/game';
import { MAX_ERRORS, ALPHABET } from '@/types/game';
import { DIFFICULTY_CONFIGS } from './difficulty-config';

/**
 * Normalize a word: uppercase + remove accents
 * Preserves spaces and hyphens
 */
export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toUpperCase();
}

/**
 * Check if a character is a valid letter (A-Z)
 */
export function isValidLetter(char: string): boolean {
  const upper = char.toUpperCase();
  return ALPHABET.includes(upper as Letter);
}

/**
 * Convert a character to uppercase Letter type
 */
export function toLetter(char: string): Letter {
  return char.toUpperCase() as Letter;
}

/**
 * Create a new game state from config
 * Supports difficulty-based maxErrors
 */
export function createGame(config: GameConfig): GameState {
  // Determine maxErrors: explicit > difficulty config > default
  let maxErrors = MAX_ERRORS;
  if (config.maxErrors !== undefined) {
    maxErrors = config.maxErrors;
  } else if (config.difficulty) {
    maxErrors = DIFFICULTY_CONFIGS[config.difficulty].maxErrors;
  }

  return {
    word: normalizeWord(config.word),
    originalWord: config.word,
    category: config.category,
    difficulty: config.difficulty,
    maxErrors,
    correctLetters: new Set<Letter>(),
    wrongLetters: new Set<Letter>(),
    errors: 0,
    status: 'playing',
  };
}

/**
 * Get the display representation of the word
 * Shows guessed letters and underscores for hidden ones
 * Preserves spaces and hyphens
 */
export function getDisplayWord(state: GameState): DisplayChar[] {
  return state.word.split('').map((char): DisplayChar => {
    // Preserve spaces and hyphens
    if (char === ' ' || char === '-') {
      return char as DisplayChar;
    }

    // Show letter if guessed, otherwise underscore
    const letter = char as Letter;
    if (state.correctLetters.has(letter)) {
      return letter;
    }

    return '_';
  });
}

/**
 * Check if all letters in the word have been guessed
 */
function checkVictory(state: GameState): boolean {
  for (const char of state.word) {
    // Skip non-letters
    if (!isValidLetter(char)) {
      continue;
    }

    if (!state.correctLetters.has(char as Letter)) {
      return false;
    }
  }
  return true;
}

/**
 * Find all positions of a letter in the word
 */
function findLetterPositions(word: string, letter: Letter): number[] {
  const positions: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letter) {
      positions.push(i);
    }
  }
  return positions;
}

/**
 * Guess a letter and return the result
 * Pure function - returns new state, doesn't mutate input
 */
export function guessLetter(state: GameState, inputLetter: Letter | string): GuessResult {
  const letter = toLetter(inputLetter as string);

  // Can't guess if game is over
  if (state.status !== 'playing') {
    return {
      letter,
      isCorrect: false,
      positions: [],
      state,
    };
  }

  // Already guessed this letter
  if (state.correctLetters.has(letter) || state.wrongLetters.has(letter)) {
    return {
      letter,
      isCorrect: state.correctLetters.has(letter),
      positions: state.correctLetters.has(letter) ? findLetterPositions(state.word, letter) : [],
      state,
    };
  }

  const positions = findLetterPositions(state.word, letter);
  const isCorrect = positions.length > 0;

  // Create new Sets to avoid mutation
  const newCorrectLetters = new Set(state.correctLetters);
  const newWrongLetters = new Set(state.wrongLetters);
  let newErrors = state.errors;

  if (isCorrect) {
    newCorrectLetters.add(letter);
  } else {
    newWrongLetters.add(letter);
    newErrors = state.errors + 1;
  }

  // Create intermediate state for victory check
  const intermediateState: GameState = {
    ...state,
    correctLetters: newCorrectLetters,
    wrongLetters: newWrongLetters,
    errors: newErrors,
    status: 'playing',
  };

  // Determine final status (use state.maxErrors instead of global MAX_ERRORS)
  let finalStatus: GameState['status'] = 'playing';
  if (checkVictory(intermediateState)) {
    finalStatus = 'won';
  } else if (newErrors >= state.maxErrors) {
    finalStatus = 'lost';
  }

  return {
    letter,
    isCorrect,
    positions,
    state: {
      ...intermediateState,
      status: finalStatus,
    },
  };
}

/**
 * Check if the game is over (won or lost)
 */
export function isGameOver(state: GameState): boolean {
  return state.status === 'won' || state.status === 'lost';
}

/**
 * Check if a letter can be guessed
 * (not already guessed and game is still playing)
 */
export function canGuess(state: GameState, letter: Letter | string): boolean {
  if (state.status !== 'playing') {
    return false;
  }

  const normalizedLetter = toLetter(letter as string);
  return !state.correctLetters.has(normalizedLetter) && !state.wrongLetters.has(normalizedLetter);
}

/**
 * Get all guessed letters (both correct and wrong)
 */
export function getGuessedLetters(state: GameState): Set<Letter> {
  return new Set([...state.correctLetters, ...state.wrongLetters]);
}

/**
 * Get remaining attempts (uses state.maxErrors for difficulty support)
 */
export function getRemainingAttempts(state: GameState): number {
  return state.maxErrors - state.errors;
}

/**
 * Calculate score for a word
 * Score = number of letters (spaces, hyphens, etc. don't count)
 */
export function calculateScore(word: string): number {
  // Count only letters A-Z (normalized word is uppercase)
  return word.replace(/[^A-Z]/g, '').length;
}
