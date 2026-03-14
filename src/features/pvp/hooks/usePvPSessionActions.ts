/**
 * PvP Session Actions - Session lifecycle callbacks (continue, end)
 */

import { useCallback } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { calculateScore } from '@/lib/game-engine';
import { calculateDifficultyScore } from '@/lib/difficulty-config';
import { useMultiplayerCallbacks } from '@/features/multiplayer';

interface PvPSessionActionsOptions {
  game: ReturnType<typeof useGameLogic>;
  peer: ReturnType<typeof usePeerConnection>;
  setPlayers: React.Dispatch<
    React.SetStateAction<
      Array<{ id: string; name: string; isHost: boolean; isReady: boolean; score: number }>
    >
  >;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  setPhase: (phase: 'lobby' | 'waiting' | 'word-input' | 'playing') => void;
  setSessionScore: React.Dispatch<React.SetStateAction<number>>;
  setWordsWon: React.Dispatch<React.SetStateAction<number>>;
  setCustomWord: React.Dispatch<React.SetStateAction<string>>;
  setCustomCategory: React.Dispatch<React.SetStateAction<string>>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
  hasRecordedRef: React.MutableRefObject<boolean>;
}

export function usePvPSessionActions(opts: PvPSessionActionsOptions) {
  const {
    game,
    peer,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    setCustomWord,
    setCustomCategory,
    startBroadcastSentRef,
    hasRecordedRef,
  } = opts;

  // Delegate shared endSession logic to useMultiplayerCallbacks
  const { endSession } = useMultiplayerCallbacks({
    playerName: '',
    joinId: '',
    peer,
    setPlayers,
    setCurrentTurnIndex,
    setPhase: setPhase as (phase: string) => void,
    setSessionScore,
    setWordsWon,
    startBroadcastSentRef,
  });

  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    const currentDifficulty = game.gameState?.difficulty ?? 'normal';
    if (currentWord && !peer.isHost) {
      setSessionScore(
        (prev) => prev + calculateDifficultyScore(calculateScore(currentWord), currentDifficulty)
      );
      setWordsWon((prev) => prev + 1);
    }
    hasRecordedRef.current = false;
    setCustomWord('');
    setCustomCategory('');
    setPhase('word-input');
    peer.sendMessage({ type: 'restart', payload: {} });
  }, [
    game,
    peer,
    setSessionScore,
    setWordsWon,
    hasRecordedRef,
    setCustomWord,
    setCustomCategory,
    setPhase,
  ]);

  return { continueSession, endSession };
}
