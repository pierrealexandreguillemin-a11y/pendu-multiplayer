'use client';

import type { DisplayChar } from '@/types/game';

interface WordDisplayProps {
  displayWord: DisplayChar[];
  status: 'playing' | 'won' | 'lost';
  originalWord?: string;
}

/**
 * Displays the word with blanks for unguessed letters
 * Shows the full word when game is over
 */
export function WordDisplay({ displayWord, status, originalWord }: WordDisplayProps) {
  const isGameOver = status === 'won' || status === 'lost';

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="flex flex-wrap justify-center gap-2 sm:gap-3"
        role="status"
        aria-label={`Mot: ${displayWord.join(' ')}`}
      >
        {displayWord.map((char, index) => (
          <span
            key={index}
            className={`
              w-8 h-10 sm:w-10 sm:h-12
              flex items-center justify-center
              text-xl sm:text-2xl font-bold
              ${
                char === '_'
                  ? 'border-b-4 border-gray-400'
                  : char === ' '
                    ? 'w-4 sm:w-6'
                    : char === '-'
                      ? 'text-gray-500'
                      : status === 'won'
                        ? 'text-green-500 animate-bounce'
                        : status === 'lost'
                          ? 'text-red-500'
                          : 'text-blue-500'
              }
            `}
          >
            {char === '_' ? '' : char}
          </span>
        ))}
      </div>

      {/* Show original word (with accents) when game is over */}
      {isGameOver && originalWord && (
        <p className={`text-lg ${status === 'won' ? 'text-green-600' : 'text-red-600'}`}>
          Le mot était : <strong>{originalWord}</strong>
        </p>
      )}
    </div>
  );
}
