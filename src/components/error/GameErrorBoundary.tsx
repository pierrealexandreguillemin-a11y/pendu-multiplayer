'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface GameErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Mode label for the error title (e.g. "Solo", "Coop", "PvP") */
  modeLabel: string;
  /** Log prefix for console.error (e.g. "Solo", "Coop", "PvP") */
  logPrefix: string;
  /** Button color classes for the retry button */
  retryButtonClass: string;
}

/**
 * Shared error boundary component for game mode pages.
 * ISO/IEC 25010 - Reliability / Fault tolerance.
 */
export function GameErrorBoundary({
  error,
  reset,
  modeLabel,
  logPrefix,
  retryButtonClass,
}: GameErrorBoundaryProps) {
  useEffect(() => {
    console.error(`[${logPrefix}] Error:`, error);
  }, [error, logPrefix]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl backdrop-blur-sm">
        <h1 className="mb-2 text-2xl font-bold text-white">Erreur dans le mode {modeLabel}</h1>
        <p className="mb-6 text-gray-300">
          Une erreur s&apos;est produite pendant la partie. Vous pouvez réessayer ou revenir à
          l&apos;accueil.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-gray-500">Code&nbsp;: {error.digest}</p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className={`w-full rounded-xl px-6 py-3 font-semibold text-white transition-all duration-200 focus:outline-none ${retryButtonClass}`}
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
