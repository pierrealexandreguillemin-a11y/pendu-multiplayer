/**
 * Room & Player Types - Domain Layer
 * Types for multiplayer room management (up to 6 players)
 *
 * ISO/IEC 25010 - Maintainability: Explicit type definitions
 * ISO/IEC 5055 - Code Quality: Discriminated unions for state safety
 */

import type { GameMode } from './game';

/** Maximum players allowed in a room */
export const MAX_PLAYERS = 6;

/** Minimum players to start a game */
export const MIN_PLAYERS = 2;

/**
 * Player in a multiplayer room
 */
export interface Player {
  /** Unique peer ID (from PeerJS) */
  id: string;
  /** Display name */
  name: string;
  /** Whether this player is the room host */
  isHost: boolean;
  /** Whether this player is ready to start */
  isReady: boolean;
  /** Individual score (for PvP and arcade modes) */
  score: number;
  /** Connection timestamp */
  joinedAt: number;
}

/**
 * Room state for multiplayer games
 */
export interface RoomState {
  /** Unique room code (host's peer ID) */
  roomCode: string;
  /** Game mode */
  mode: GameMode;
  /** Players in the room (max 6) */
  players: Player[];
  /** Current turn index (which player is active) */
  currentTurnIndex: number;
  /** Room status */
  status: RoomStatus;
  /** Room creation timestamp */
  createdAt: number;
}

/**
 * Room status
 */
export type RoomStatus = 'waiting' | 'playing' | 'finished';

/**
 * Extended state for Coop mode (turn-based, all guess together)
 */
export interface CoopRoomState extends RoomState {
  mode: 'coop';
  /** All players take turns guessing the same word */
}

/**
 * Extended state for PvP mode (1 vs N)
 */
export interface PvPRoomState extends RoomState {
  mode: 'pvp';
  /** ID of the player who chose the word (host) */
  wordChooser: string;
  /** IDs of players guessing (everyone except word chooser) */
  guessers: string[];
  /** Current guesser index within guessers array */
  currentGuesserIndex: number;
}

// ============================================================================
// Room Messages (P2P communication)
// ============================================================================

/** Message: Player joined the room */
export interface PlayerJoinedMessage {
  type: 'player_joined';
  payload: {
    player: Player;
    players: Player[];
  };
}

/** Message: Player left the room */
export interface PlayerLeftMessage {
  type: 'player_left';
  payload: {
    playerId: string;
    players: Player[];
  };
}

/** Message: Player ready state changed */
export interface PlayerReadyMessage {
  type: 'player_ready';
  payload: {
    playerId: string;
    isReady: boolean;
  };
}

/** Message: Turn changed to next player */
export interface TurnChangedMessage {
  type: 'turn_changed';
  payload: {
    currentTurnIndex: number;
    currentPlayerId: string;
  };
}

/** Message: Room sync (full state) */
export interface RoomSyncMessage {
  type: 'room_sync';
  payload: {
    players: Player[];
    currentTurnIndex: number;
    status: RoomStatus;
  };
}

/** All room-related messages */
export type RoomMessage =
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerReadyMessage
  | TurnChangedMessage
  | RoomSyncMessage;

// ============================================================================
// Pure functions for room management
// ============================================================================

/**
 * Create a new room state
 */
export function createRoom(hostId: string, hostName: string, mode: GameMode): RoomState {
  const host: Player = {
    id: hostId,
    name: hostName,
    isHost: true,
    isReady: true,
    score: 0,
    joinedAt: Date.now(),
  };

  return {
    roomCode: hostId,
    mode,
    players: [host],
    currentTurnIndex: 0,
    status: 'waiting',
    createdAt: Date.now(),
  };
}

/**
 * Add a player to the room
 * Returns null if room is full
 */
export function addPlayer(room: RoomState, playerId: string, playerName: string): RoomState | null {
  if (room.players.length >= MAX_PLAYERS) {
    return null;
  }

  // Check if player already exists
  if (room.players.some((p) => p.id === playerId)) {
    return room;
  }

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    isHost: false,
    isReady: false,
    score: 0,
    joinedAt: Date.now(),
  };

  return {
    ...room,
    players: [...room.players, newPlayer],
  };
}

/**
 * Remove a player from the room
 */
export function removePlayer(room: RoomState, playerId: string): RoomState {
  const newPlayers = room.players.filter((p) => p.id !== playerId);

  // Adjust turn index if needed
  let newTurnIndex = room.currentTurnIndex;
  const removedIndex = room.players.findIndex((p) => p.id === playerId);

  if (removedIndex !== -1 && removedIndex < room.currentTurnIndex) {
    newTurnIndex = Math.max(0, newTurnIndex - 1);
  }

  if (newTurnIndex >= newPlayers.length) {
    newTurnIndex = 0;
  }

  return {
    ...room,
    players: newPlayers,
    currentTurnIndex: newTurnIndex,
  };
}

/**
 * Set player ready state
 */
export function setPlayerReady(room: RoomState, playerId: string, isReady: boolean): RoomState {
  return {
    ...room,
    players: room.players.map((p) => (p.id === playerId ? { ...p, isReady } : p)),
  };
}

/**
 * Check if all players are ready
 */
export function allPlayersReady(room: RoomState): boolean {
  return room.players.length >= MIN_PLAYERS && room.players.every((p) => p.isReady);
}

/**
 * Advance to next player's turn
 */
export function nextTurn(room: RoomState): RoomState {
  const nextIndex = (room.currentTurnIndex + 1) % room.players.length;

  return {
    ...room,
    currentTurnIndex: nextIndex,
  };
}

/**
 * Get the current player whose turn it is
 */
export function getCurrentPlayer(room: RoomState): Player | null {
  return room.players[room.currentTurnIndex] ?? null;
}

/**
 * Check if a specific player can play
 */
export function canPlayerAct(room: RoomState, playerId: string): boolean {
  const currentPlayer = getCurrentPlayer(room);
  return currentPlayer?.id === playerId && room.status === 'playing';
}

/**
 * Check if the room is full
 */
export function isRoomFull(room: RoomState): boolean {
  return room.players.length >= MAX_PLAYERS;
}

/**
 * Get player by ID
 */
export function getPlayer(room: RoomState, playerId: string): Player | null {
  return room.players.find((p) => p.id === playerId) ?? null;
}

/**
 * Update player score
 */
export function updatePlayerScore(room: RoomState, playerId: string, score: number): RoomState {
  return {
    ...room,
    players: room.players.map((p) => (p.id === playerId ? { ...p, score } : p)),
  };
}

/**
 * Add to player score
 */
export function addToPlayerScore(room: RoomState, playerId: string, points: number): RoomState {
  return {
    ...room,
    players: room.players.map((p) => (p.id === playerId ? { ...p, score: p.score + points } : p)),
  };
}
