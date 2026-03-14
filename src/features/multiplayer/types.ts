/**
 * Shared Multiplayer Types - Common types for coop and pvp modes
 */

export interface MultiplayerPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

export type GameMode = 'coop' | 'pvp';
