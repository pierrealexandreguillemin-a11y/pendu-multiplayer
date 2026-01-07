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
    // WCAG 2.1 AA - Touch targets minimum 44px (w-11 = 44px)
    const base = `
      w-11 h-11 sm:w-12 sm:h-14
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
