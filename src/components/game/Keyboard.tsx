'use client';

import type { Letter } from '@/types/game';
import { ALPHABET } from '@/types/game';

interface KeyboardProps {
  correctLetters: Set<Letter>;
  wrongLetters: Set<Letter>;
  onLetterClick: (letter: Letter) => void;
  disabled?: boolean;
}

/**
 * Virtual keyboard for letter selection
 * Shows state of each letter (unused, correct, wrong)
 */
export function Keyboard({
  correctLetters,
  wrongLetters,
  onLetterClick,
  disabled = false,
}: KeyboardProps) {
  const getLetterState = (letter: Letter): 'unused' | 'correct' | 'wrong' => {
    if (correctLetters.has(letter)) return 'correct';
    if (wrongLetters.has(letter)) return 'wrong';
    return 'unused';
  };

  const getButtonClasses = (state: 'unused' | 'correct' | 'wrong'): string => {
    const base = `
      w-8 h-10 sm:w-10 sm:h-12
      flex items-center justify-center
      text-sm sm:text-lg font-semibold
      rounded-lg
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-2
    `;

    switch (state) {
      case 'correct':
        return `${base} bg-green-500 text-white cursor-not-allowed opacity-75`;
      case 'wrong':
        return `${base} bg-red-500 text-white cursor-not-allowed opacity-75`;
      case 'unused':
        return `${base} bg-gray-200 hover:bg-blue-500 hover:text-white active:scale-95 focus:ring-blue-500`;
    }
  };

  // Split alphabet into rows for AZERTY-like layout
  const rows = [
    ALPHABET.slice(0, 10), // A-J
    ALPHABET.slice(10, 19), // K-S
    ALPHABET.slice(19, 26), // T-Z
  ];

  return (
    <div className="flex flex-col items-center gap-2" role="group" aria-label="Clavier virtuel">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-2">
          {row.map((letter) => {
            const state = getLetterState(letter);
            const isDisabled = disabled || state !== 'unused';

            return (
              <button
                key={letter}
                onClick={() => !isDisabled && onLetterClick(letter)}
                disabled={isDisabled}
                className={getButtonClasses(state)}
                aria-label={`Lettre ${letter}${
                  state === 'correct' ? ', correct' : state === 'wrong' ? ', incorrect' : ''
                }`}
                aria-pressed={state !== 'unused'}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
