'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PvPWordInputProps {
  customWord: string;
  customCategory: string;
  onWordChange: (word: string) => void;
  onCategoryChange: (category: string) => void;
  onStart: () => void;
  onBack: () => void;
}

export function PvPWordInput({
  customWord,
  customCategory,
  onWordChange,
  onCategoryChange,
  onStart,
  onBack,
}: PvPWordInputProps) {
  const canStart = customWord.trim().length >= 2;

  return (
    <GlassCard className="p-8 max-w-md w-full" spotlightColor="rgba(236, 72, 153, 0.15)">
      <h2 className="text-xl font-bold text-white text-center mb-6">Choisis ton mot</h2>

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="pvp-word" className="block text-sm text-gray-400">
            Le mot à deviner
          </label>
          <Input
            id="pvp-word"
            placeholder="Minimum 2 lettres"
            value={customWord}
            onChange={(e) => onWordChange(e.target.value.toUpperCase())}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-center text-xl font-mono"
            autoComplete="off"
            aria-required="true"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pvp-category" className="block text-sm text-gray-400">
            Indice (optionnel)
          </label>
          <Input
            id="pvp-category"
            placeholder="Ex: Animal, Pays..."
            value={customCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
          />
        </div>

        <p className="text-gray-500 text-xs text-center">
          Les accents seront ignorés pour les devinettes
        </p>

        <Button
          onClick={onStart}
          disabled={!canStart}
          className="w-full bg-pink-700 hover:bg-pink-800 disabled:opacity-50"
          size="lg"
        >
          C&apos;est parti !
        </Button>

        <Button onClick={onBack} variant="ghost" size="sm" className="w-full">
          Retour
        </Button>
      </div>
    </GlassCard>
  );
}
