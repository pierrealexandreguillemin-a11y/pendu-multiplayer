'use client';

import { GameErrorBoundary } from '@/components/error/GameErrorBoundary';

/**
 * Route error boundary for the Solo game segment.
 * ISO/IEC 25010 - Reliability / Fault tolerance.
 */
export default function SoloError({
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
      modeLabel="Solo"
      logPrefix="Solo"
      retryButtonClass="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:ring-4 focus:ring-blue-500/50"
    />
  );
}
