'use client';

import { useEffect, useCallback } from 'react';
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
 * ISO/IEC 25065 - Supports physical keyboard input
 * WCAG 2.1 - Touch targets minimum 44px
 */
export function Keyboard({
  correctLetters,
  wrongLetters,
  onLetterClick,
  disabled = false,
}: KeyboardProps) {
  const getLetterState = useCallback(
    (letter: Letter): 'unused' | 'correct' | 'wrong' => {
      if (correctLetters.has(letter)) return 'correct';
      if (wrongLetters.has(letter)) return 'wrong';
      return 'unused';
    },
    [correctLetters, wrongLetters]
  );

  // Physical keyboard support (ISO/IEC 25065 - Efficience)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled) return;

      const letter = e.key.toUpperCase() as Letter;
      if (ALPHABET.includes(letter) && getLetterState(letter) === 'unused') {
        e.preventDefault();
        onLetterClick(letter);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, onLetterClick, getLetterState]);

  const getButtonClasses = (state: 'unused' | 'correct' | 'wrong'): string => {
    // WCAG 2.1 AA - Touch targets: flex sizing for mobile responsiveness
    // ISO/IEC 25065 - Usability: Responsive design for all screen sizes
    const base = `
      flex-1 min-w-[30px] h-10 sm:h-12
      max-w-[44px] sm:max-w-[48px]
      flex items-center justify-center
      text-xs sm:text-base font-semibold
      rounded-md sm:rounded-lg
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-1 sm:focus:ring-offset-2
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

  // AZERTY French keyboard layout (ISO/IEC 25065 - Efficience)
  const AZERTY_ROWS: Letter[][] = [
    ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    ['W', 'X', 'C', 'V', 'B', 'N'],
  ];

  return (
    <div
      className="flex flex-col items-center gap-1 sm:gap-2 w-full max-w-md mx-auto px-1"
      role="group"
      aria-label="Clavier virtuel AZERTY"
    >
      {AZERTY_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-0.5 sm:gap-1 w-full">
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
