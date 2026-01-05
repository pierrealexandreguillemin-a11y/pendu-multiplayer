'use client';

import { useState, useCallback, useEffect } from 'react';
import type { GameState, Letter, DisplayChar } from '@/types/game';
import { createGame, guessLetter, getDisplayWord, canGuess } from '@/lib/game-engine';
import { getRandomWord } from '@/lib/words';

interface UseGameLogicReturn {
  /** Current game state */
  gameState: GameState | null;
  /** Display representation of the word */
  displayWord: DisplayChar[];
  /** Whether the game is currently active */
  isPlaying: boolean;
  /** Start a new game with optional custom word */
  startGame: (customWord?: string, category?: string) => void;
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
 */
export function useGameLogic(): UseGameLogicReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const displayWord: DisplayChar[] = gameState ? getDisplayWord(gameState) : [];

  const isPlaying = gameState !== null && gameState.status === 'playing';

  const startGame = useCallback((customWord?: string, category?: string) => {
    if (customWord) {
      setGameState(createGame({ word: customWord, category }));
    } else {
      const { word, category: randomCategory } = getRandomWord();
      setGameState(createGame({ word, category: randomCategory }));
    }
  }, []);

  const guess = useCallback(
    (letter: Letter) => {
      if (!gameState) return;
      if (!canGuess(gameState, letter)) return;

      const result = guessLetter(gameState, letter);
      setGameState(result.state);
    },
    [gameState]
  );

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
