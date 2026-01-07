/**
 * Zod validation schemas for multiplayer messages and leaderboard
 * ISO/IEC 5055 - Input validation at system boundaries
 */

import { z } from 'zod';
import type { GameMessage, LeaderboardEntry } from '@/types/game';
import { ALPHABET } from '@/types/game';

/** Letter validation */
const LetterSchema = z.enum(ALPHABET);

/** Start game message schema */
const StartGameMessageSchema = z.object({
  type: z.literal('start'),
  payload: z.object({
    word: z.string().min(1),
    category: z.string(),
  }),
});

/** Guess message schema */
const GuessMessageSchema = z.object({
  type: z.literal('guess'),
  payload: z.object({
    letter: LetterSchema,
  }),
});

/** State sync message schema */
const StateMessageSchema = z.object({
  type: z.literal('state'),
  payload: z.object({
    word: z.string().min(1),
    category: z.string(),
    correctLetters: z.array(LetterSchema),
    wrongLetters: z.array(LetterSchema),
    errors: z.number().int().min(0).max(6),
    status: z.enum(['playing', 'won', 'lost']),
  }),
});

/** Restart message schema */
const RestartMessageSchema = z.object({
  type: z.literal('restart'),
  payload: z.object({}).strict(),
});

/** Player join message schema (for 6-player support) */
const PlayerJoinMessageSchema = z.object({
  type: z.literal('player_join'),
  payload: z.object({
    playerId: z.string().min(1),
    playerName: z.string().min(1).max(50),
  }),
});

/** Players update message schema */
const PlayersUpdateMessageSchema = z.object({
  type: z.literal('players_update'),
  payload: z.object({
    players: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(50),
        isHost: z.boolean(),
        isReady: z.boolean(),
        score: z.number().int().min(0),
      })
    ),
    currentTurnIndex: z.number().int().min(0),
  }),
});

/** Turn change message schema */
const TurnChangeMessageSchema = z.object({
  type: z.literal('turn_change'),
  payload: z.object({
    currentTurnIndex: z.number().int().min(0),
    currentPlayerId: z.string().min(1),
  }),
});

/** Combined message schema (discriminated union) */
export const GameMessageSchema = z.discriminatedUnion('type', [
  StartGameMessageSchema,
  GuessMessageSchema,
  StateMessageSchema,
  RestartMessageSchema,
  PlayerJoinMessageSchema,
  PlayersUpdateMessageSchema,
  TurnChangeMessageSchema,
]);

/**
 * Validate incoming message from peer
 * @throws ZodError if validation fails
 */
export function validateGameMessage(data: unknown): GameMessage {
  return GameMessageSchema.parse(data);
}

/**
 * Safe validation that returns null on failure
 */
export function safeValidateGameMessage(data: unknown): GameMessage | null {
  const result = GameMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}

// ============================================================================
// LEADERBOARD VALIDATION
// ============================================================================

/** Game mode validation */
const GameModeSchema = z.enum(['solo', 'coop', 'pvp']);

/** Leaderboard entry schema */
export const LeaderboardEntrySchema = z.object({
  id: z.string().min(1),
  playerName: z.string().min(1).max(50),
  mode: GameModeSchema,
  score: z.number().int().min(0),
  word: z.string().min(1),
  errors: z.number().int().min(0).max(6),
  won: z.boolean(),
  timestamp: z.number().int().positive(),
});

/**
 * Validate leaderboard entry
 * @throws ZodError if validation fails
 */
export function validateLeaderboardEntry(data: unknown): LeaderboardEntry {
  return LeaderboardEntrySchema.parse(data);
}

/**
 * Safe validation for leaderboard entry
 */
export function safeValidateLeaderboardEntry(data: unknown): LeaderboardEntry | null {
  const result = LeaderboardEntrySchema.safeParse(data);
  return result.success ? result.data : null;
}
