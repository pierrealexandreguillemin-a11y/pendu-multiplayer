/**
 * Category Selector - UI Component
 * Presentation Layer - Category selection chip grid
 *
 * ISO/IEC 25010 - Usability: Clear visual feedback for selection
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { VALID_CATEGORIES, type WordCategory } from '@/lib/categories';
import { getWordCountByCategory } from '@/lib/words-difficulty';
import type { DifficultyLevel } from '@/types/difficulty';

interface CategorySelectorProps {
  selected: WordCategory | null;
  onSelect: (category: WordCategory | null) => void;
  difficulty?: DifficultyLevel;
  className?: string;
}

export function CategorySelector({
  selected,
  onSelect,
  difficulty,
  className,
}: CategorySelectorProps) {
  const counts = useMemo(() => getWordCountByCategory(difficulty), [difficulty]);

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm text-gray-400 text-center">Catégorie</label>

      <div
        className="flex flex-wrap gap-2 justify-center"
        role="radiogroup"
        aria-label="Catégorie de mots"
      >
        {/* "Toutes" chip */}
        <button
          role="radio"
          aria-checked={selected === null}
          onClick={() => onSelect(null)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg border transition-all',
            selected === null
              ? 'bg-white/20 border-white/40 text-white font-medium'
              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
          )}
        >
          Toutes
        </button>

        {/* Category chips */}
        {VALID_CATEGORIES.map((cat) => {
          const count = counts[cat];
          const isSelected = selected === cat;
          const isDisabled = count === 0;

          return (
            <button
              key={cat}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => onSelect(cat)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-all',
                isDisabled && 'opacity-30 cursor-not-allowed',
                isSelected
                  ? 'bg-white/20 border-white/40 text-white font-medium'
                  : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
