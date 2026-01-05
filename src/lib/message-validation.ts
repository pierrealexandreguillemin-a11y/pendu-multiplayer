/**
 * Zod validation schemas for multiplayer messages
 * ISO/IEC 5055 - Input validation at system boundaries
 */

import { z } from 'zod';
import type { GameMessage } from '@/types/game';
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

/** Combined message schema (discriminated union) */
export const GameMessageSchema = z.discriminatedUnion('type', [
  StartGameMessageSchema,
  GuessMessageSchema,
  StateMessageSchema,
  RestartMessageSchema,
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
