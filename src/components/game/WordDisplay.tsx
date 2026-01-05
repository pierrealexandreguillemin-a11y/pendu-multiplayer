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

  // Calculate responsive font size based on word length
  const wordLength = displayWord.length;
  const getFontSize = () => {
    if (wordLength <= 6) return 'text-3xl sm:text-4xl';
    if (wordLength <= 10) return 'text-2xl sm:text-3xl';
    if (wordLength <= 14) return 'text-xl sm:text-2xl';
    return 'text-lg sm:text-xl';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Word container - no wrapping, horizontal scroll if needed */}
      <div
        className="w-full overflow-x-auto py-2"
        role="status"
        aria-label={`Mot: ${displayWord.join(' ')}`}
      >
        <div className="flex justify-center gap-1 sm:gap-2 min-w-max px-2">
          {displayWord.map((char, index) => (
            <span
              key={index}
              className={`
                ${getFontSize()} font-bold
                flex items-end justify-center
                ${
                  char === '_'
                    ? 'w-6 sm:w-8 border-b-2 border-current text-gray-400 pb-1'
                    : char === ' '
                      ? 'w-3 sm:w-4'
                      : char === '-'
                        ? 'text-gray-400'
                        : status === 'won'
                          ? 'text-green-400 animate-bounce'
                          : status === 'lost'
                            ? 'text-red-400'
                            : 'text-white'
                }
              `}
            >
              {char === '_' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      </div>

      {/* Show original word (with accents) when game is over */}
      {isGameOver && originalWord && (
        <p className={`text-lg ${status === 'won' ? 'text-green-400' : 'text-red-400'}`}>
          Le mot était : <strong>{originalWord}</strong>
        </p>
      )}
    </div>
  );
}
