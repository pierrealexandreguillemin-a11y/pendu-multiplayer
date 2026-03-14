'use client';

import { MultiplayerLobby } from '@/features/multiplayer';

interface CoopLobbyProps {
  playerName: string;
  joinId: string;
  isConnecting?: boolean;
  error?: string | null;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function CoopLobby(props: CoopLobbyProps) {
  return (
    <MultiplayerLobby
      {...props}
      title="Mode Coop"
      spotlightColor="rgba(34, 197, 94, 0.15)"
      createButtonClass="bg-green-700 hover:bg-green-800"
      createButtonLabel="Créer une partie"
      joinButtonLabel="Rejoindre"
      idPrefix="coop"
    />
  );
}
