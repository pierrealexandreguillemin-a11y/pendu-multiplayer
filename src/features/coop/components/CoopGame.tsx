'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { BalloonDisplay } from '@/components/game/BalloonDisplay';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { CONNECTION_STATUS_LABELS } from '@/types/game';
import type { GameState, Letter, DisplayChar, ConnectionStatus } from '@/types/game';

interface CoopGameProps {
  gameState: GameState;
  displayWord: DisplayChar[];
  status: ConnectionStatus;
  connectedPeers: string[];
  sessionScore: number;
  wordsWon: number;
  wordScore: number;
  isMyTurn: boolean;
  currentPlayerName: string | null;
  onGuess: (letter: Letter) => void;
  onContinue: () => void;
  onQuit: () => void;
  onShowLeaderboard: () => void;
}

export function CoopGame({
  gameState,
  displayWord,
  status,
  connectedPeers,
  sessionScore,
  wordsWon,
  wordScore,
  isMyTurn,
  currentPlayerName,
  onGuess,
  onContinue,
  onQuit,
  onShowLeaderboard,
}: CoopGameProps) {
  const isGameOver = gameState.status !== 'playing';

  return (
    <GlassCard
      className="p-4 sm:p-6 max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto"
      hoverScale={false}
      spotlightColor="rgba(34, 197, 94, 0.1)"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Coop ({connectedPeers.length + 1} joueurs)
          </h1>
          <p className="text-sm text-gray-400">
            Score: <span className="text-yellow-400 font-bold">{sessionScore}</span>
            {wordsWon > 0 && <span className="ml-2">({wordsWon} mots)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{CONNECTION_STATUS_LABELS[status]}</span>
          <SoundToggle size="sm" />
        </div>
      </div>

      {/* Turn indicator */}
      {!isGameOver && (
        <div
          className={`text-center py-2 rounded-lg mb-3 text-sm ${
            isMyTurn ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
          }`}
          aria-live="polite"
        >
          {isMyTurn ? "C'est ton tour !" : `Tour de ${currentPlayerName ?? '...'}`}
        </div>
      )}

      <GameStatus
        status={gameState.status}
        errors={gameState.errors}
        maxErrors={gameState.maxErrors}
        category={gameState.category}
        score={wordScore}
        sessionScore={sessionScore}
        onPlayAgain={onContinue}
        onBackToMenu={onQuit}
        onShowLeaderboard={onShowLeaderboard}
      />

      <div className="my-4 text-white">
        <BalloonDisplay errors={gameState.errors} maxErrors={gameState.maxErrors} />
      </div>

      <div className="mb-4 text-white">
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
          disabled={!isMyTurn}
        />
      )}
    </GlassCard>
  );
}
