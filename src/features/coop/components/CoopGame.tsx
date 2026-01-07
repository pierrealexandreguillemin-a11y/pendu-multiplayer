'use client';

import { BalloonDisplay } from '@/components/game/BalloonDisplay';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import type { GameState, Letter, DisplayChar, ConnectionStatus } from '@/types/game';

interface CoopGameProps {
  gameState: GameState;
  displayWord: DisplayChar[];
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

export function CoopGame({
  gameState,
  displayWord,
  status,
  connectedPeers,
  sessionScore,
  wordsWon,
  wordScore,
  onGuess,
  onContinue,
  onQuit,
  onShowLeaderboard,
}: CoopGameProps) {
  const isGameOver = gameState.status !== 'playing';

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 max-w-lg w-full">
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
        <span className={`text-sm ${status === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
          {status === 'connected' ? '● Connecté' : '○ Déconnecté'}
        </span>
      </div>

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

      <div className="my-6 text-white">
        <BalloonDisplay errors={gameState.errors} maxErrors={gameState.maxErrors} />
      </div>

      <div className="mb-6 text-white">
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
    </div>
  );
}
