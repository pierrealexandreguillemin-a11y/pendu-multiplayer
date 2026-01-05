'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { HangmanDrawing } from '@/components/game/HangmanDrawing';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import type { GameState, Letter, DisplayChar } from '@/types/game';

interface SoloGameScreenProps {
  playerName: string;
  gameState: GameState;
  displayWord: DisplayChar[];
  sessionScore: number;
  wordsWon: number;
  wordScore: number;
  onGuess: (letter: Letter) => void;
  onContinue: () => void;
  onEnd: () => void;
  onShowLeaderboard: () => void;
}

export function SoloGameScreen({
  playerName,
  gameState,
  displayWord,
  sessionScore,
  wordsWon,
  wordScore,
  onGuess,
  onContinue,
  onEnd,
  onShowLeaderboard,
}: SoloGameScreenProps) {
  const isGameOver = gameState.status !== 'playing';

  return (
    <GlassCard
      className="p-6 sm:p-8 max-w-lg w-full"
      hoverScale={false}
      spotlightColor="rgba(59, 130, 246, 0.1)"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mode Solo</h1>
          <p className="text-sm text-gray-400">
            Score: <span className="text-yellow-400 font-bold">{sessionScore}</span>
            {wordsWon > 0 && <span className="ml-2">({wordsWon} mots)</span>}
          </p>
        </div>
        <span className="text-blue-400 text-sm">{playerName}</span>
      </div>

      <GameStatus
        status={gameState.status}
        errors={gameState.errors}
        category={gameState.category}
        score={wordScore}
        sessionScore={sessionScore}
        onPlayAgain={onContinue}
        onBackToMenu={onEnd}
        onShowLeaderboard={onShowLeaderboard}
      />

      <div className="my-6 text-white">
        <HangmanDrawing errors={gameState.errors} />
      </div>

      <div className="mb-8 text-white">
        <WordDisplay
          displayWord={displayWord}
          status={gameState.status}
          originalWord={isGameOver ? gameState.originalWord : undefined}
        />
      </div>

      {!isGameOver && (
        <Keyboard
          correctLetters={gameState.correctLetters}
          wrongLetters={gameState.wrongLetters}
          onLetterClick={onGuess}
        />
      )}
    </GlassCard>
  );
}
