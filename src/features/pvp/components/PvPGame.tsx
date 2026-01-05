'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { HangmanDrawing } from '@/components/game/HangmanDrawing';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import type { GameState, Letter, DisplayChar, ConnectionStatus } from '@/types/game';

interface PvPGameProps {
  gameState: GameState;
  displayWord: DisplayChar[];
  isHost: boolean;
  status: ConnectionStatus;
  connectedPeers: string[];
  sessionScore: number;
  wordsWon: number;
  wordScore: number;
  onGuess: (letter: Letter) => void;
  onContinue: () => void;
  onQuit: () => void;
  onShowLeaderboard: () => void;
}

export function PvPGame({
  gameState,
  displayWord,
  isHost,
  status,
  connectedPeers,
  sessionScore,
  wordsWon,
  wordScore,
  onGuess,
  onContinue,
  onQuit,
  onShowLeaderboard,
}: PvPGameProps) {
  const isGameOver = gameState.status !== 'playing';

  return (
    <GlassCard
      className="p-6 sm:p-8 max-w-lg w-full"
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
        <span className={`text-sm ${status === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
          {connectedPeers.length + 1} joueurs
        </span>
      </div>

      {isHost && (
        <div className="mb-4 p-3 bg-pink-500/20 rounded-lg text-center">
          <p className="text-pink-300 text-sm">Ton mot :</p>
          <p className="text-white font-bold text-xl">{gameState.originalWord}</p>
        </div>
      )}

      <GameStatus
        status={gameState.status}
        errors={gameState.errors}
        category={gameState.category}
        score={isHost ? 0 : wordScore}
        sessionScore={isHost ? undefined : sessionScore}
        onPlayAgain={isHost ? onContinue : undefined}
        onBackToMenu={onQuit}
        onShowLeaderboard={onShowLeaderboard}
      />

      <div className="my-6 text-white">
        <HangmanDrawing errors={gameState.errors} />
      </div>

      <div className="mb-6 text-white">
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
        />
      )}

      {!isGameOver && isHost && (
        <p className="text-center text-gray-500 text-sm">Attends que les autres devinent...</p>
      )}
    </GlassCard>
  );
}
