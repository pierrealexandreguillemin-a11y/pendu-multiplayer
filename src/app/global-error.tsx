'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Global root error boundary — replaces the root layout on unhandled errors.
 * Must provide its own <html> and <body> tags per Next.js App Router spec.
 * ISO/IEC 25010 - Reliability / Fault tolerance.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global] Unhandled error:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="antialiased">
        <main className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl backdrop-blur-sm">
            <h1 className="mb-2 text-2xl font-bold text-white">Erreur inattendue</h1>
            <p className="mb-6 text-gray-300">
              Une erreur critique s&apos;est produite. Vous pouvez réessayer ou revenir à
              l&apos;accueil.
            </p>
            {error.digest && (
              <p className="mb-6 font-mono text-xs text-gray-500">Code&nbsp;: {error.digest}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
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
      </body>
    </html>
  );
}
