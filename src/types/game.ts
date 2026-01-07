/**
 * Types for the Hangman game engine
 * Pure domain types - no external dependencies
 *
 * ISO/IEC 25010 - Maintainability: Explicit type definitions
 */

import type { DifficultyLevel } from './difficulty';

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
  /** Difficulty level (optional, defaults to 'normal') */
  difficulty?: DifficultyLevel;
  /** Maximum errors for this game (from difficulty config) */
  maxErrors: number;
  /** Letters that have been correctly guessed */
  correctLetters: Set<Letter>;
  /** Letters that were wrong guesses */
  wrongLetters: Set<Letter>;
  /** Current number of errors */
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
  /** Difficulty level (defaults to 'normal') */
  difficulty?: DifficultyLevel;
  /** Override maxErrors directly (takes precedence over difficulty) */
  maxErrors?: number;
}

// ============================================================================
// MULTIPLAYER MESSAGES (ISO/IEC 5055 - Discriminated Unions for type safety)
// ============================================================================

/** Message: Start game with word and category */
export interface StartGameMessage {
  type: 'start';
  payload: {
    word: string;
    category: string;
  };
}

/** Message: Player guessed a letter */
export interface GuessMessage {
  type: 'guess';
  payload: {
    letter: Letter;
  };
}

/** Message: Sync game state from host */
export interface StateMessage {
  type: 'state';
  payload: {
    word: string;
    category: string;
    correctLetters: Letter[];
    wrongLetters: Letter[];
    errors: number;
    status: GameStatus;
  };
}

/** Message: Restart game */
export interface RestartMessage {
  type: 'restart';
  payload: Record<string, never>;
}

/** Message: Player joined room (for 6-player support) */
export interface PlayerJoinMessage {
  type: 'player_join';
  payload: {
    playerId: string;
    playerName: string;
  };
}

/** Message: Player list update (broadcast by host) */
export interface PlayersUpdateMessage {
  type: 'players_update';
  payload: {
    players: Array<{
      id: string;
      name: string;
      isHost: boolean;
      isReady: boolean;
      score: number;
    }>;
    currentTurnIndex: number;
  };
}

/** Message: Turn changed */
export interface TurnChangeMessage {
  type: 'turn_change';
  payload: {
    currentTurnIndex: number;
    currentPlayerId: string;
  };
}

/** All possible game messages (discriminated union) */
export type GameMessage =
  | StartGameMessage
  | GuessMessage
  | StateMessage
  | RestartMessage
  | PlayerJoinMessage
  | PlayersUpdateMessage
  | TurnChangeMessage;

/** Connection status for multiplayer */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ============================================================================
// LEADERBOARD (Score tracking per mode)
// ============================================================================

/** Entry in the leaderboard */
export interface LeaderboardEntry {
  /** Unique identifier */
  id: string;
  /** Player name */
  playerName: string;
  /** Game mode */
  mode: GameMode;
  /** Score (number of letters in word) */
  score: number;
  /** The word that was guessed */
  word: string;
  /** Number of errors made */
  errors: number;
  /** Whether the player won */
  won: boolean;
  /** Difficulty level (optional for backward compatibility) */
  difficulty?: DifficultyLevel;
  /** Timestamp of game completion */
  timestamp: number;
}
