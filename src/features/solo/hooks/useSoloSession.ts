/**
 * Solo Session Hook - Arcade-style cumulative scoring
 * DOMAIN LAYER - Pure business logic
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { calculateScore } from '@/lib/game-engine';

interface UseSoloSessionOptions {
  playerName: string;
}

export function useSoloSession({ playerName }: UseSoloSessionOptions) {
  const { gameState, displayWord, startGame, guess, reset } = useGameLogic();
  const { addEntry } = useLeaderboardStore();

  const [sessionScore, setSessionScore] = useState(0);
  const [wordsWon, setWordsWon] = useState(0);
  const hasRecordedRef = useRef(false);

  const wordScore = gameState ? calculateScore(gameState.word) : 0;

  // Record on DEFEAT (GAME OVER)
  useEffect(() => {
    if (gameState?.status === 'lost' && playerName && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: 'solo',
        score: sessionScore,
        word: `${wordsWon} mots`,
        errors: gameState.errors,
        won: false,
      });
    }
  }, [gameState?.status, playerName, sessionScore, wordsWon, addEntry, gameState?.errors]);

  const startSession = useCallback(() => {
    setSessionScore(0);
    setWordsWon(0);
    hasRecordedRef.current = false;
    startGame();
  }, [startGame]);

  const continueSession = useCallback(() => {
    if (gameState) {
      setSessionScore((prev) => prev + calculateScore(gameState.word));
      setWordsWon((prev) => prev + 1);
    }
    startGame();
  }, [gameState, startGame]);

  const endSession = useCallback(() => {
    hasRecordedRef.current = false;
    setSessionScore(0);
    setWordsWon(0);
    reset();
  }, [reset]);

  return {
    gameState,
    displayWord,
    guess,
    sessionScore,
    wordsWon,
    wordScore,
    startSession,
    continueSession,
    endSession,
  };
}
