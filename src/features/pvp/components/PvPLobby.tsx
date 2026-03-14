'use client';

import { MultiplayerLobby } from '@/features/multiplayer';

interface PvPLobbyProps {
  playerName: string;
  joinId: string;
  isConnecting?: boolean;
  error?: string | null;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function PvPLobby(props: PvPLobbyProps) {
  return (
    <MultiplayerLobby
      {...props}
      title="Mode PvP"
      subtitle="Un joueur choisit le mot, les autres devinent !"
      spotlightColor="rgba(236, 72, 153, 0.15)"
      createButtonClass="bg-pink-700 hover:bg-pink-800 hover:shadow-lg hover:shadow-pink-500/30"
      createButtonLabel="Je choisis le mot"
      joinButtonLabel="Je devine"
      idPrefix="pvp"
    />
  );
}
