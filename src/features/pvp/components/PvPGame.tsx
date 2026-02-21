'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { BalloonDisplay } from '@/components/game/BalloonDisplay';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import { SoundToggle } from '@/components/ui/SoundToggle';
import type { GameState, Letter, DisplayChar } from '@/types/game';

interface PvPGameProps {
  gameState: GameState;
  displayWord: DisplayChar[];
  isHost: boolean;
  connectedPeers: string[];
  sessionScore: number;
  wordsWon: number;
  wordScore: number;
  isMyTurn: boolean;
  currentGuesserName: string | null;
  onGuess: (letter: Letter) => void;
  onContinue: () => void;
  onQuit: () => void;
  onShowLeaderboard: () => void;
}

export function PvPGame({
  gameState,
  displayWord,
  isHost,
  connectedPeers,
  sessionScore,
  wordsWon,
  wordScore,
  isMyTurn,
  currentGuesserName,
  onGuess,
  onContinue,
  onQuit,
  onShowLeaderboard,
}: PvPGameProps) {
  const isGameOver = gameState.status !== 'playing';

  return (
    <GlassCard
      className="p-4 sm:p-6 max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto"
      hoverScale={false}
      spotlightColor="rgba(236, 72, 153, 0.1)"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">PvP {isHost && '(Tu fais deviner)'}</h1>
          {!isHost && (
            <p className="text-sm text-gray-400">
              Score: <span className="text-yellow-400 font-bold">{sessionScore}</span>
              {wordsWon > 0 && <span className="ml-2">({wordsWon} mots)</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{connectedPeers.length + 1} joueurs</span>
          <SoundToggle size="sm" />
        </div>
      </div>

      {isHost && (
        <div className="mb-4 p-3 bg-pink-500/20 rounded-lg text-center">
          <p className="text-pink-300 text-sm">Ton mot :</p>
          <p className="text-white font-bold text-xl">{gameState.originalWord}</p>
        </div>
      )}

      {/* Turn indicator for guessers */}
      {!isGameOver && !isHost && (
        <div
          className={`text-center py-2 rounded-lg mb-3 text-sm ${
            isMyTurn ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-gray-400'
          }`}
          aria-live="polite"
        >
          {isMyTurn ? "C'est ton tour !" : `Tour de ${currentGuesserName ?? '...'}`}
        </div>
      )}

      {/* Host sees who's guessing */}
      {!isGameOver && isHost && currentGuesserName && (
        <div
          className="text-center py-2 rounded-lg mb-3 text-sm bg-white/5 text-gray-400"
          aria-live="polite"
        >
          Tour de {currentGuesserName}
        </div>
      )}

      <GameStatus
        status={gameState.status}
        errors={gameState.errors}
        maxErrors={gameState.maxErrors}
        category={gameState.category}
        score={isHost ? 0 : wordScore}
        sessionScore={isHost ? undefined : sessionScore}
        onPlayAgain={isHost ? onContinue : undefined}
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

      {!isGameOver && !isHost && (
        <Keyboard
          correctLetters={gameState.correctLetters}
          wrongLetters={gameState.wrongLetters}
          onLetterClick={onGuess}
          disabled={!isMyTurn}
        />
      )}

      {!isGameOver && isHost && (
        <p className="text-center text-gray-400 text-sm">Attends que les autres devinent...</p>
      )}
    </GlassCard>
  );
}
