/**
 * Types for the Hangman game engine
 * Pure domain types - no external dependencies
 */

/** Uppercase letter A-Z */
export type Letter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

/** Game status */
export type GameStatus = 'playing' | 'won' | 'lost';

/** Game mode */
export type GameMode = 'solo' | 'coop' | 'pvp';

/** Maximum errors before losing */
export const MAX_ERRORS = 6;

/** The full alphabet */
export const ALPHABET: Letter[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

/** State of the game */
export interface GameState {
  /** The word to guess (normalized: uppercase, no accents) */
  word: string;
  /** Original word with accents (for display at end) */
  originalWord: string;
  /** Category/hint (optional) */
  category?: string;
  /** Letters that have been correctly guessed */
  correctLetters: Set<Letter>;
  /** Letters that were wrong guesses */
  wrongLetters: Set<Letter>;
  /** Current number of errors (0-6) */
  errors: number;
  /** Current game status */
  status: GameStatus;
}

/** Result of checking a letter */
export interface GuessResult {
  /** The letter that was guessed */
  letter: Letter;
  /** Whether the letter was in the word */
  isCorrect: boolean;
  /** Updated game state */
  state: GameState;
  /** Positions where the letter was found (empty if wrong) */
  positions: number[];
}

/** Word display character: letter, hidden, space, or hyphen */
export type DisplayChar = Letter | '_' | ' ' | '-';

/** Configuration for creating a new game */
export interface GameConfig {
  word: string;
  category?: string;
}
