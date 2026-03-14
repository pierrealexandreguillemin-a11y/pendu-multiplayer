'use client';

import type { GameStatus as GameStatusType } from '@/types/game';
import { MAX_ERRORS } from '@/types/game';

interface GameStatusProps {
  status: GameStatusType;
  errors: number;
  /** Maximum errors allowed (from difficulty config) */
  maxErrors?: number;
  category?: string;
  /** Whether to show category hint (difficulty-based) */
  showCategory?: boolean;
  score?: number;
  sessionScore?: number;
  onPlayAgain?: () => void;
  onBackToMenu?: () => void;
  onShowLeaderboard?: () => void;
}

function attemptsColor(remaining: number, maxErrors: number): string {
  if (remaining <= Math.ceil(maxErrors * 0.25)) return 'text-red-400';
  if (remaining <= Math.ceil(maxErrors * 0.5)) return 'text-orange-400';
  return 'text-green-400';
}

interface PlayingStatusProps {
  remainingAttempts: number;
  maxErrors: number;
  category?: string;
  showCategory: boolean;
}

function PlayingStatus({
  remainingAttempts,
  maxErrors,
  category,
  showCategory,
}: PlayingStatusProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {showCategory && category && (
        <p className="text-gray-300">
          Catégorie : <span className="font-semibold text-blue-400">{category}</span>
        </p>
      )}
      <p className="text-gray-200 text-lg">
        Essais restants :{' '}
        <span className={`font-bold ${attemptsColor(remainingAttempts, maxErrors)}`}>
          {remainingAttempts}
        </span>
      </p>
    </div>
  );
}

interface WinScoreProps {
  score: number;
  sessionScore?: number;
}

function WinScore({ score, sessionScore }: WinScoreProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">🏆</span>
      <span className="text-xl font-bold text-yellow-400">+{score} points</span>
      {sessionScore !== undefined && sessionScore > 0 && (
        <span className="text-sm text-gray-300 ml-2">Total session: {sessionScore + score}</span>
      )}
    </div>
  );
}

interface LossScoreProps {
  sessionScore?: number;
}

function LossScore({ sessionScore }: LossScoreProps) {
  return (
    <div className="text-center">
      <span className="text-2xl block mb-1">💀</span>
      <span className="text-xl font-bold text-red-400">GAME OVER</span>
      {sessionScore !== undefined && (
        <p className="text-lg text-gray-300 mt-1">
          Score final: <span className="text-yellow-400 font-bold">{sessionScore}</span> points
        </p>
      )}
    </div>
  );
}

interface EndGameButtonsProps {
  isWin: boolean;
  onPlayAgain?: () => void;
  onBackToMenu?: () => void;
  onShowLeaderboard?: () => void;
}

function EndGameButtons({
  isWin,
  onPlayAgain,
  onBackToMenu,
  onShowLeaderboard,
}: EndGameButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-2">
      {!isWin && onBackToMenu && (
        <button
          onClick={onBackToMenu}
          className="px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-all duration-150"
        >
          Retour accueil
        </button>
      )}
      {isWin && onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-150"
        >
          Rejouer
        </button>
      )}
      {isWin && onShowLeaderboard && (
        <button
          onClick={onShowLeaderboard}
          className="px-6 py-3 rounded-lg font-semibold bg-yellow-600 hover:bg-yellow-700 text-white transition-all duration-150"
        >
          Classement
        </button>
      )}
      {isWin && onBackToMenu && (
        <button
          onClick={onBackToMenu}
          className="px-6 py-3 rounded-lg font-semibold bg-white/10 hover:bg-white/20 text-gray-200 transition-all duration-150"
        >
          Menu
        </button>
      )}
    </div>
  );
}

/**
 * Shows game status: playing info or end game result
 * WCAG AA contrast: all text tested against dark glass background
 */
export function GameStatus({
  status,
  errors,
  maxErrors = MAX_ERRORS,
  category,
  showCategory = true,
  score,
  sessionScore,
  onPlayAgain,
  onBackToMenu,
  onShowLeaderboard,
}: GameStatusProps) {
  const remainingAttempts = maxErrors - errors;

  if (status === 'playing') {
    return (
      <PlayingStatus
        remainingAttempts={remainingAttempts}
        maxErrors={maxErrors}
        category={category}
        showCategory={showCategory}
      />
    );
  }

  const isWin = status === 'won';

  return (
    <div
      className={`flex flex-col items-center gap-4 p-6 rounded-xl border ${isWin ? 'bg-green-500/15 border-green-500/40' : 'bg-red-500/15 border-red-500/40'}`}
      role="alert"
    >
      <h2 className={`text-2xl sm:text-3xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
        {isWin ? 'Bravo !' : 'Perdu !'}
      </h2>
      <p className="text-gray-200">
        {isWin ? 'Tu as trouvé le mot !' : `Tu n'as pas trouvé le mot...`}
      </p>
      {score !== undefined && (
        <div className="flex flex-col items-center gap-1">
          {isWin ? (
            <WinScore score={score} sessionScore={sessionScore} />
          ) : (
            <LossScore sessionScore={sessionScore} />
          )}
        </div>
      )}
      <EndGameButtons
        isWin={isWin}
        onPlayAgain={onPlayAgain}
        onBackToMenu={onBackToMenu}
        onShowLeaderboard={onShowLeaderboard}
      />
    </div>
  );
}
