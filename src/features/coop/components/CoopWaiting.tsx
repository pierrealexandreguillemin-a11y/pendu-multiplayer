'use client';

import { MultiplayerWaiting } from '@/features/multiplayer';
import type { ConnectionStatus } from '@/types/game';

interface CoopWaitingProps {
  peerId: string | null;
  isHost: boolean;
  status: ConnectionStatus;
  connectedPeers: string[];
  onStart: () => void;
  onQuit: () => void;
}

export function CoopWaiting(props: CoopWaitingProps) {
  return (
    <MultiplayerWaiting
      {...props}
      joinPath="/coop"
      spotlightColor="rgba(34, 197, 94, 0.15)"
      codeColorClass="text-green-400"
      startButtonClass="bg-green-700 hover:bg-green-800"
      startButtonLabel="Lancer la partie !"
      startButtonWaitingLabel="Lancer la partie"
      hostTitle="Partage ce code"
      guestTitle="En attente..."
    />
  );
}
