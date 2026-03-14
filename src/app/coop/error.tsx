'use client';

import { GameErrorBoundary } from '@/components/error/GameErrorBoundary';

/**
 * Route error boundary for the Coop game segment.
 * ISO/IEC 25010 - Reliability / Fault tolerance.
 */
export default function CoopError({
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
      modeLabel="Coop"
      logPrefix="Coop"
      retryButtonClass="bg-green-700 hover:bg-green-800 hover:shadow-lg hover:shadow-green-500/30 focus:ring-4 focus:ring-green-500/50"
    />
  );
}
