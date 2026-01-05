'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { HangmanDrawing } from '@/components/game/HangmanDrawing';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import { Leaderboard } from '@/components/game/Leaderboard';
import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';
import { Input } from '@/components/ui/input';
import { calculateScore } from '@/lib/game-engine';
import { useLeaderboardStore } from '@/stores/leaderboard';
import Link from 'next/link';

export default function SoloPage() {
  const { gameState, displayWord, isPlaying, startGame, guess, reset } = useGameLogic();
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { addEntry } = useLeaderboardStore();
  const hasRecordedRef = useRef(false);

  // Calculate score when game ends
  const score = gameState?.status === 'won' ? calculateScore(gameState.word) : 0;
  const gameEnded = gameState?.status === 'won' || gameState?.status === 'lost';

  // Record score when game ends (victory or defeat)
  useEffect(() => {
    if (gameEnded && playerName && !hasRecordedRef.current && gameState) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: 'solo',
        score: gameState.status === 'won' ? calculateScore(gameState.word) : 0,
        word: gameState.originalWord,
        errors: gameState.errors,
        won: gameState.status === 'won',
      });
    }
  }, [gameEnded, gameState, playerName, addEntry]);

  // Reset recorded flag when starting new game
  const handleStartGame = () => {
    hasRecordedRef.current = false;
    startGame();
  };

  const handleReset = () => {
    hasRecordedRef.current = false;
    reset();
  };

  // Initial state - show start button
  if (!gameState) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <PageTransition>
          <GlassCard
            className="p-8 max-w-md w-full text-center"
            spotlightColor="rgba(59, 130, 246, 0.15)"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Mode Solo</h1>

            <p className="text-gray-300 mb-6">
              Trouve le mot mystère avant que le pendu ne soit complet ! Tu as 6 essais.
            </p>

            <div className="space-y-4">
              <Input
                placeholder="Ton pseudo"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center"
              />

              <button
                onClick={handleStartGame}
                disabled={!playerName.trim()}
                className="
                  w-full py-4 px-6
                  bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  text-white text-xl font-semibold
                  rounded-xl
                  transition-all duration-200 hover:scale-[1.02]
                  focus:outline-none focus:ring-4 focus:ring-blue-500/50
                "
              >
                Commencer
              </button>

              <button
                onClick={() => setShowLeaderboard(true)}
                className="
                  w-full py-3 px-6
                  bg-yellow-500/20 hover:bg-yellow-500/30
                  text-yellow-400 font-semibold
                  rounded-xl
                  transition-all duration-200
                "
              >
                Voir le classement
              </button>
            </div>

            <Link
              href="/"
              className="
                inline-block mt-6 text-gray-400 hover:text-white
                transition-colors
              "
            >
              ← Retour au menu
            </Link>
          </GlassCard>
        </PageTransition>

        {showLeaderboard && (
          <Leaderboard
            mode="solo"
            onClose={() => setShowLeaderboard(false)}
            spotlightColor="rgba(59, 130, 246, 0.15)"
          />
        )}
      </main>
    );
  }

  const isGameOver = gameState.status !== 'playing';

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <GlassCard
        className="p-6 sm:p-8 max-w-lg w-full"
        hoverScale={false}
        spotlightColor="rgba(59, 130, 246, 0.1)"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mode Solo</h1>
          <span className="text-blue-400 text-sm">{playerName}</span>
        </div>

        {/* Game Status */}
        <div className="mb-6">
          <GameStatus
            status={gameState.status}
            errors={gameState.errors}
            category={gameState.category}
            score={score}
            onPlayAgain={handleStartGame}
            onBackToMenu={handleReset}
            onShowLeaderboard={() => setShowLeaderboard(true)}
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
            Tu peux aussi utiliser ton clavier !
          </p>
        )}
      </GlassCard>

      {showLeaderboard && (
        <Leaderboard
          mode="solo"
          onClose={() => setShowLeaderboard(false)}
          spotlightColor="rgba(59, 130, 246, 0.15)"
        />
      )}
    </main>
  );
}
