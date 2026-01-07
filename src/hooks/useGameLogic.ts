'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Letter, DisplayChar } from '@/types/game';
import type { DifficultyLevel } from '@/types/difficulty';
import { createGame, guessLetter, getDisplayWord, canGuess } from '@/lib/game-engine';
import { getRandomWord } from '@/lib/words';
import { useSound } from '@/hooks/useSound';

interface UseGameLogicReturn {
  /** Current game state */
  gameState: GameState | null;
  /** Display representation of the word */
  displayWord: DisplayChar[];
  /** Whether the game is currently active */
  isPlaying: boolean;
  /** Start a new game with optional custom word and difficulty */
  startGame: (customWord?: string, category?: string, difficulty?: DifficultyLevel) => void;
  /** Guess a letter */
  guess: (letter: Letter) => void;
  /** Check if a letter can be guessed */
  canGuessLetter: (letter: Letter) => boolean;
  /** Reset to initial state (no game) */
  reset: () => void;
}

/**
 * Hook for managing hangman game logic
 * Provides clean interface between game engine and React components
 * ISO/IEC 25010 - Usability: Audio feedback for user actions
 */
export function useGameLogic(): UseGameLogicReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { play } = useSound();

  // Track previous status for victory/defeat sounds
  const prevStatusRef = useRef<GameState['status'] | null>(null);

  const displayWord: DisplayChar[] = gameState ? getDisplayWord(gameState) : [];

  const isPlaying = gameState !== null && gameState.status === 'playing';

  const startGame = useCallback(
    (customWord?: string, category?: string, difficulty?: DifficultyLevel) => {
      if (customWord) {
        setGameState(createGame({ word: customWord, category, difficulty }));
      } else {
        const { word, category: randomCategory } = getRandomWord();
        setGameState(createGame({ word, category: randomCategory, difficulty }));
      }
    },
    []
  );

  const guess = useCallback(
    (letter: Letter) => {
      if (!gameState) return;
      if (!canGuess(gameState, letter)) return;

      const result = guessLetter(gameState, letter);
      setGameState(result.state);

      // Play sound based on result
      if (result.isCorrect) {
        play('correct');
      } else {
        play('incorrect');
      }
    },
    [gameState, play]
  );

  // Play victory/defeat sounds on game end
  useEffect(() => {
    if (!gameState) {
      prevStatusRef.current = null;
      return;
    }

    const prevStatus = prevStatusRef.current;
    const currentStatus = gameState.status;

    // Only play if status just changed to won/lost
    if (prevStatus === 'playing') {
      if (currentStatus === 'won') {
        play('victory');
      } else if (currentStatus === 'lost') {
        play('defeat');
      }
    }

    prevStatusRef.current = currentStatus;
  }, [gameState, play]);

  const canGuessLetter = useCallback(
    (letter: Letter): boolean => {
      if (!gameState) return false;
      return canGuess(gameState, letter);
    },
    [gameState]
  );

  const reset = useCallback(() => {
    setGameState(null);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();

      // Only handle A-Z keys
      if (key.length === 1 && key >= 'A' && key <= 'Z') {
        const letter = key as Letter;
        if (canGuess(gameState!, letter)) {
          guess(letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameState, guess]);

  return {
    gameState,
    displayWord,
    isPlaying,
    startGame,
    guess,
    canGuessLetter,
    reset,
  };
}
