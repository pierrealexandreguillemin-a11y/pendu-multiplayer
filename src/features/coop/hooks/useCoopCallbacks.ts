/**
 * Coop Callbacks Hook - User action handlers for Coop session
 */

import { useCallback } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { calculateScore } from '@/lib/game-engine';
import { calculateDifficultyScore } from '@/lib/difficulty-config';
import type { Letter } from '@/types/game';
import type { CoopPhase } from './useCoopSession';
import type { CoopPlayer } from './useCoopRoom';
import { useMultiplayerCallbacks } from '@/features/multiplayer';

export interface CoopCallbacksOptions {
  playerName: string;
  joinId: string;
  peer: ReturnType<typeof usePeerConnection>;
  game: ReturnType<typeof useGameLogic>;
  isMyTurn: boolean;
  phase: CoopPhase;
  setPlayers: React.Dispatch<React.SetStateAction<CoopPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  setPhase: (phase: CoopPhase) => void;
  setSessionScore: React.Dispatch<React.SetStateAction<number>>;
  setWordsWon: React.Dispatch<React.SetStateAction<number>>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
  hasRecordedRef: React.MutableRefObject<boolean>;
  advanceTurn: () => void;
}

export function useCoopCallbacks(opts: CoopCallbacksOptions) {
  const {
    playerName,
    joinId,
    peer,
    game,
    isMyTurn,
    phase,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    startBroadcastSentRef,
    hasRecordedRef,
    advanceTurn,
  } = opts;

  const { createRoom, joinRoom, endSession } = useMultiplayerCallbacks({
    playerName,
    joinId,
    peer,
    setPlayers,
    setCurrentTurnIndex,
    setPhase: setPhase as (phase: string) => void,
    setSessionScore,
    setWordsWon,
    startBroadcastSentRef,
  });

  const startGame = useCallback(() => {
    hasRecordedRef.current = false;
    startBroadcastSentRef.current = false;
    game.startGame();
    setPhase('playing');
  }, [game, hasRecordedRef, startBroadcastSentRef, setPhase]);

  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    const currentDifficulty = game.gameState?.difficulty ?? 'normal';
    if (currentWord) {
      setSessionScore(
        (prev) => prev + calculateDifficultyScore(calculateScore(currentWord), currentDifficulty)
      );
      setWordsWon((prev) => prev + 1);
    }
    hasRecordedRef.current = false;
    startBroadcastSentRef.current = false;
    game.startGame();
  }, [game, hasRecordedRef, startBroadcastSentRef, setSessionScore, setWordsWon]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      if (!isMyTurn && phase === 'playing') {
        console.warn('[Coop] Not your turn!');
        return;
      }
      game.guess(letter);
      peer.sendMessage({ type: 'guess', payload: { letter } });
      if (peer.isHost) advanceTurn();
    },
    [game, peer, isMyTurn, phase, advanceTurn]
  );

  return { createRoom, joinRoom, startGame, continueSession, handleGuess, endSession };
}
