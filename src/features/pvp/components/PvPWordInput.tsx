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
  return (
    <GlassCard className="p-8 max-w-md w-full" spotlightColor="rgba(236, 72, 153, 0.15)">
      <h2 className="text-xl font-bold text-white text-center mb-6">Choisis ton mot</h2>

      <div className="space-y-4">
        <Input
          placeholder="Le mot à deviner"
          value={customWord}
          onChange={(e) => onWordChange(e.target.value.toUpperCase())}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center text-xl font-mono"
          autoComplete="off"
        />

        <Input
          placeholder="Indice (optionnel)"
          value={customCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />

        <p className="text-gray-400 text-xs text-center">
          Les accents seront ignorés pour les devinettes
        </p>

        <Button
          onClick={onStart}
          disabled={!customWord.trim()}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50"
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
