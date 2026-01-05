'use client';

import { MAX_ERRORS } from '@/types/game';

interface HangmanDrawingProps {
  errors: number;
}

/**
 * SVG drawing of the hangman
 * Shows progressive body parts based on error count (0-6)
 */
export function HangmanDrawing({ errors }: HangmanDrawingProps) {
  const clampedErrors = Math.min(Math.max(0, errors), MAX_ERRORS);

  return (
    <svg
      viewBox="0 0 200 250"
      className="w-full max-w-[200px] h-auto mx-auto"
      aria-label={`Pendu: ${clampedErrors} erreur${clampedErrors > 1 ? 's' : ''} sur ${MAX_ERRORS}`}
    >
      {/* Base structure - always visible */}
      {/* Ground */}
      <line
        x1="20"
        y1="230"
        x2="180"
        y2="230"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-gray-400"
      />
      {/* Vertical pole */}
      <line
        x1="60"
        y1="230"
        x2="60"
        y2="20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-gray-400"
      />
      {/* Horizontal beam */}
      <line
        x1="60"
        y1="20"
        x2="140"
        y2="20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-gray-400"
      />
      {/* Rope */}
      <line
        x1="140"
        y1="20"
        x2="140"
        y2="50"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-gray-400"
      />

      {/* Body parts - shown progressively */}
      {/* 1. Head */}
      {clampedErrors >= 1 && (
        <circle
          cx="140"
          cy="70"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-red-500 animate-[fadeIn_0.3s_ease-out]"
        />
      )}

      {/* 2. Body */}
      {clampedErrors >= 2 && (
        <line
          x1="140"
          y1="90"
          x2="140"
          y2="150"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-red-500 animate-[fadeIn_0.3s_ease-out]"
        />
      )}

      {/* 3. Left arm */}
      {clampedErrors >= 3 && (
        <line
          x1="140"
          y1="110"
          x2="110"
          y2="140"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-red-500 animate-[fadeIn_0.3s_ease-out]"
        />
      )}

      {/* 4. Right arm */}
      {clampedErrors >= 4 && (
        <line
          x1="140"
          y1="110"
          x2="170"
          y2="140"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-red-500 animate-[fadeIn_0.3s_ease-out]"
        />
      )}

      {/* 5. Left leg */}
      {clampedErrors >= 5 && (
        <line
          x1="140"
          y1="150"
          x2="110"
          y2="200"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-red-500 animate-[fadeIn_0.3s_ease-out]"
        />
      )}

      {/* 6. Right leg */}
      {clampedErrors >= 6 && (
        <line
          x1="140"
          y1="150"
          x2="170"
          y2="200"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-red-500 animate-[fadeIn_0.3s_ease-out]"
        />
      )}
    </svg>
  );
}
