'use client';

import { MultiplayerLobby } from '@/features/multiplayer';
import { CategorySelector } from '@/components/game/CategorySelector';
import type { WordCategory } from '@/lib/categories';

interface CoopLobbyProps {
  playerName: string;
  joinId: string;
  isConnecting?: boolean;
  isHost?: boolean;
  error?: string | null;
  selectedCategory: WordCategory | null;
  onCategoryChange: (category: WordCategory | null) => void;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function CoopLobby({
  selectedCategory,
  onCategoryChange,
  isHost,
  ...props
}: CoopLobbyProps) {
  return (
    <>
      <MultiplayerLobby
        {...props}
        title="Mode Coop"
        spotlightColor="rgba(34, 197, 94, 0.15)"
        createButtonClass="bg-green-700 hover:bg-green-800"
        createButtonLabel="Créer une partie"
        joinButtonLabel="Rejoindre"
        idPrefix="coop"
      />
      {isHost && (
        <CategorySelector
          selected={selectedCategory}
          onSelect={onCategoryChange}
          className="mt-4"
        />
      )}
    </>
  );
}
