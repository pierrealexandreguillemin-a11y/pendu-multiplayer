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
      <div className="flex flex-col items-center gap-2 text-center">
        {showCategory && category && (
          <p className="text-gray-300">
            Catégorie : <span className="font-semibold text-blue-400">{category}</span>
          </p>
        )}
        <p className="text-gray-200 text-lg">
          Essais restants :{' '}
          <span
            className={`font-bold ${
              remainingAttempts <= Math.ceil(maxErrors * 0.25)
                ? 'text-red-400'
                : remainingAttempts <= Math.ceil(maxErrors * 0.5)
                  ? 'text-orange-400'
                  : 'text-green-400'
            }`}
          >
            {remainingAttempts}
          </span>
        </p>
      </div>
    );
  }

  const isWin = status === 'won';

  return (
    <div
      className={`
        flex flex-col items-center gap-4 p-6 rounded-xl border
        ${isWin ? 'bg-green-500/15 border-green-500/40' : 'bg-red-500/15 border-red-500/40'}
      `}
      role="alert"
    >
      <h2 className={`text-2xl sm:text-3xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
        {isWin ? 'Bravo !' : 'Perdu !'}
      </h2>

      <p className="text-gray-200">
        {isWin ? 'Tu as trouvé le mot !' : `Tu n'as pas trouvé le mot...`}
      </p>

      {/* Score display */}
      {score !== undefined && (
        <div className="flex flex-col items-center gap-1">
          {isWin ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-xl font-bold text-yellow-400">+{score} points</span>
              </div>
              {sessionScore !== undefined && sessionScore > 0 && (
                <span className="text-sm text-gray-300">Total session: {sessionScore + score}</span>
              )}
            </>
          ) : (
            <div className="text-center">
              <span className="text-2xl block mb-1">💀</span>
              <span className="text-xl font-bold text-red-400">GAME OVER</span>
              {sessionScore !== undefined && (
                <p className="text-lg text-gray-300 mt-1">
                  Score final: <span className="text-yellow-400 font-bold">{sessionScore}</span>{' '}
                  points
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        {/* GAME OVER (defeat): only back to menu */}
        {!isWin && onBackToMenu && (
          <button
            onClick={onBackToMenu}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-red-600 hover:bg-red-700 text-white
              transition-all duration-150
            "
          >
            Retour accueil
          </button>
        )}

        {/* Victory: can play again */}
        {isWin && onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-green-600 hover:bg-green-700 text-white
              transition-all duration-150
            "
          >
            Rejouer
          </button>
        )}

        {/* Victory: can see leaderboard */}
        {isWin && onShowLeaderboard && (
          <button
            onClick={onShowLeaderboard}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-yellow-600 hover:bg-yellow-700 text-white
              transition-all duration-150
            "
          >
            Classement
          </button>
        )}

        {/* Victory: optional back to menu */}
        {isWin && onBackToMenu && (
          <button
            onClick={onBackToMenu}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-white/10 hover:bg-white/20 text-gray-200
              transition-all duration-150
            "
          >
            Menu
          </button>
        )}
      </div>
    </div>
  );
}
