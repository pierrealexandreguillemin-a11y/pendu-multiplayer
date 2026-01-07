/**
 * Difficulty Selector - UI Component
 * Presentation Layer - Difficulty level selection
 *
 * ISO/IEC 25010 - Usability: Clear visual feedback for selection
 */

'use client';

import { cn } from '@/lib/utils';
import { useDifficultyStore, useDifficultyConfig } from '@/stores/difficulty';
import { DIFFICULTY_CONFIGS, getAllDifficultyLevels } from '@/lib/difficulty-config';
import type { DifficultyLevel } from '@/types/difficulty';

interface DifficultySelectorProps {
  className?: string;
}

const DIFFICULTY_COLORS: Record<DifficultyLevel, { bg: string; border: string; text: string }> = {
  easy: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-400',
  },
  normal: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-400',
  },
  hard: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-400',
  },
};

export function DifficultySelector({ className }: DifficultySelectorProps) {
  const { level, setLevel } = useDifficultyStore();
  const currentConfig = useDifficultyConfig();
  const difficulties = getAllDifficultyLevels();

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm text-gray-400 text-center">Difficulté</label>

      {/* Segmented control */}
      <div className="flex rounded-xl overflow-hidden border border-white/10">
        {difficulties.map((diff) => {
          const config = DIFFICULTY_CONFIGS[diff];
          const colors = DIFFICULTY_COLORS[diff];
          const isSelected = level === diff;

          return (
            <button
              key={diff}
              onClick={() => setLevel(diff)}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                isSelected
                  ? cn(colors.bg, colors.text, 'border-b-2', colors.border)
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Current difficulty info */}
      <div
        className={cn(
          'text-xs text-center p-2 rounded-lg',
          DIFFICULTY_COLORS[level].bg,
          DIFFICULTY_COLORS[level].text
        )}
      >
        <span className="font-medium">{currentConfig.maxErrors} erreurs max</span>
        {!currentConfig.showCategory && <span> • Sans indice</span>}
      </div>
    </div>
  );
}
