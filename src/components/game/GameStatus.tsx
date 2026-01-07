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
 * ISO/IEC 25010 - Usability: Clear feedback with difficulty support
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
          <p className="text-gray-600">
            Catégorie : <span className="font-semibold text-blue-600">{category}</span>
          </p>
        )}
        <p className="text-lg">
          Essais restants :{' '}
          <span
            className={`font-bold ${
              remainingAttempts <= Math.ceil(maxErrors * 0.25)
                ? 'text-red-500'
                : remainingAttempts <= Math.ceil(maxErrors * 0.5)
                  ? 'text-orange-500'
                  : 'text-green-500'
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
        flex flex-col items-center gap-4 p-6 rounded-xl
        ${isWin ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'}
      `}
      role="alert"
    >
      <h2 className={`text-2xl sm:text-3xl font-bold ${isWin ? 'text-green-600' : 'text-red-600'}`}>
        {isWin ? 'Bravo !' : 'Perdu !'}
      </h2>

      <p className="text-gray-700">
        {isWin ? 'Tu as trouvé le mot !' : `Tu n'as pas trouvé le mot...`}
      </p>

      {/* Score display */}
      {score !== undefined && (
        <div className="flex flex-col items-center gap-1">
          {isWin ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-xl font-bold text-yellow-600">+{score} points</span>
              </div>
              {sessionScore !== undefined && sessionScore > 0 && (
                <span className="text-sm text-gray-500">Total session: {sessionScore + score}</span>
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
        {/* GAME OVER (defeat): only back to menu - arcade style */}
        {!isWin && onBackToMenu && (
          <button
            onClick={onBackToMenu}
            className="
              px-6 py-3 rounded-lg font-semibold
              bg-red-500 hover:bg-red-600 text-white
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
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
              bg-green-500 hover:bg-green-600 text-white
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
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
              bg-yellow-500 hover:bg-yellow-600 text-white
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
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
              bg-gray-200 hover:bg-gray-300 text-gray-700
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
            "
          >
            Menu
          </button>
        )}
      </div>
    </div>
  );
}
