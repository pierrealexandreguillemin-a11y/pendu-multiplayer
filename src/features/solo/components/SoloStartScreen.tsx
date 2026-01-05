'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface SoloStartScreenProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStart: () => void;
  onShowLeaderboard: () => void;
}

export function SoloStartScreen({
  playerName,
  onPlayerNameChange,
  onStart,
  onShowLeaderboard,
}: SoloStartScreenProps) {
  return (
    <PageTransition>
      <GlassCard
        className="p-8 max-w-md w-full text-center"
        spotlightColor="rgba(59, 130, 246, 0.15)"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Mode Solo</h1>
        <p className="text-gray-300 mb-6">
          Enchaîne les mots pour accumuler des points. Une erreur de trop = GAME OVER !
        </p>

        <div className="space-y-4">
          <Input
            placeholder="Ton pseudo"
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center"
          />
          <button
            onClick={onStart}
            disabled={!playerName.trim()}
            className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xl font-semibold rounded-xl transition-all"
          >
            Commencer
          </button>
          <button
            onClick={onShowLeaderboard}
            className="w-full py-3 px-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold rounded-xl transition-all"
          >
            Classement
          </button>
        </div>

        <Link
          href="/"
          className="inline-block mt-6 text-gray-400 hover:text-white transition-colors"
        >
          ← Retour au menu
        </Link>
      </GlassCard>
    </PageTransition>
  );
}
