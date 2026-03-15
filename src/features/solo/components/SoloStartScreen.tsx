'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';
import { CategorySelector } from '@/components/game/CategorySelector';
import { DifficultySelector } from '@/components/game/DifficultySelector';
import { Input } from '@/components/ui/input';
import { getWordCountByCategory } from '@/lib/words-difficulty';
import { useDifficultyStore } from '@/stores/difficulty';
import type { WordCategory } from '@/lib/categories';
import Link from 'next/link';

interface SoloStartScreenProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStart: (category: WordCategory | null) => void;
  onShowLeaderboard: () => void;
}

export function SoloStartScreen({
  playerName,
  onPlayerNameChange,
  onStart,
  onShowLeaderboard,
}: SoloStartScreenProps) {
  const [category, setCategory] = useState<WordCategory | null>(null);
  const { level: difficulty } = useDifficultyStore();

  // Auto-clear category when it has 0 words for current difficulty
  useEffect(() => {
    if (category === null) return;
    const counts = getWordCountByCategory(difficulty);
    if (counts[category] === 0) {
      queueMicrotask(() => setCategory(null));
    }
  }, [difficulty, category]);

  const canStart = playerName.trim().length > 0;

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
          <div className="space-y-1">
            <label htmlFor="solo-name" className="block text-sm text-gray-400">
              Ton pseudo
            </label>
            <Input
              id="solo-name"
              placeholder="Ex: Marie"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-center"
              aria-required="true"
            />
          </div>

          <DifficultySelector className="my-4" />

          <CategorySelector selected={category} onSelect={setCategory} difficulty={difficulty} />

          <button
            onClick={() => onStart(category)}
            disabled={!canStart}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xl font-semibold rounded-xl transition-all"
          >
            Commencer
          </button>
          {!canStart && <p className="text-xs text-yellow-400">Entre ton pseudo pour commencer</p>}
          <button
            onClick={onShowLeaderboard}
            className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-yellow-400 font-semibold rounded-xl transition-all"
          >
            Classement
          </button>
        </div>

        <Link
          href="/"
          className="inline-block mt-6 text-gray-400 hover:text-white transition-colors py-2"
        >
          ← Retour au menu
        </Link>
      </GlassCard>
    </PageTransition>
  );
}
