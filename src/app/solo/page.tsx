'use client';

import { useGameLogic } from '@/hooks/useGameLogic';
import { HangmanDrawing } from '@/components/game/HangmanDrawing';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import Link from 'next/link';

export default function SoloPage() {
  const { gameState, displayWord, isPlaying, startGame, guess, reset } = useGameLogic();

  // Initial state - show start button
  if (!gameState) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Mode Solo</h1>

          <p className="text-gray-300 mb-8">
            Trouve le mot mystère avant que le pendu ne soit complet ! Tu as 6 essais.
          </p>

          <button
            onClick={() => startGame()}
            className="
              w-full py-4 px-6
              bg-blue-500 hover:bg-blue-600
              text-white text-xl font-semibold
              rounded-xl
              transition-all duration-150
              focus:outline-none focus:ring-4 focus:ring-blue-500/50
            "
          >
            Commencer
          </button>

          <Link
            href="/"
            className="
              inline-block mt-6 text-gray-400 hover:text-white
              transition-colors
            "
          >
            ← Retour au menu
          </Link>
        </div>
      </main>
    );
  }

  const isGameOver = gameState.status !== 'playing';

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mode Solo</h1>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            Menu
          </Link>
        </div>

        {/* Game Status */}
        <div className="mb-6">
          <GameStatus
            status={gameState.status}
            errors={gameState.errors}
            category={gameState.category}
            onPlayAgain={() => startGame()}
            onBackToMenu={reset}
          />
        </div>

        {/* Hangman Drawing */}
        <div className="mb-6 text-white">
          <HangmanDrawing errors={gameState.errors} />
        </div>

        {/* Word Display */}
        <div className="mb-8 text-white">
          <WordDisplay
            displayWord={displayWord}
            status={gameState.status}
            originalWord={isGameOver ? gameState.originalWord : undefined}
          />
        </div>

        {/* Keyboard (hidden when game is over) */}
        {!isGameOver && (
          <div className="mt-6">
            <Keyboard
              correctLetters={gameState.correctLetters}
              wrongLetters={gameState.wrongLetters}
              onLetterClick={guess}
              disabled={!isPlaying}
            />
          </div>
        )}

        {/* Keyboard hint for desktop */}
        {!isGameOver && (
          <p className="text-center text-gray-500 text-sm mt-4 hidden sm:block">
            💡 Tu peux aussi utiliser ton clavier !
          </p>
        )}
      </div>
    </main>
  );
}
