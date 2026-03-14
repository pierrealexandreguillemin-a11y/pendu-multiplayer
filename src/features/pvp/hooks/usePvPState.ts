/**
 * PvP State Hook - Refs synchronization and derived values for PvP session
 */

import { useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { calculateScore } from '@/lib/game-engine';
import { calculateDifficultyScore } from '@/lib/difficulty-config';
import type { PvPPhase } from './usePvPSession';
import type { PvPPlayer } from './usePvPRoom';
import type { PvPRefs } from './usePvPMessageHandler';

interface PvPStateOptions {
  game: ReturnType<typeof useGameLogic>;
  phase: PvPPhase;
  players: PvPPlayer[];
  currentTurnIndex: number;
  peer: ReturnType<typeof usePeerConnection>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

interface PvPStateResult {
  refs: PvPRefs;
  guessers: PvPPlayer[];
  currentGuesser: PvPPlayer | null;
  isMyTurn: boolean;
  wordScore: number;
}

export function usePvPState(opts: PvPStateOptions): PvPStateResult {
  const { game, phase, players, currentTurnIndex, peer, startBroadcastSentRef } = opts;

  const gameRef = useRef(game);
  const phaseRef = useRef(phase);
  const playersRef = useRef(players);
  const currentTurnIndexRef = useRef(currentTurnIndex);

  useEffect(() => {
    gameRef.current = game;
    phaseRef.current = phase;
  }, [game, phase]);

  useEffect(() => {
    playersRef.current = players;
    currentTurnIndexRef.current = currentTurnIndex;
  }, [players, currentTurnIndex]);

  const refs: PvPRefs = {
    gameRef,
    phaseRef,
    playersRef,
    currentTurnIndexRef,
    startBroadcastSentRef,
  };

  const guessers = players.filter((p) => !p.isHost);
  const currentGuesser = guessers[currentTurnIndex] ?? null;
  const isMyTurn = !peer.isHost && currentGuesser?.id === peer.peerId;
  const difficulty = game.gameState?.difficulty ?? 'normal';
  const wordScore = game.gameState
    ? calculateDifficultyScore(calculateScore(game.gameState.word), difficulty)
    : 0;

  return { refs, guessers, currentGuesser, isMyTurn, wordScore };
}
