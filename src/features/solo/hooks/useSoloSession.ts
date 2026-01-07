/**
 * Solo Session Hook - Arcade-style cumulative scoring
 * DOMAIN LAYER - Pure business logic
 *
 * ISO/IEC 25010 - Reliability: Session memory prevents word repetition
 * Supports difficulty levels with configurable maxErrors
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { useSessionMemory } from '@/hooks/useSessionMemory';
import { useDifficultyStore, useDifficultyConfig } from '@/stores/difficulty';
import { calculateScore } from '@/lib/game-engine';
import { getRandomWordByDifficulty } from '@/lib/words-difficulty';

interface UseSoloSessionOptions {
  playerName: string;
}

export function useSoloSession({ playerName }: UseSoloSessionOptions) {
  const { gameState, displayWord, startGame, guess, reset } = useGameLogic();
  const { addEntry } = useLeaderboardStore();
  const sessionMemory = useSessionMemory();
  const { level: difficulty } = useDifficultyStore();
  const difficultyConfig = useDifficultyConfig();

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
        difficulty: gameState.difficulty,
      });
    }
  }, [
    gameState?.status,
    playerName,
    sessionScore,
    wordsWon,
    addEntry,
    gameState?.errors,
    gameState?.difficulty,
  ]);

  // Start a new session with fresh word selection
  const startSession = useCallback(() => {
    setSessionScore(0);
    setWordsWon(0);
    hasRecordedRef.current = false;
    sessionMemory.reset();

    // Get word based on difficulty (no repetition via session memory)
    const wordEntry = getRandomWordByDifficulty(difficulty, sessionMemory.usedWords);
    if (wordEntry) {
      startGame(wordEntry.word, wordEntry.category, difficulty);
    } else {
      // Fallback if no words for difficulty (shouldn't happen)
      startGame(undefined, undefined, difficulty);
    }
  }, [startGame, sessionMemory, difficulty]);

  // Continue session with next word
  const continueSession = useCallback(() => {
    if (gameState) {
      setSessionScore((prev) => prev + calculateScore(gameState.word));
      setWordsWon((prev) => prev + 1);
    }

    // Get next word (no repetition)
    const wordEntry = getRandomWordByDifficulty(difficulty, sessionMemory.usedWords);
    if (wordEntry) {
      startGame(wordEntry.word, wordEntry.category, difficulty);
    } else {
      // All words used - reset and continue
      sessionMemory.reset();
      const resetWord = getRandomWordByDifficulty(difficulty);
      if (resetWord) {
        startGame(resetWord.word, resetWord.category, difficulty);
      }
    }
  }, [gameState, startGame, sessionMemory, difficulty]);

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
    // Difficulty info for UI
    difficulty,
    difficultyConfig,
    // Actions
    startSession,
    continueSession,
    endSession,
  };
}
