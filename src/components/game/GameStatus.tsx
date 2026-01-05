'use client';

import type { GameStatus as GameStatusType } from '@/types/game';
import { MAX_ERRORS } from '@/types/game';

interface GameStatusProps {
  status: GameStatusType;
  errors: number;
  category?: string;
  score?: number;
  onPlayAgain?: () => void;
  onBackToMenu?: () => void;
  onShowLeaderboard?: () => void;
}

/**
 * Shows game status: playing info or end game result
 */
export function GameStatus({
  status,
  errors,
  category,
  score,
  onPlayAgain,
  onBackToMenu,
  onShowLeaderboard,
}: GameStatusProps) {
  const remainingAttempts = MAX_ERRORS - errors;

  if (status === 'playing') {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        {category && (
          <p className="text-gray-600">
            Catégorie : <span className="font-semibold text-blue-600">{category}</span>
          </p>
        )}
        <p className="text-lg">
          Essais restants :{' '}
          <span
            className={`font-bold ${
              remainingAttempts <= 2
                ? 'text-red-500'
                : remainingAttempts <= 4
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
      {score !== undefined && score > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span className="text-xl font-bold text-yellow-600">+{score} points</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className={`
              px-6 py-3 rounded-lg font-semibold
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${
                isWin
                  ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
                  : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
              }
            `}
          >
            Rejouer
          </button>
        )}

        {onBackToMenu && (
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

        {onShowLeaderboard && (
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
      </div>
    </div>
  );
}
