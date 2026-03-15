/**
 * Coop Refs Hook - Mutable ref synchronization for coop session
 *
 * Extracted from useCoopSession to respect max-lines-per-function (SRP).
 */

import { useEffect, useRef } from 'react';
import type { useGameLogic } from '@/hooks/useGameLogic';
import type { CoopPhase } from './useCoopSession';
import type { CoopPlayer } from './useCoopRoom';
import type { CoopRefs } from './useCoopMessageHandler';

interface UseCoopRefsOptions {
  game: ReturnType<typeof useGameLogic>;
  phase: CoopPhase;
  players: CoopPlayer[];
  currentTurnIndex: number;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

export function useCoopRefs({
  game,
  phase,
  players,
  currentTurnIndex,
  startBroadcastSentRef,
}: UseCoopRefsOptions): CoopRefs {
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

  return {
    gameRef,
    phaseRef,
    playersRef,
    currentTurnIndexRef,
    startBroadcastSentRef,
  };
}
