'use client';

import { GameErrorBoundary } from '@/components/error/GameErrorBoundary';

/**
 * Route error boundary for the PvP game segment.
 * ISO/IEC 25010 - Reliability / Fault tolerance.
 */
export default function PvpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GameErrorBoundary
      error={error}
      reset={reset}
      modeLabel="PvP"
      logPrefix="PvP"
      retryButtonClass="bg-pink-700 hover:bg-pink-800 hover:shadow-lg hover:shadow-pink-500/30 focus:ring-4 focus:ring-pink-500/50"
    />
  );
}
